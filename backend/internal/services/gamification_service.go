package services

import (
	"fmt"
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type GamificationService struct {
	db *gorm.DB
}

func NewGamificationService(db *gorm.DB) *GamificationService {
	return &GamificationService{db: db}
}

// ============================================
// LEVEL & XP SYSTEM
// ============================================

// Level progression: Each level requires 20% more XP than the last
// Level 1: 200 XP, Level 2: 240 XP, Level 3: 288 XP, etc.
func (s *GamificationService) GetXPForLevel(level int) int {
	baseXP := 200
	multiplier := 1.2
	xp := baseXP
	for i := 1; i < level; i++ {
		xp = int(float64(xp) * multiplier)
	}
	return xp
}

func (s *GamificationService) AddXP(userID uuid.UUID, amount int, reason, referenceID, description string) error {
	// Create transaction
	transaction := models.XPTransaction{
		UserID:      userID,
		Amount:      amount,
		Reason:      reason,
		ReferenceID: referenceID,
		Description: description,
	}
	if err := s.db.Create(&transaction).Error; err != nil {
		return err
	}

	// Update user gamification
	var gamification models.UserGamification
	if err := s.db.Where("user_id = ?", userID).First(&gamification).Error; err != nil {
		// Create if not exists
		gamification = models.UserGamification{
			UserID:         userID,
			TotalXP:        0,
			CurrentLevel:   1,
			XPToNextLevel:  200,
		}
		s.db.Create(&gamification)
	}

	gamification.TotalXP += amount

	// Check for level up
	for gamification.TotalXP >= gamification.XPToNextLevel {
		gamification.TotalXP -= gamification.XPToNextLevel
		gamification.CurrentLevel++
		gamification.XPToNextLevel = s.GetXPForLevel(gamification.CurrentLevel)

		// Create level up notification
		s.createNotification(userID, "level_up",
			fmt.Sprintf("Level %d!", gamification.CurrentLevel),
			fmt.Sprintf("Congratulations! You've reached level %d!", gamification.CurrentLevel),
			"trophy", "")
	}

	return s.db.Save(&gamification).Error
}

// ============================================
// STREAK SYSTEM
// ============================================

func (s *GamificationService) UpdateStreak(userID uuid.UUID) (int, bool, error) {
	var gamification models.UserGamification
	if err := s.db.Where("user_id = ?", userID).First(&gamification).Error; err != nil {
		gamification = models.UserGamification{
			UserID:         userID,
			CurrentStreak:  0,
			LongestStreak:  0,
			LastActivityAt: time.Now(),
		}
		s.db.Create(&gamification)
	}

	now := time.Now()
	lastActivity := gamification.LastActivityAt
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	lastActivityDay := time.Date(lastActivity.Year(), lastActivity.Month(), lastActivity.Day(), 0, 0, 0, 0, lastActivity.Location())

	daysDiff := int(today.Sub(lastActivityDay).Hours() / 24)

	streakBroken := false
	newRecord := false

	if daysDiff == 0 {
		// Already updated today
		return gamification.CurrentStreak, false, nil
	} else if daysDiff == 1 {
		// Continuing streak
		gamification.CurrentStreak++
		if gamification.CurrentStreak > gamification.LongestStreak {
			gamification.LongestStreak = gamification.CurrentStreak
			newRecord = true
		}
	} else if daysDiff > 1 {
		// Check for streak freeze
		if gamification.StreakFreezes > 0 && daysDiff == 2 {
			// Use streak freeze
			gamification.StreakFreezes--
			gamification.CurrentStreak++
		} else if gamification.StreakShieldUntil != nil && gamification.StreakShieldUntil.After(now) {
			// Shielded, continue streak
			gamification.CurrentStreak++
		} else {
			// Streak broken
			gamification.CurrentStreak = 1
			streakBroken = true
		}
	}

	gamification.LastActivityAt = now
	s.db.Save(&gamification)

	// Check streak achievements
	s.checkStreakAchievements(userID, gamification.CurrentStreak)

	return gamification.CurrentStreak, streakBroken || newRecord, nil
}

func (s *GamificationService) checkStreakAchievements(userID uuid.UUID, streak int) {
	streakMilestones := []int{3, 7, 14, 30, 60, 100, 365}
	for _, milestone := range streakMilestones {
		if streak == milestone {
			s.GrantAchievement(userID, fmt.Sprintf("streak_%d", milestone))
		}
	}
}

// ============================================
// ACHIEVEMENT SYSTEM
// ============================================

func (s *GamificationService) GrantAchievement(userID uuid.UUID, achievementCode string) (bool, error) {
	// Get achievement definition
	var achievement models.Achievement
	if err := s.db.Where("code = ?", achievementCode).First(&achievement).Error; err != nil {
		return false, err
	}

	// Check if already earned
	var existing models.UserAchievement
	if err := s.db.Where("user_id = ? AND achievement_id = ?", userID, achievement.ID).First(&existing).Error; err == nil {
		return false, nil // Already has it
	}

	// Grant achievement
	userAchievement := models.UserAchievement{
		UserID:        userID,
		AchievementID: achievement.ID,
		EarnedAt:      time.Now(),
	}
	if err := s.db.Create(&userAchievement).Error; err != nil {
		return false, err
	}

	// Award XP
	s.AddXP(userID, achievement.XPReward, "achievement", achievement.ID.String(),
		fmt.Sprintf("Earned achievement: %s", achievement.Name))

	// Update count
	s.db.Model(&models.UserGamification{}).
		Where("user_id = ?", userID).
		UpdateColumn("achievements_earned", gorm.Expr("achievements_earned + 1"))

	// Create notification
	s.createNotification(userID, "achievement",
		fmt.Sprintf("🏆 %s", achievement.Name),
		achievement.Description,
		achievement.Icon, achievement.ID.String())

	return true, nil
}

func (s *GamificationService) CheckAndGrantAchievements(userID uuid.UUID) ([]models.Achievement, error) {
	var newAchievements []models.Achievement

	// Get user stats
	var gamification models.UserGamification
	s.db.Where("user_id = ?", userID).First(&gamification)

	// Get all achievements
	var achievements []models.Achievement
	s.db.Where("is_active = ?", true).Order("sort_order").Find(&achievements)

	// Get user's earned achievements
	var earnedIDs []uuid.UUID
	s.db.Model(&models.UserAchievement{}).
		Where("user_id = ?", userID).
		Pluck("achievement_id", &earnedIDs)

	earnedMap := make(map[uuid.UUID]bool)
	for _, id := range earnedIDs {
		earnedMap[id] = true
	}

	// Check each achievement
	for _, achievement := range achievements {
		if earnedMap[achievement.ID] {
			continue
		}

		shouldGrant := false

		switch achievement.RequirementType {
		case "scan_count":
			shouldGrant = gamification.TotalScans >= achievement.RequirementValue
		case "streak":
			shouldGrant = gamification.CurrentStreak >= achievement.RequirementValue
		case "score":
			shouldGrant = gamification.BestScore >= float64(achievement.RequirementValue)
		case "level":
			shouldGrant = gamification.CurrentLevel >= achievement.RequirementValue
		case "mewing_minutes":
			shouldGrant = gamification.TotalMewingMinutes >= achievement.RequirementValue
		case "friends":
			shouldGrant = gamification.FriendsCount >= achievement.RequirementValue
		}

		if shouldGrant {
			if granted, _ := s.GrantAchievement(userID, achievement.Code); granted {
				newAchievements = append(newAchievements, achievement)
			}
		}
	}

	return newAchievements, nil
}

// ============================================
// DAILY CHALLENGES
// ============================================

func (s *GamificationService) GetTodayChallenge(userID uuid.UUID) (*models.UserDailyChallenge, error) {
	today := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.Now().Location())

	// Get or create daily challenge
	var dailyChallenge models.DailyChallenge
	if err := s.db.Where("date = ?", today).First(&dailyChallenge).Error; err != nil {
		// Generate new challenge
		dailyChallenge = s.generateDailyChallenge(today)
		s.db.Create(&dailyChallenge)
	}

	// Get user progress
	var userChallenge models.UserDailyChallenge
	if err := s.db.Where("user_id = ? AND daily_challenge_id = ?", userID, dailyChallenge.ID).
		Preload("DailyChallenge").First(&userChallenge).Error; err != nil {
		// Create user challenge
		userChallenge = models.UserDailyChallenge{
			UserID:           userID,
			DailyChallengeID: dailyChallenge.ID,
			CurrentValue:     0,
			Completed:        false,
		}
		s.db.Create(&userChallenge)
	}

	return &userChallenge, nil
}

