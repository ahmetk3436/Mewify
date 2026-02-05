package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
)

type MewingService interface {
	LogProgress(userID uuid.UUID, req dto.LogMewingRequest) (*models.MewingProgress, error)
	GetTodayProgress(userID uuid.UUID) (*dto.MewingProgressResponse, error)
	GetHistory(userID uuid.UUID, days int) ([]dto.HistoryResponse, error)
	GetStreakInfo(userID uuid.UUID) (*dto.StreakInfoResponse, error)
	UpdateGoal(userID uuid.UUID, req dto.UpdateGoalRequest) (*models.MewingGoal, error)
	GetGoal(userID uuid.UUID) (*dto.GoalResponse, error)
}

type mewingService struct {
	db *gorm.DB
}

func NewMewingService(db *gorm.DB) MewingService {
	return &mewingService{db: db}
}

func (s *mewingService) LogProgress(userID uuid.UUID, req dto.LogMewingRequest) (*models.MewingProgress, error) {
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Get or create user's goal
	var goal models.MewingGoal
	if err := tx.Where("user_id = ?", userID).First(&goal).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			goal = models.MewingGoal{
				UserID:           userID,
				DailyMinutesGoal: 60, // default
			}
			if err := tx.Create(&goal).Error; err != nil {
				tx.Rollback()
				return nil, err
			}
		} else {
			tx.Rollback()
			return nil, err
		}
	}

	// Check if entry exists for today
	today := time.Now().UTC().Truncate(24 * time.Hour)
	var existingProgress models.MewingProgress
	err := tx.Where("user_id = ? AND date = ?", userID, today).First(&existingProgress).Error

	var progress models.MewingProgress
	if err == nil {
		// Update existing
		progress = existingProgress
		progress.MewingMinutes = req.MewingMinutes
		progress.Notes = req.Notes
		progress.JawlinePhotoURL = req.JawlinePhotoURL
		progress.Completed = req.MewingMinutes >= goal.DailyMinutesGoal

		// Update streak if status changed to completed
		if !existingProgress.Completed && progress.Completed {
			if err := s.updateStreak(tx, userID, true); err != nil {
				tx.Rollback()
				return nil, err
			}
		}

		if err := tx.Save(&progress).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create new
		progress = models.MewingProgress{
			UserID:          userID,
			Date:            today,
			MewingMinutes:   req.MewingMinutes,
			Notes:           req.Notes,
			JawlinePhotoURL: req.JawlinePhotoURL,
			Completed:       req.MewingMinutes >= goal.DailyMinutesGoal,
		}

		if err := tx.Create(&progress).Error; err != nil {
			tx.Rollback()
			return nil, err
		}

		// Update streak if completed
		if progress.Completed {
			if err := s.updateStreak(tx, userID, true); err != nil {
				tx.Rollback()
				return nil, err
			}
		}
	} else {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &progress, nil
}

func (s *mewingService) updateStreak(tx *gorm.DB, userID uuid.UUID, completedToday bool) error {
	var goal models.MewingGoal
	if err := tx.Where("user_id = ?", userID).First(&goal).Error; err != nil {
		return err
	}

	if completedToday {
		// Check if yesterday was completed
		yesterday := time.Now().UTC().AddDate(0, 0, -1).Truncate(24 * time.Hour)
		var yesterdayProgress models.MewingProgress
		err := tx.Where("user_id = ? AND date = ? AND completed = true", userID, yesterday).First(&yesterdayProgress).Error

		if err == nil {
			// Continue streak
			goal.CurrentStreak++
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			// Start new streak
			goal.CurrentStreak = 1
		}

		// Update longest streak if needed
		if goal.CurrentStreak > goal.LongestStreak {
			goal.LongestStreak = goal.CurrentStreak
		}
	} else {
		// Reset streak if today not completed
		goal.CurrentStreak = 0
	}

	return tx.Save(&goal).Error
}

func (s *mewingService) GetTodayProgress(userID uuid.UUID) (*dto.MewingProgressResponse, error) {
	today := time.Now().UTC().Truncate(24 * time.Hour)
	var progress models.MewingProgress

	err := s.db.Where("user_id = ? AND date = ?", userID, today).First(&progress).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return empty response for today
			return &dto.MewingProgressResponse{
				Date:      today.Format("2006-01-02"),
				Completed: false,
			}, nil
		}
		return nil, err
	}

	return &dto.MewingProgressResponse{
		ID:              progress.ID,
		Date:            progress.Date.Format("2006-01-02"),
		MewingMinutes:   progress.MewingMinutes,
		Completed:       progress.Completed,
		Notes:           progress.Notes,
		JawlinePhotoURL: progress.JawlinePhotoURL,
		CreatedAt:       progress.CreatedAt,
	}, nil
}

