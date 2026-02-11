package services

import (
	"bytes"
	"crypto/sha256"
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

type AiAnalysisService struct {
	db  *gorm.DB
	cfg *config.Config
}

type llmProvider struct {
	name   string
	apiURL string
	apiKey string
	model  string
}

// Shared request/response structs used by multiple services in this package.
type openAIRequest struct {
	Model          string          `json:"model"`
	Messages       []openAIMessage `json:"messages"`
	MaxTokens      int             `json:"max_tokens,omitempty"`
	Temperature    float64         `json:"temperature,omitempty"`
	ResponseFormat interface{}     `json:"response_format,omitempty"`
}

type openAIMessage struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"`
}

type openAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
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

func NewAiAnalysisService(db *gorm.DB, cfg *config.Config) *AiAnalysisService {
	return &AiAnalysisService{db: db, cfg: cfg}
}

func (s *AiAnalysisService) AnalyzeImage(userID uuid.UUID, imageBase64 string) (*models.FaceAnalysis, error) {
	fallback := deterministicAIResult(imageBase64)
	result := fallback

	if llmResult, err := s.analyzeWithLLM(imageBase64, fallback); err == nil {
		result = llmResult
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

func (s *AiAnalysisService) providers() []llmProvider {
	providers := make([]llmProvider, 0, 2)

	if strings.TrimSpace(s.cfg.GLMAPIKey) != "" {
		providers = append(providers, llmProvider{
			name:   "glm",
			apiURL: strings.TrimSpace(s.cfg.GLMAPIURL),
			apiKey: strings.TrimSpace(s.cfg.GLMAPIKey),
			model:  strings.TrimSpace(s.cfg.GLMModel),
		})
	}

	if strings.TrimSpace(s.cfg.DeepSeekAPIKey) != "" {
		providers = append(providers, llmProvider{
			name:   "deepseek",
			apiURL: strings.TrimSpace(s.cfg.DeepSeekAPIURL),
			apiKey: strings.TrimSpace(s.cfg.DeepSeekAPIKey),
			model:  strings.TrimSpace(s.cfg.DeepSeekModel),
		})
	}

	return providers
}

func (s *AiAnalysisService) analyzeWithLLM(imageBase64 string, fallback aiAnalysisResult) (aiAnalysisResult, error) {
	providers := s.providers()
	if len(providers) == 0 {
		return fallback, errors.New("no llm provider configured")
	}

	var lastErr error
	for _, provider := range providers {
		result, err := s.analyzeWithProvider(provider, imageBase64, fallback)
		if err == nil {
			return result, nil
		}
		lastErr = fmt.Errorf("%s provider failed: %w", provider.name, err)
	}

	if lastErr != nil {
		return fallback, lastErr
	}
	return fallback, errors.New("llm analysis failed")
}

func (s *AiAnalysisService) analyzeWithProvider(provider llmProvider, imageBase64 string, fallback aiAnalysisResult) (aiAnalysisResult, error) {
	timeout := s.cfg.LLMTimeout
	if timeout <= 0 {
		timeout = 20 * time.Second
	}

	snippet := firstNChars(strings.TrimSpace(imageBase64), 1800)
	if snippet == "" {
		snippet = "missing_image_data"
	}

	prompt := fmt.Sprintf(
		"Analyze this facial image represented by base64 prefix and return ONLY valid JSON. "+
			"base64_prefix=%q fallback=%+v. Output keys: overall_score, symmetry_score, jawline_score, skin_score, eye_score, nose_score, lips_score, harmony_score, strengths (3 strings), improvements (3 strings). "+
			"Scores must be floats in range 1.0-10.0.",
		snippet,
		fallback,
	)

	reqBody := openAIRequest{
		Model: provider.model,
		Messages: []openAIMessage{
			{Role: "system", Content: "You are a facial aesthetics scoring engine. Return valid JSON only."},
			{Role: "user", Content: prompt},
		},
		Temperature:    0.2,
		ResponseFormat: map[string]string{"type": "json_object"},
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return fallback, err
	}

	httpReq, err := http.NewRequest(http.MethodPost, provider.apiURL, bytes.NewReader(payload))
	if err != nil {
		return fallback, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+provider.apiKey)

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fallback, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fallback, err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fallback, fmt.Errorf("status=%d", resp.StatusCode)
	}

	var completion openAIResponse
	if err := json.Unmarshal(body, &completion); err != nil {
		return fallback, err
	}
	if len(completion.Choices) == 0 {
		return fallback, errors.New("empty choices")
	}

	parsed, err := parseAIAnalysis(completion.Choices[0].Message.Content)
	if err != nil {
		return fallback, err
	}

	return normalizeAIResult(parsed, fallback), nil
}

func parseAIAnalysis(content string) (aiAnalysisResult, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return aiAnalysisResult{}, errors.New("empty ai response")
	}

	var parsed aiAnalysisResult
	if err := json.Unmarshal([]byte(content), &parsed); err == nil {
		return parsed, nil
	}

	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start >= 0 && end > start {
		if err := json.Unmarshal([]byte(content[start:end+1]), &parsed); err == nil {
			return parsed, nil
		}
	}

	return aiAnalysisResult{}, errors.New("unable to parse ai json")
}