func (s *GamificationService) generateDailyChallenge(date time.Time) models.DailyChallenge {
	challenges := []struct {
		title, desc, icon, challengeType string
		target, xp                       int
		difficulty                       int
	}{
		{"Morning Routine", "Complete a 10-minute mewing session", "sunny", "mewing_minutes", 10, 50, 1},
		{"Scanner Pro", "Perform 2 face scans today", "scan", "scan", 2, 75, 2},
		{"Dedicated Mewer", "Mew for 30 minutes total", "timer", "mewing_minutes", 30, 100, 2},
		{"Streak Keeper", "Don't break your streak today", "flame", "streak", 1, 30, 1},
		{"Full Hour", "Complete a 60-minute mewing session", "hourglass", "mewing_minutes", 60, 150, 3},
	}

	// Pick based on day of week
	idx := int(date.Weekday()) % len(challenges)
	c := challenges[idx]

	return models.DailyChallenge{
		Date:           date,
		Title:          c.title,
		Description:    c.desc,
		Icon:           c.icon,
		ChallengeType:  c.challengeType,
		TargetValue:    c.target,
		XPReward:       c.xp,
		Difficulty:     c.difficulty,
	}
}

func (s *GamificationService) UpdateChallengeProgress(userID uuid.UUID, challengeType string, value int) error {
	userChallenge, err := s.GetTodayChallenge(userID)
	if err != nil {
		return err
	}

	if userChallenge.Completed {
		return nil
	}

	if userChallenge.DailyChallenge.ChallengeType != challengeType {
		return nil
	}

	userChallenge.CurrentValue += value

	if userChallenge.CurrentValue >= userChallenge.DailyChallenge.TargetValue {
		userChallenge.Completed = true
		now := time.Now()
		userChallenge.ClaimedAt = &now

		// Award XP
		s.AddXP(userID, userChallenge.DailyChallenge.XPReward, "challenge",
			userChallenge.DailyChallenge.ID.String(), "Daily challenge completed!")

		// Notification
		s.createNotification(userID, "challenge",
			"✅ Challenge Complete!",
			fmt.Sprintf("You earned %d XP!", userChallenge.DailyChallenge.XPReward),
			userChallenge.DailyChallenge.Icon, "")
	}

	return s.db.Save(userChallenge).Error
}