func (s *mewingService) GetHistory(userID uuid.UUID, days int) ([]dto.HistoryResponse, error) {
	if days <= 0 {
		days = 30 // default
	}

	endDate := time.Now().UTC().Truncate(24 * time.Hour)
	startDate := endDate.AddDate(0, 0, -days+1)

	var progresses []models.MewingProgress
	err := s.db.Where("user_id = ? AND date >= ? AND date <= ?",
		userID, startDate, endDate).Order("date desc").Find(&progresses).Error
	if err != nil {
		return nil, err
	}

	// Create map for quick lookup
	progressMap := make(map[string]models.MewingProgress)
	for _, p := range progresses {
		progressMap[p.Date.Format("2006-01-02")] = p
	}

	// Get goal for completion calculation
	var goal models.MewingGoal
	if err := s.db.Where("user_id = ?", userID).First(&goal).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
		goal.DailyMinutesGoal = 60 // default
	}

	// Build response for all dates in range
	var history []dto.HistoryResponse
	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		if progress, exists := progressMap[dateStr]; exists {
			status := "partial"
			if progress.Completed {
				status = "completed"
			}
			history = append(history, dto.HistoryResponse{
				Date:    dateStr,
				Status:  status,
				Minutes: progress.MewingMinutes,
			})
		} else {
			history = append(history, dto.HistoryResponse{
				Date:    dateStr,
				Status:  "missed",
				Minutes: 0,
			})
		}
	}

	return history, nil
}

func (s *mewingService) GetStreakInfo(userID uuid.UUID) (*dto.StreakInfoResponse, error) {
	var goal models.MewingGoal
	if err := s.db.Where("user_id = ?", userID).First(&goal).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create default goal
			goal = models.MewingGoal{
				UserID:           userID,
				DailyMinutesGoal: 60,
			}
			if err := s.db.Create(&goal).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}

	// Calculate total days logged
	var totalDays int64
	err := s.db.Model(&models.MewingProgress{}).
		Where("user_id = ?", userID).
		Count(&totalDays).Error
	if err != nil {
		return nil, err
	}

	// Calculate goal completion rate (last 30 days)
	thirtyDaysAgo := time.Now().UTC().AddDate(0, 0, -30).Truncate(24 * time.Hour)
	var completedDays int64
	err = s.db.Model(&models.MewingProgress{}).
		Where("user_id = ? AND date >= ? AND completed = true", userID, thirtyDaysAgo).
		Count(&completedDays).Error
	if err != nil {
		return nil, err
	}

	completionRate := 0.0
	// Calculate based on 30 day window, not total days logged
	if completedDays > 0 {
		completionRate = float64(completedDays) / 30.0 * 100.0
	}

	return &dto.StreakInfoResponse{
		CurrentStreak:      goal.CurrentStreak,
		LongestStreak:      goal.LongestStreak,
		TotalDaysLogged:    int(totalDays),
		GoalCompletionRate: completionRate,
	}, nil
}

func (s *mewingService) UpdateGoal(userID uuid.UUID, req dto.UpdateGoalRequest) (*models.MewingGoal, error) {
	var goal models.MewingGoal

	err := s.db.Where("user_id = ?", userID).First(&goal).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			goal = models.MewingGoal{
				UserID:           userID,
				DailyMinutesGoal: req.DailyMinutesGoal,
				ReminderEnabled:  req.ReminderEnabled,
				ReminderTime:     req.ReminderTime,
			}
			if err := s.db.Create(&goal).Error; err != nil {
				return nil, err
			}
			return &goal, nil
		}
		return nil, err
	}

	goal.DailyMinutesGoal = req.DailyMinutesGoal
	goal.ReminderEnabled = req.ReminderEnabled
	goal.ReminderTime = req.ReminderTime

	if err := s.db.Save(&goal).Error; err != nil {
		return nil, err
	}

	return &goal, nil
}

func (s *mewingService) GetGoal(userID uuid.UUID) (*dto.GoalResponse, error) {
	var goal models.MewingGoal
	if err := s.db.Where("user_id = ?", userID).First(&goal).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Return default goal if not set
			return &dto.GoalResponse{
				DailyMinutesGoal: 60,
				ReminderEnabled:  false,
			}, nil
		}
		return nil, err
	}

	return &dto.GoalResponse{
		DailyMinutesGoal: goal.DailyMinutesGoal,
		ReminderEnabled:  goal.ReminderEnabled,
		ReminderTime:     goal.ReminderTime,
	}, nil
}