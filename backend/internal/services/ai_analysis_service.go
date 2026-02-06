package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
)

type AiAnalysisService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAiAnalysisService(db *gorm.DB, cfg *config.Config) *AiAnalysisService {
	return &AiAnalysisService{
		db:  db,
		cfg: cfg,
	}
}

// OpenAI request/response types

type openAIRequest struct {
	Model     string          `json:"model"`
	Messages  []openAIMessage `json:"messages"`
	MaxTokens int             `json:"max_tokens"`
}

type openAIMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

type openAIImageContent struct {
	Type     string          `json:"type"`
	ImageURL *openAIImageURL `json:"image_url,omitempty"`
}

type openAIImageURL struct {
	URL string `json:"url"`
}

type openAIResponse struct {
	Choices []openAIChoice `json:"choices"`
}

type openAIChoice struct {
	Message openAIResponseMessage `json:"message"`
}

type openAIResponseMessage struct {
	Content string `json:"content"`
}

type aiAnalysisResult struct {
	OverallScore  float64  `json:"overall_score"`
	SymmetryScore float64  `json:"symmetry_score"`
	JawlineScore  float64  `json:"jawline_score"`
	SkinScore     float64  `json:"skin_score"`
	EyeScore      float64  `json:"eye_score"`
	NoseScore     float64  `json:"nose_score"`
	LipsScore     float64  `json:"lips_score"`
	HarmonyScore  float64  `json:"harmony_score"`
	Strengths     []string `json:"strengths"`
	Improvements  []string `json:"improvements"`
}

func (s *AiAnalysisService) AnalyzeImage(userID uuid.UUID, imageBase64 string) (*models.FaceAnalysis, error) {
	systemPrompt := `You are a facial aesthetics analysis AI. Analyze the provided face photo and return ONLY valid JSON with no additional text, markdown, or explanation. The JSON must have exactly these fields:
{
  "overall_score": <float 1.0-10.0>,
  "symmetry_score": <float 1.0-10.0>,
  "jawline_score": <float 1.0-10.0>,
  "skin_score": <float 1.0-10.0>,
  "eye_score": <float 1.0-10.0>,
  "nose_score": <float 1.0-10.0>,
  "lips_score": <float 1.0-10.0>,
  "harmony_score": <float 1.0-10.0>,
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"]
}
Score each feature from 1.0 (lowest) to 10.0 (highest). Provide exactly 3 strengths and 3 improvements. Be honest but constructive.`

	reqBody := openAIRequest{
		Model: s.cfg.OpenAIModel,
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: systemPrompt,
			},
			{
				Role: "user",
				Content: []openAIImageContent{
					{
						Type: "image_url",
						ImageURL: &openAIImageURL{
							URL: "data:image/jpeg;base64," + imageBase64,
						},
					},
				},
			},
		},
		MaxTokens: 1000,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
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
		return nil, fmt.Errorf("failed to read response: %w", err)
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

	content := openAIResp.Choices[0].Message.Content

	var result aiAnalysisResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("failed to parse ai analysis result: %w", err)
	}

	analysis := &models.FaceAnalysis{
		UserID:        userID,
		ImageURL:      "ai-analyzed",
		OverallScore:  result.OverallScore,
		SymmetryScore: result.SymmetryScore,
		JawlineScore:  result.JawlineScore,
		SkinScore:     result.SkinScore,
		EyeScore:      result.EyeScore,
		NoseScore:     result.NoseScore,
		LipsScore:     result.LipsScore,
		HarmonyScore:  result.HarmonyScore,
		Strengths:     result.Strengths,
		Improvements:  result.Improvements,
		AnalyzedAt:    time.Now(),
	}

	if err := s.db.Create(analysis).Error; err != nil {
		return nil, fmt.Errorf("failed to save analysis: %w", err)
	}

	return analysis, nil
}
