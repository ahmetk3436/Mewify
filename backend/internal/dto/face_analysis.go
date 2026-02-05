package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateFaceAnalysisRequest struct {
	ImageURL       string    `json:"image_url" validate:"required,url"`
	OverallScore   float64   `json:"overall_score" validate:"required,min=1,max=10"`
	SymmetryScore  float64   `json:"symmetry_score" validate:"required,min=1,max=10"`
	JawlineScore   float64   `json:"jawline_score" validate:"required,min=1,max=10"`
	SkinScore      float64   `json:"skin_score" validate:"required,min=1,max=10"`
	EyeScore       float64   `json:"eye_score" validate:"required,min=1,max=10"`
	NoseScore      float64   `json:"nose_score" validate:"required,min=1,max=10"`
	LipsScore      float64   `json:"lips_score" validate:"required,min=1,max=10"`
	HarmonyScore   float64   `json:"harmony_score" validate:"required,min=1,max=10"`
	Strengths      []string  `json:"strengths" validate:"max=3"`
	Improvements   []string  `json:"improvements" validate:"max=3"`
	AnalyzedAt     time.Time `json:"analyzed_at"`
}

type FaceAnalysisResponse struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	ImageURL       string    `json:"image_url"`
	OverallScore   float64   `json:"overall_score"`
	SymmetryScore  float64   `json:"symmetry_score"`
	JawlineScore   float64   `json:"jawline_score"`
	SkinScore      float64   `json:"skin_score"`
	EyeScore       float64   `json:"eye_score"`
	NoseScore      float64   `json:"nose_score"`
	LipsScore      float64   `json:"lips_score"`
	HarmonyScore   float64   `json:"harmony_score"`
	Strengths      []string  `json:"strengths"`
	Improvements   []string  `json:"improvements"`
	AnalyzedAt     time.Time `json:"analyzed_at"`
	CreatedAt      time.Time `json:"created_at"`
}

type PaginatedAnalysesResponse struct {
	Analyses []FaceAnalysisResponse `json:"analyses"`
	Total    int64                  `json:"total"`
	Page     int                    `json:"page"`
	Limit    int                    `json:"limit"`
}

type AnalysisStatsResponse struct {
	AverageOverall float64        `json:"average_overall"`
	AverageSymmetry float64        `json:"average_symmetry"`
	AverageJawline  float64        `json:"average_jawline"`
	AverageSkin     float64        `json:"average_skin"`
	AverageEye      float64        `json:"average_eye"`
	AverageNose     float64        `json:"average_nose"`
	AverageLips     float64        `json:"average_lips"`
	AverageHarmony  float64        `json:"average_harmony"`
	TotalAnalyses   int64          `json:"total_analyses"`
	MonthlyTrend    []MonthlyScore `json:"monthly_trend"`
}

type MonthlyScore struct {
	Month string  `json:"month"`
	Score float64 `json:"score"`
}