// ============================================
// LEADERBOARD
// ============================================

func (s *GamificationService) UpdateLeaderboard(userID uuid.UUID) error {
	var gamification models.UserGamification
	s.db.Where("user_id = ?", userID).First(&gamification)

	periods := []string{"daily", "weekly", "monthly", "all_time"}

	for _, period := range periods {
		score := gamification.TotalXP

		switch period {
		case "daily":
			// Today's XP
			var todayXP int
			s.db.Model(&models.XPTransaction{}).
				Where("user_id = ? AND created_at >= ?", userID, time.Now().Truncate(24*time.Hour)).
				Select("COALESCE(SUM(amount), 0)").Scan(&todayXP)
			score = todayXP
		case "weekly":
			// This week's XP
			var weekXP int
			s.db.Model(&models.XPTransaction{}).
				Where("user_id = ? AND created_at >= ?", userID, time.Now().AddDate(0, 0, -7)).
				Select("COALESCE(SUM(amount), 0)").Scan(&weekXP)
			score = weekXP
		}

		var entry models.LeaderboardEntry
		if err := s.db.Where("user_id = ? AND period = ?", userID, period).First(&entry).Error; err != nil {
			entry = models.LeaderboardEntry{
				UserID:    userID,
				Period:    period,
				Score:     score,
				UpdatedAt: time.Now(),
			}
			s.db.Create(&entry)
		} else {
			entry.Score = score
			entry.UpdatedAt = time.Now()
			s.db.Save(&entry)
		}
	}

	return nil
}

func (s *GamificationService) GetLeaderboard(period string, limit int) ([]models.LeaderboardEntry, error) {
	var entries []models.LeaderboardEntry
	err := s.db.Where("period = ?", period).
		Order("score DESC").
		Limit(limit).
		Find(&entries).Error
	return entries, err
}

func (s *GamificationService) GetUserRank(userID uuid.UUID, period string) (int, error) {
	var entry models.LeaderboardEntry
	if err := s.db.Where("user_id = ? AND period = ?", userID, period).First(&entry).Error; err != nil {
		return 0, err
	}

	var rank int64
	s.db.Model(&models.LeaderboardEntry{}).
		Where("period = ? AND score > ?", period, entry.Score).
		Count(&rank)

	return int(rank) + 1, nil
}

// ============================================
// NOTIFICATIONS
// ============================================

func (s *GamificationService) createNotification(userID uuid.UUID, notifType, title, body, icon, actionData string) error {
	notification := models.Notification{
		UserID:     userID,
		Type:       notifType,
		Title:      title,
		Body:       body,
		ActionType: "open_screen",
		ActionData: actionData,
	}
	return s.db.Create(&notification).Error
}

func (s *GamificationService) GetUnreadNotifications(userID uuid.UUID) ([]models.Notification, error) {
	var notifications []models.Notification
	err := s.db.Where("user_id = ? AND read = ?", userID, false).
		Order("created_at DESC").
		Limit(20).
		Find(&notifications).Error
	return notifications, err
}

func (s *GamificationService) MarkNotificationRead(notificationID uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&models.Notification{}).
		Where("id = ?", notificationID).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": now,
		}).Error
}

// ============================================
// STATS & ANALYTICS
// ============================================

func (s *GamificationService) GetGamificationStats(userID uuid.UUID) (*models.UserGamification, error) {
	var gamification models.UserGamification
	if err := s.db.Where("user_id = ?", userID).First(&gamification).Error; err != nil {
		// Create default
		gamification = models.UserGamification{
			UserID:        userID,
			TotalXP:       0,
			CurrentLevel:  1,
			XPToNextLevel: 200,
		}
		s.db.Create(&gamification)
	}

	// Get ranks
	gamification.GlobalRank, _ = s.GetUserRank(userID, "all_time")
	gamification.WeeklyRank, _ = s.GetUserRank(userID, "weekly")

	return &gamification, nil
}

func (s *GamificationService) GetUserAchievements(userID uuid.UUID) ([]models.UserAchievement, error) {
	var achievements []models.UserAchievement
	err := s.db.Where("user_id = ?", userID).
		Preload("Achievement").
		Order("earned_at DESC").
		Find(&achievements).Error
	return achievements, err
}

// GetDB returns the database instance for handlers
func (s *GamificationService) GetDB() *gorm.DB {
	return s.db
}