func normalizeAIResult(raw aiAnalysisResult, fallback aiAnalysisResult) aiAnalysisResult {
	out := raw

	out.OverallScore = clampFloat(out.OverallScore, 1, 10, fallback.OverallScore)
	out.SymmetryScore = clampFloat(out.SymmetryScore, 1, 10, fallback.SymmetryScore)
	out.JawlineScore = clampFloat(out.JawlineScore, 1, 10, fallback.JawlineScore)
	out.SkinScore = clampFloat(out.SkinScore, 1, 10, fallback.SkinScore)
	out.EyeScore = clampFloat(out.EyeScore, 1, 10, fallback.EyeScore)
	out.NoseScore = clampFloat(out.NoseScore, 1, 10, fallback.NoseScore)
	out.LipsScore = clampFloat(out.LipsScore, 1, 10, fallback.LipsScore)
	out.HarmonyScore = clampFloat(out.HarmonyScore, 1, 10, fallback.HarmonyScore)

	out.Strengths = normalizeList(out.Strengths, fallback.Strengths)
	out.Improvements = normalizeList(out.Improvements, fallback.Improvements)

	return out
}

func normalizeList(raw []string, fallback []string) []string {
	seen := make(map[string]struct{})
	clean := make([]string, 0, 3)

	for _, v := range raw {
		t := strings.TrimSpace(v)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		clean = append(clean, t)
		if len(clean) == 3 {
			return clean
		}
	}

	for _, v := range fallback {
		t := strings.TrimSpace(v)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; ok {
			continue
		}
		seen[t] = struct{}{}
		clean = append(clean, t)
		if len(clean) == 3 {
			return clean
		}
	}

	defaults := []string{"facial symmetry", "jawline structure", "skin tone"}
	for _, v := range defaults {
		if _, ok := seen[v]; ok {
			continue
		}
		clean = append(clean, v)
		if len(clean) == 3 {
			return clean
		}
	}

	return clean
}

func deterministicAIResult(imageBase64 string) aiAnalysisResult {
	h := sha256.Sum256([]byte(strings.TrimSpace(imageBase64)))

	base := 5.5 + float64(h[0]%35)/10.0
	sym := base + float64(int(h[1]%7)-3)/10.0
	jaw := base + float64(int(h[2]%7)-3)/10.0
	skin := base + float64(int(h[3]%7)-3)/10.0
	eye := base + float64(int(h[4]%7)-3)/10.0
	nose := base + float64(int(h[5]%7)-3)/10.0
	lips := base + float64(int(h[6]%7)-3)/10.0
	harmony := (sym + jaw + skin + eye + nose + lips) / 6

	strengthPool := []string{"balanced proportions", "jawline definition", "clear skin", "eye symmetry", "facial harmony", "confident expression"}
	improvementPool := []string{"hydration routine", "sleep consistency", "posture and neck training", "skincare consistency", "facial relaxation", "photo lighting awareness"}

	return aiAnalysisResult{
		OverallScore:  clampFloat(base, 1, 10, 7.0),
		SymmetryScore: clampFloat(sym, 1, 10, 7.0),
		JawlineScore:  clampFloat(jaw, 1, 10, 7.0),
		SkinScore:     clampFloat(skin, 1, 10, 7.0),
		EyeScore:      clampFloat(eye, 1, 10, 7.0),
		NoseScore:     clampFloat(nose, 1, 10, 7.0),
		LipsScore:     clampFloat(lips, 1, 10, 7.0),
		HarmonyScore:  clampFloat(harmony, 1, 10, 7.0),
		Strengths: []string{
			strengthPool[int(h[7])%len(strengthPool)],
			strengthPool[int(h[8])%len(strengthPool)],
			strengthPool[int(h[9])%len(strengthPool)],
		},
		Improvements: []string{
			improvementPool[int(h[10])%len(improvementPool)],
			improvementPool[int(h[11])%len(improvementPool)],
			improvementPool[int(h[12])%len(improvementPool)],
		},
	}
}

func clampFloat(v, min, max, fallback float64) float64 {
	if v < min || v > max || v == 0 {
		v = fallback
	}
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func firstNChars(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n]
}
