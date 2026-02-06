package services

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
)

type GlowPlanService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewGlowPlanService(db *gorm.DB, cfg *config.Config) *GlowPlanService {
	return &GlowPlanService{db: db, cfg: cfg}
}

func (s *GlowPlanService) GetUserGlowPlans(userID uuid.UUID) ([]models.GlowPlan, error) {
	var plans []models.GlowPlan
	err := s.db.Where("user_id = ?", userID).
		Order("priority DESC, created_at DESC").
		Find(&plans).Error
	return plans, err
}

func (s *GlowPlanService) GenerateGlowPlan(userID, analysisID uuid.UUID) ([]models.GlowPlan, error) {
	// Get the analysis to check it exists and belongs to user
	var analysis models.FaceAnalysis
	if err := s.db.Where("id = ? AND user_id = ?", analysisID, userID).First(&analysis).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("analysis not found")
		}
		return nil, err
	}

	// Delete existing plans for this user (regenerate)
	s.db.Where("user_id = ?", userID).Delete(&models.GlowPlan{})

	// Generate AI-powered recommendations based on analysis scores
	recommendations, err := s.generateAIRecommendations(userID, analysisID, &analysis)
	if err != nil {
		return nil, fmt.Errorf("failed to generate recommendations: %w", err)
	}

	// Save to database
	var createdPlans []models.GlowPlan
	for _, rec := range recommendations {
		if err := s.db.Create(&rec).Error; err != nil {
			return nil, err
		}
		createdPlans = append(createdPlans, rec)
	}

	return createdPlans, nil
}

func (s *GlowPlanService) MarkAsCompleted(planID, userID uuid.UUID, isCompleted bool) (*models.GlowPlan, error) {
	var plan models.GlowPlan
	if err := s.db.Where("id = ? AND user_id = ?", planID, userID).First(&plan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("plan not found")
		}
		return nil, err
	}

	plan.IsCompleted = isCompleted
	if isCompleted {
		now := time.Now()
		plan.CompletedAt = &now
	} else {
		plan.CompletedAt = nil
	}

	if err := s.db.Save(&plan).Error; err != nil {
		return nil, err
	}

	return &plan, nil
}

func (s *GlowPlanService) GetUserProgress(userID uuid.UUID) (int, int, error) {
	var total int64
	var completed int64

	if err := s.db.Model(&models.GlowPlan{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return 0, 0, err
	}

	if err := s.db.Model(&models.GlowPlan{}).Where("user_id = ? AND is_completed = ?", userID, true).Count(&completed).Error; err != nil {
		return 0, 0, err
	}

	return int(total), int(completed), nil
}

// AI recommendation types

type glowPlanAIRecommendation struct {
	Category       string `json:"category"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Difficulty     string `json:"difficulty"`
	TimeframeWeeks int    `json:"timeframe_weeks"`
	Priority       int    `json:"priority"`
}

func (s *GlowPlanService) generateAIRecommendations(userID, analysisID uuid.UUID, analysis *models.FaceAnalysis) ([]models.GlowPlan, error) {
	strengthsList := strings.Join(analysis.Strengths, ", ")
	improvementsList := strings.Join(analysis.Improvements, ", ")

	prompt := fmt.Sprintf(`User face analysis scores: overall=%.1f, symmetry=%.1f, jawline=%.1f, skin=%.1f, eye=%.1f, nose=%.1f, lips=%.1f, harmony=%.1f. Strengths: %s. Improvements: %s. Generate 5-7 personalized improvement recommendations as a JSON array with fields: category (one of: jawline, skin, style, fitness, grooming), title (short actionable title), description (2-3 sentence detailed advice), difficulty (one of: easy, medium, hard), timeframe_weeks (integer 1-12), priority (integer 1-5 where 5 is highest). Focus recommendations on the lowest-scoring areas. Return ONLY the JSON array, no markdown formatting, no code fences, no extra text.`,
		analysis.OverallScore,
		analysis.SymmetryScore,
		analysis.JawlineScore,
		analysis.SkinScore,
		analysis.EyeScore,
		analysis.NoseScore,
		analysis.LipsScore,
		analysis.HarmonyScore,
		strengthsList,
		improvementsList,
	)

	reqBody := openAIRequest{
		Model: s.cfg.OpenAIModel,
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: "You are a personalized beauty and self-improvement advisor. You provide actionable, specific recommendations based on facial analysis data. Always respond with ONLY valid JSON, no markdown, no code fences, no explanation text.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		MaxTokens: 2000,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal openai request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.cfg.OpenAIAPIKey)

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("openai api request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read openai response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openai api returned status %d: %s", resp.StatusCode, string(body))
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return nil, fmt.Errorf("failed to parse openai response: %w", err)
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("openai returned no choices")
	}

	content := strings.TrimSpace(openAIResp.Choices[0].Message.Content)
	// Strip markdown code fences if present (defensive)
	content = strings.TrimPrefix(content, "```json")
	content = strings.TrimPrefix(content, "```")
	content = strings.TrimSuffix(content, "```")
	content = strings.TrimSpace(content)

	var aiRecs []glowPlanAIRecommendation
	if err := json.Unmarshal([]byte(content), &aiRecs); err != nil {
		return nil, fmt.Errorf("failed to parse ai recommendations: %w", err)
	}

	var recommendations []models.GlowPlan
	for _, rec := range aiRecs {
		// Validate and clamp values to match database constraints
		category := rec.Category
		if category != "jawline" && category != "skin" && category != "style" && category != "fitness" && category != "grooming" {
			category = "grooming"
		}
		difficulty := rec.Difficulty
		if difficulty != "easy" && difficulty != "medium" && difficulty != "hard" {
			difficulty = "medium"
		}
		priority := rec.Priority
		if priority < 1 {
			priority = 1
		}
		if priority > 5 {
			priority = 5
		}
		timeframe := rec.TimeframeWeeks
		if timeframe < 1 {
			timeframe = 1
		}
		if timeframe > 12 {
			timeframe = 12
		}

		plan := models.GlowPlan{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       category,
			Title:          rec.Title,
			Description:    rec.Description,
			Priority:       priority,
			Difficulty:     difficulty,
			TimeframeWeeks: timeframe,
			IsCompleted:    false,
		}
		recommendations = append(recommendations, plan)
	}

	return recommendations, nil
}
