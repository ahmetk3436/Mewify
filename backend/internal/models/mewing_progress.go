package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MewingProgress struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID          uuid.UUID      `gorm:"type:uuid;not null;index"`
	Date            time.Time      `gorm:"type:date;not null;index:,composite:user_date"`
	MewingMinutes   int            `gorm:"not null;default:0"`
	Completed       bool           `gorm:"not null;default:false"`
	Notes           string         `gorm:"type:text"`
	JawlinePhotoURL string         `gorm:"type:varchar(500)"`
	CreatedAt       time.Time
	UpdatedAt       time.Time
	DeletedAt       gorm.DeletedAt `gorm:"index"`
}

type MewingGoal struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()"`
	UserID           uuid.UUID `gorm:"type:uuid;not null;uniqueIndex"`
	DailyMinutesGoal int       `gorm:"not null;default:60"`
	ReminderEnabled  bool      `gorm:"not null;default:false"`
	ReminderTime     string    `gorm:"type:varchar(5)"` // HH:MM format
	CurrentStreak    int       `gorm:"not null;default:0"`
	LongestStreak    int       `gorm:"not null;default:0"`
	CreatedAt        time.Time
	UpdatedAt        time.Time
}