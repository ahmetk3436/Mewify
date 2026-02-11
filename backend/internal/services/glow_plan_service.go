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
	if llmPlans, err := s.generateLLMRecommendations(userID, analysisID, analysis); err == nil && len(llmPlans) > 0 {
		return llmPlans, nil
	}

	// Fallback keeps core flow functional even if upstream LLM provider is unavailable.
	return s.generateDeterministicRecommendations(userID, analysisID, analysis), nil
}

func (s *GlowPlanService) generateLLMRecommendations(userID, analysisID uuid.UUID, analysis *models.FaceAnalysis) ([]models.GlowPlan, error) {
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

	providers := []struct {
		url   string
		key   string
		model string
	}{
		{url: strings.TrimSpace(s.cfg.GLMAPIURL), key: strings.TrimSpace(s.cfg.GLMAPIKey), model: strings.TrimSpace(s.cfg.GLMModel)},
		{url: strings.TrimSpace(s.cfg.DeepSeekAPIURL), key: strings.TrimSpace(s.cfg.DeepSeekAPIKey), model: strings.TrimSpace(s.cfg.DeepSeekModel)},
	}

	timeout := s.cfg.LLMTimeout
	if timeout <= 0 {
		timeout = 20 * time.Second
	}

	var lastErr error
	for _, p := range providers {
		if p.url == "" || p.key == "" || p.model == "" {
			continue
		}

		reqBody := openAIRequest{
			Model: p.model,
			Messages: []openAIMessage{
				{
					Role:    "system",
					Content: "You are a personalized beauty and self-improvement advisor. Always return valid JSON only.",
				},
				{
					Role:    "user",
					Content: prompt,
				},
			},
			MaxTokens:      2000,
			Temperature:    0.2,
			ResponseFormat: map[string]string{"type": "json_object"},
		}

		jsonBody, err := json.Marshal(reqBody)
		if err != nil {
			lastErr = err
			continue
		}

		client := &http.Client{Timeout: timeout}
		httpReq, err := http.NewRequest("POST", p.url, bytes.NewReader(jsonBody))
		if err != nil {
			lastErr = err
			continue
		}
		httpReq.Header.Set("Content-Type", "application/json")
		httpReq.Header.Set("Authorization", "Bearer "+p.key)

		resp, err := client.Do(httpReq)
		if err != nil {
			lastErr = err
			continue
		}

		body, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if readErr != nil {
			lastErr = readErr
			continue
		}
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			lastErr = fmt.Errorf("provider status=%d", resp.StatusCode)
			continue
		}

		var llmResp openAIResponse
		if err := json.Unmarshal(body, &llmResp); err != nil {
			lastErr = err
			continue
		}
		if len(llmResp.Choices) == 0 {
			lastErr = errors.New("empty llm choices")
			continue
		}

		content := strings.TrimSpace(llmResp.Choices[0].Message.Content)
		content = strings.TrimPrefix(content, "```json")
		content = strings.TrimPrefix(content, "```")
		content = strings.TrimSuffix(content, "```")
		content = strings.TrimSpace(content)

		var aiRecs []glowPlanAIRecommendation
		if err := json.Unmarshal([]byte(content), &aiRecs); err != nil {
			start := strings.Index(content, "[")
			end := strings.LastIndex(content, "]")
			if start >= 0 && end > start {
				if nestedErr := json.Unmarshal([]byte(content[start:end+1]), &aiRecs); nestedErr != nil {
					lastErr = nestedErr
					continue
				}
			} else {
				lastErr = err
				continue
			}
		}

		plans := convertGlowPlanRecommendations(userID, analysisID, aiRecs)
		if len(plans) > 0 {
			return plans, nil
		}
		lastErr = errors.New("empty recommendations")
	}

	if lastErr != nil {
		return nil, lastErr
	}
	return nil, errors.New("no llm provider configured")
}

func convertGlowPlanRecommendations(userID, analysisID uuid.UUID, recs []glowPlanAIRecommendation) []models.GlowPlan {
	plans := make([]models.GlowPlan, 0, len(recs))
	for _, rec := range recs {
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

		title := strings.TrimSpace(rec.Title)
		if title == "" {
			title = "Personalized improvement step"
		}
		description := strings.TrimSpace(rec.Description)
		if description == "" {
			description = "Focus on this area consistently and review your progress weekly."
		}

		plans = append(plans, models.GlowPlan{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       category,
			Title:          title,
			Description:    description,
			Priority:       priority,
			Difficulty:     difficulty,
			TimeframeWeeks: timeframe,
			IsCompleted:    false,
		})
	}
	return plans
}

func (s *GlowPlanService) generateDeterministicRecommendations(userID, analysisID uuid.UUID, analysis *models.FaceAnalysis) []models.GlowPlan {
	plans := []models.GlowPlan{
		{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       "jawline",
			Title:          "Daily neck posture routine",
			Description:    "Spend 10 minutes on neck posture and tongue placement exercises each day. Track consistency for visible structural improvement over time.",
			Priority:       5,
			Difficulty:     "medium",
			TimeframeWeeks: 8,
			IsCompleted:    false,
		},
		{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       "skin",
			Title:          "Simple AM/PM skin protocol",
			Description:    "Use a minimal cleanser-moisturizer-sunscreen stack in the morning and cleanse-moisturize at night. Keep it consistent before adding actives.",
			Priority:       5,
			Difficulty:     "easy",
			TimeframeWeeks: 6,
			IsCompleted:    false,
		},
		{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       "fitness",
			Title:          "Sleep and hydration baseline",
			Description:    "Target 7-8 hours of sleep and 2-2.5L daily water intake. Improved recovery directly supports skin quality and facial definition.",
			Priority:       4,
			Difficulty:     "easy",
			TimeframeWeeks: 4,
			IsCompleted:    false,
		},
		{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       "grooming",
			Title:          "Weekly grooming calibration",
			Description:    "Refine eyebrow shape, maintain consistent beard or clean-shave lines, and keep haircut edges fresh. Small grooming details compound visual impact.",
			Priority:       3,
			Difficulty:     "easy",
			TimeframeWeeks: 4,
			IsCompleted:    false,
		},
		{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       "style",
			Title:          "Lighting and photo angle routine",
			Description:    "Practice front-facing natural light photos and a slight above-eye camera angle. Use one repeatable setup to track facial progress reliably.",
			Priority:       3,
			Difficulty:     "easy",
			TimeframeWeeks: 3,
			IsCompleted:    false,
		},
	}

	// Slightly boost skin or jawline priority based on lower score.
	if analysis.SkinScore < analysis.JawlineScore {
		plans[1].Priority = 5
		plans[0].Priority = 4
	}

	return plans
}
