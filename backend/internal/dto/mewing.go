package dto

import (
	"time"

	"github.com/google/uuid"
)

// Request DTOs
type LogMewingRequest struct {
	MewingMinutes  int    `json:"mewingMinutes" validate:"required,min=1,max=1440"`
	Notes          string `json:"notes"`
	JawlinePhotoURL string `json:"jawlinePhotoUrl"`
}

type UpdateGoalRequest struct {
	DailyMinutesGoal int    `json:"dailyMinutesGoal" validate:"required,min=1,max=1440"`
	ReminderEnabled  bool   `json:"reminderEnabled"`
	ReminderTime     string `json:"reminderTime" validate:"omitempty,^([01]?[0-9]|2[0-3]):[0-5][0-9]$"`
}

// Response DTOs
type MewingProgressResponse struct {
	ID              uuid.UUID `json:"id"`
	Date            string    `json:"date"` // YYYY-MM-DD format
	MewingMinutes   int       `json:"mewingMinutes"`
	Completed       bool      `json:"completed"`
	Notes           string    `json:"notes,omitempty"`
	JawlinePhotoURL string    `json:"jawlinePhotoUrl,omitempty"`
	CreatedAt       time.Time `json:"createdAt"`
}

type StreakInfoResponse struct {
	CurrentStreak       int     `json:"currentStreak"`
	LongestStreak       int     `json:"longestStreak"`
	TotalDaysLogged     int     `json:"totalDaysLogged"`
	GoalCompletionRate  float64 `json:"goalCompletionRate"` // percentage
}

type GoalResponse struct {
	DailyMinutesGoal int    `json:"dailyMinutesGoal"`
	ReminderEnabled  bool   `json:"reminderEnabled"`
	ReminderTime     string `json:"reminderTime,omitempty"`
}

type HistoryResponse struct {
	Date    string `json:"date"`
	Status  string `json:"status"` // "completed", "partial", "missed"
	Minutes int    `json:"minutes"`
}