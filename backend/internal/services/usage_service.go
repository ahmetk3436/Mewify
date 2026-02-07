package services

import (
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const FreeDailyLimit = 3

type UsageService struct {
	db *gorm.DB
}

func NewUsageService(db *gorm.DB) *UsageService {
	return &UsageService{db: db}
}

// CheckAndIncrementUsage checks if the user can perform an analysis and increments the count.
// Returns (allowed bool, currentCount int, err error).
func (s *UsageService) CheckAndIncrementUsage(userID uuid.UUID) (bool, int, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)

	var usage models.DailyUsage
	err := s.db.Where("user_id = ? AND date = ?", userID, today).First(&usage).Error

	if err == gorm.ErrRecordNotFound {
		usage = models.DailyUsage{
			UserID:        userID,
			Date:          today,
			AnalysisCount: 1,
		}
		if err := s.db.Create(&usage).Error; err != nil {
			return false, 0, err
		}
		return true, 1, nil
	}

	if err != nil {
		return false, 0, err
	}

	if usage.AnalysisCount < FreeDailyLimit {
		usage.AnalysisCount++
		if err := s.db.Save(&usage).Error; err != nil {
			return false, 0, err
		}
		return true, usage.AnalysisCount, nil
	}

	// Limit reached — check if user has active subscription
	var sub models.Subscription
	err = s.db.Where("user_id = ? AND status = ? AND current_period_end > ?", userID, "active", time.Now().UTC()).First(&sub).Error
	if err == nil {
		// Premium user — allow unlimited
		usage.AnalysisCount++
		if err := s.db.Save(&usage).Error; err != nil {
			return false, 0, err
		}
		return true, usage.AnalysisCount, nil
	}

	// Not subscribed — deny
	return false, usage.AnalysisCount, nil
}

// GetRemainingUses returns the number of remaining free uses for today.
// Returns -1 for premium users (unlimited).
func (s *UsageService) GetRemainingUses(userID uuid.UUID) (int, bool, error) {
	// Check subscription status
	var sub models.Subscription
	err := s.db.Where("user_id = ? AND status = ? AND current_period_end > ?", userID, "active", time.Now().UTC()).First(&sub).Error
	isPremium := err == nil

	if isPremium {
		return -1, true, nil
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	var usage models.DailyUsage
	err = s.db.Where("user_id = ? AND date = ?", userID, today).First(&usage).Error

	if err == gorm.ErrRecordNotFound {
		return FreeDailyLimit, false, nil
	}
	if err != nil {
		return 0, false, err
	}

	remaining := FreeDailyLimit - usage.AnalysisCount
	if remaining < 0 {
		remaining = 0
	}

	return remaining, false, nil
}
