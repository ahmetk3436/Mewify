package models

import (
	"time"

	"github.com/google/uuid"
)

type DailyUsage struct {
	ID            uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_date" json:"user_id"`
	Date          time.Time `gorm:"type:date;not null;uniqueIndex:idx_user_date" json:"date"`
	AnalysisCount int       `gorm:"not null;default:0" json:"analysis_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	User          User      `gorm:"foreignKey:UserID" json:"-"`
}
