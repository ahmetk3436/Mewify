package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GlowPlan struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;index"`
	AnalysisID     uuid.UUID      `gorm:"type:uuid;not null;index"`
	Category       string         `gorm:"type:varchar(50);not null"`
	Title          string         `gorm:"type:varchar(255);not null"`
	Description    string         `gorm:"type:text;not null"`
	Priority       int            `gorm:"type:integer;check:priority >= 1 AND priority <= 5"`
	Difficulty     string         `gorm:"type:varchar(10);check:difficulty IN ('easy','medium','hard')"`
	TimeframeWeeks int            `gorm:"type:integer;default:4"`
	IsCompleted    bool           `gorm:"type:boolean;default:false"`
	CompletedAt    *time.Time     `gorm:"type:timestamp"`
	CreatedAt      time.Time      `gorm:"type:timestamp;default:now()"`
	UpdatedAt      time.Time      `gorm:"type:timestamp;default:now()"`
	DeletedAt      gorm.DeletedAt `gorm:"index"`

	// Relationships
	User     User         `gorm:"foreignKey:UserID"`
	Analysis FaceAnalysis `gorm:"foreignKey:AnalysisID"`
}

func (GlowPlan) TableName() string {
	return "glow_plans"
}