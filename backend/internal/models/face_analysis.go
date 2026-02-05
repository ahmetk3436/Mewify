package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FaceAnalysis struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	ImageURL       string         `gorm:"type:text;not null" json:"image_url"`
	OverallScore   float64        `gorm:"type:decimal(3,1);not null" json:"overall_score"`
	SymmetryScore  float64        `gorm:"type:decimal(3,1);not null" json:"symmetry_score"`
	JawlineScore   float64        `gorm:"type:decimal(3,1);not null" json:"jawline_score"`
	SkinScore      float64        `gorm:"type:decimal(3,1);not null" json:"skin_score"`
	EyeScore       float64        `gorm:"type:decimal(3,1);not null" json:"eye_score"`
	NoseScore      float64        `gorm:"type:decimal(3,1);not null" json:"nose_score"`
	LipsScore      float64        `gorm:"type:decimal(3,1);not null" json:"lips_score"`
	HarmonyScore   float64        `gorm:"type:decimal(3,1);not null" json:"harmony_score"`
	Strengths      []string       `gorm:"type:jsonb" json:"strengths"`
	Improvements   []string       `gorm:"type:jsonb" json:"improvements"`
	AnalyzedAt     time.Time      `gorm:"not null" json:"analyzed_at"`
	CreatedAt      time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time      `gorm:"autoUpdateTime" json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}