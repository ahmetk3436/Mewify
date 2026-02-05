package dto

import (
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type GenerateGlowPlanRequest struct {
	UserID     uuid.UUID `json:"user_id" binding:"required"`
	AnalysisID uuid.UUID `json:"analysis_id" binding:"required"`
}

type CompleteGlowPlanRequest struct {
	IsCompleted bool `json:"is_completed" binding:"required"`
}

// Response DTOs
type GlowPlanResponse struct {
	ID             uuid.UUID  `json:"id"`
	UserID         uuid.UUID  `json:"user_id"`
	AnalysisID     uuid.UUID  `json:"analysis_id"`
	Category       string     `json:"category"`
	Title          string     `json:"title"`
	Description    string     `json:"description"`
	Priority       int        `json:"priority"`
	Difficulty     string     `json:"difficulty"`
	TimeframeWeeks int        `json:"timeframe_weeks"`
	IsCompleted    bool       `json:"is_completed"`
	CompletedAt    *time.Time `json:"completed_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type GlowPlanListResponse struct {
	Plans      []GlowPlanResponse `json:"plans"`
	TotalCount int                `json:"total_count"`
}

type ProgressResponse struct {
	TotalPlans        int `json:"total_plans"`
	CompletedPlans    int `json:"completed_plans"`
	ProgressPercentage int `json:"progress_percentage"`
}