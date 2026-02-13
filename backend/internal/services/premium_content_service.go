package services

import (
	"fmt"
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PremiumContentService struct {
	db *gorm.DB
}

func NewPremiumContentService(db *gorm.DB) *PremiumContentService {
	return &PremiumContentService{db: db}
}

// ==========================================
// DAILY ROUTINES
// ==========================================

func (s *PremiumContentService) GetTodayRoutine(userID uuid.UUID) (*models.DailyRoutine, error) {
	today := time.Now().Truncate(24 * time.Hour)

	var routine models.DailyRoutine
	err := s.db.Where("user_id = ? AND date = ?", userID, today).First(&routine).Error
	if err == gorm.ErrRecordNotFound {
		// Generate new routine
		return s.generateDailyRoutine(userID, today)
	}

	return &routine, err
}

func (s *PremiumContentService) generateDailyRoutine(userID uuid.UUID, date time.Time) (*models.DailyRoutine, error) {
	// Get user's focus areas from latest scan
	focusAreas := s.getUserFocusAreas(userID)

	// Get exercises for each time of day
	morningExercises := s.selectExercises(models.Morning, focusAreas, 15) // 15 min morning
	eveningExercises := s.selectExercises(models.Evening, focusAreas, 20) // 20 min evening

	routine := models.DailyRoutine{
		UserID:            userID,
		Date:              date,
		MorningExercises:  morningExercises,
		EveningExercises:  eveningExercises,
		MorningMinutes:    15,
		EveningMinutes:    20,
		GeneratedByAI:     true,
	}

	if err := s.db.Create(&routine).Error; err != nil {
		return nil, err
	}

	return &routine, nil
}

func (s *PremiumContentService) getUserFocusAreas(userID uuid.UUID) []string {
	// Get latest analysis and identify weak areas
	var analysis models.FaceAnalysis
	err := s.db.Where("user_id = ?", userID).
		Order("analyzed_at DESC").
		First(&analysis).Error

	if err != nil {
		return []string{"jawline", "chin"} // Default
	}

	// Identify areas below 7.0
	var focusAreas []string
	if analysis.JawlineScore < 7.0 {
		focusAreas = append(focusAreas, "jawline")
	}
	if analysis.SkinScore < 7.0 {
		focusAreas = append(focusAreas, "skin")
	}
	if analysis.SymmetryScore < 7.0 {
		focusAreas = append(focusAreas, "symmetry")
	}
	if analysis.OverallScore < 6.0 {
		focusAreas = append(focusAreas, "posture", "breathing")
	}

	if len(focusAreas) == 0 {
		focusAreas = []string{"jawline"} // Maintenance
	}

	return focusAreas
}

func (s *PremiumContentService) selectExercises(timeOfDay models.TimeOfDay, focusAreas []string, targetMinutes int) []uuid.UUID {
	var exercises []models.MewingExercise
	s.db.Where("time_of_day = ? AND is_active = ?", timeOfDay, true).
		Order("RANDOM()").
		Find(&exercises)

	// Filter by target areas if premium content available
	var selected []uuid.UUID
	totalMinutes := 0

	for _, ex := range exercises {
		if totalMinutes >= targetMinutes {
			break
		}

		// Check if exercise targets focus areas
		hasTargetArea := false
		for _, area := range focusAreas {
			for _, targetArea := range ex.TargetAreas {
				if area == targetArea {
					hasTargetArea = true
					break
				}
			}
		}

		if hasTargetArea || len(selected) < 2 {
			selected = append(selected, ex.ID)
			totalMinutes += ex.DurationSeconds / 60
		}
	}

	return selected
}

// ==========================================
// WEEKLY PLANS
// ==========================================

func (s *PremiumContentService) GetCurrentWeekPlan(userID uuid.UUID) (*models.WeeklyPlan, error) {
	now := time.Now()
	weekStart := now.AddDate(0, 0, -int(now.Weekday())+1).Truncate(24 * time.Hour)

	var plan models.WeeklyPlan
	err := s.db.Where("user_id = ? AND week_start = ?", userID, weekStart).First(&plan).Error
	if err == gorm.ErrRecordNotFound {
		return s.generateWeeklyPlan(userID, weekStart)
	}

	return &plan, err
}

func (s *PremiumContentService) generateWeeklyPlan(userID uuid.UUID, weekStart time.Time) (*models.WeeklyPlan, error) {
	focusAreas := s.getUserFocusAreas(userID)

	// Get user's current level and adjust goals
	var gamification models.UserGamification
	s.db.Where("user_id = ?", userID).First(&gamification)

	level := gamification.CurrentLevel
	baseMinutes := 120 // 2 hours base
	if level > 10 {
		baseMinutes = 180 // 3 hours for advanced
	}
	if level > 25 {
		baseMinutes = 240 // 4 hours for experts
	}

	// Distribute across the week (rest day on Sunday)
	dailyMinutes := []int{
		baseMinutes / 6, // Monday
		baseMinutes / 6, // Tuesday
		baseMinutes / 6, // Wednesday
		baseMinutes / 6, // Thursday
		baseMinutes / 6, // Friday
		baseMinutes / 6, // Saturday
		30,              // Sunday (light)
	}

	plan := models.WeeklyPlan{
		UserID:            userID,
		WeekStart:         weekStart,
		WeeklyGoalMinutes: baseMinutes,
		WeeklyGoalSessions: 12, // 2 per day avg
		MondayGoal:        dailyMinutes[0],
		TuesdayGoal:       dailyMinutes[1],
		WednesdayGoal:     dailyMinutes[2],
		ThursdayGoal:      dailyMinutes[3],
		FridayGoal:        dailyMinutes[4],
		SaturdayGoal:      dailyMinutes[5],
		SundayGoal:        dailyMinutes[6],
		FocusAreas:        focusAreas,
		GeneratedByAI:     true,
		AIInsights:        s.generatePlanInsights(focusAreas, level),
	}

	if err := s.db.Create(&plan).Error; err != nil {
		return nil, err
	}

	return &plan, nil
}

func (s *PremiumContentService) generatePlanInsights(focusAreas []string, level int) string {
	insights := "Based on your recent scans, we're focusing on: "

	for i, area := range focusAreas {
		if i > 0 {
			insights += ", "
		}
		insights += area
	}

	insights += ". "

	if level < 5 {
		insights += "As a beginner, start with shorter sessions and focus on proper technique."
	} else if level < 15 {
		insights += "You're making progress! Let's increase intensity this week."
	} else {
		insights += "You're an advanced practitioner. Focus on refining technique and consistency."
	}

	return insights
}

// ==========================================
// PERSONALIZED TIPS
// ==========================================

func (s *PremiumContentService) GetPersonalizedTips(userID uuid.UUID, limit int) ([]models.PersonalizedTip, error) {
	var tips []models.PersonalizedTip

	// Get existing tips that haven't been shown recently
	err := s.db.Where("user_id = ? AND is_active = ?", userID, true).
		Order("priority DESC, RANDOM()").
		Limit(limit).
		Find(&tips).Error

	if err != nil {
		return nil, err
	}

	// Generate new tips if needed
	if len(tips) < limit {
		newTips := s.generatePersonalizedTips(userID, limit-len(tips))
		tips = append(tips, newTips...)
	}

	return tips, nil
}

func (s *PremiumContentService) generatePersonalizedTips(userID uuid.UUID, count int) []models.PersonalizedTip {
	tips := []models.PersonalizedTip{}

	// Get user context
	var gamification models.UserGamification
	s.db.Where("user_id = ?", userID).First(&gamification)

	var mewingToday struct{ Minutes int }
	s.db.Table("mewing_logs").
		Select("COALESCE(SUM(mewing_minutes), 0) as minutes").
		Where("user_id = ? AND date = ?", userID, time.Now().Truncate(24*time.Hour)).
		Scan(&mewingToday)

	// Generate contextual tips
	if gamification.CurrentStreak >= 3 && gamification.CurrentStreak < 7 {
		tips = append(tips, models.PersonalizedTip{
			UserID:      userID,
			Title:       "Streak in Danger!",
			Description: fmt.Sprintf("You're on a %d day streak! Don't break it - do a quick 5-min session.", gamification.CurrentStreak),
			Icon:        "flame",
			Category:    "motivation",
			Priority:    5,
			BasedOn:     "streak_break_risk",
			ShowAt:      models.Evening,
		})
	}

	if mewingToday.Minutes < 30 {
		tips = append(tips, models.PersonalizedTip{
			UserID:      userID,
			Title:       "Today's Goal: 30 Minutes",
			Description: fmt.Sprintf("You've done %d minutes today. Push for 30!", mewingToday.Minutes),
			Icon:        "timer",
			Category:    "motivation",
			Priority:    4,
			BasedOn:     "daily_goal_progress",
			ShowAt:      models.Afternoon,
		})
	}

	// Technique tips
	techniqueTips := []struct {
		title, desc, icon string
	}{
		{"Tongue Position", "Ensure your entire tongue is pressed against the roof of your mouth, not just the tip.", "fitness"},
		{"Breathe Through Nose", "Keep lips sealed and breathe through your nose during mewing.", "leaf"},
		{"Posture Check", "Maintain good neck posture - chin slightly tucked, spine straight.", "body"},
		{"Light Pressure", "Don't force it! Use gentle, consistent pressure rather than straining.", "hand-left"},
		{"Hydration Matters", "Drink water! Proper hydration helps muscle function and recovery.", "water"},
		{"Avoid Teeth Contact", "Your tongue should touch the roof of mouth, NOT press against teeth.", "warning"},
	}

	for i, tip := range techniqueTips {
		if len(tips) >= count {
			break
		}
		tips = append(tips, models.PersonalizedTip{
			UserID:      userID,
			Title:       tip.title,
			Description: tip.desc,
			Icon:        tip.icon,
			Category:    "technique",
			Priority:    3,
			BasedOn:     "rotating_technique",
			ShowAt:      models.TimeOfDay((i % 4) + 1),
			IsPremium:   i >= 3, // First 3 free, rest premium
		})
	}

	// Save to DB
	for i := range tips {
		if tips[i].ID == uuid.Nil {
			s.db.Create(&tips[i])
		}
	}

	return tips
}

// ==========================================
// EXERCISES
// ==========================================

func (s *PremiumContentService) GetExercises(exerciseType models.ExerciseType, isPremium bool) ([]models.MewingExercise, error) {
	query := s.db.Where("is_active = ?", true)

	if exerciseType != "" {
		query = query.Where("type = ?", exerciseType)
	}

	// Non-premium users can only see free exercises
	if !isPremium {
		query = query.Where("is_premium = ?", false)
	}

	var exercises []models.MewingExercise
	err := query.Order("difficulty, name").Find(&exercises).Error

	return exercises, err
}

func (s *PremiumContentService) GetExerciseByID(exerciseID uuid.UUID) (*models.MewingExercise, error) {
	var exercise models.MewingExercise
	err := s.db.Preload("Instructions").First(&exercise, exerciseID).Error
	return &exercise, err
}

// ==========================================
// SUBSCRIPTION CHECKS
// ==========================================

func (s *PremiumContentService) IsPremium(userID uuid.UUID) bool {
	var subscription models.UserSubscription
	err := s.db.Where("user_id = ? AND is_active = ? AND (end_date IS NULL OR end_date > ?)",
		userID, true, time.Now()).
		First(&subscription).Error
	return err == nil
}

func (s *PremiumContentService) GetSubscriptionTier(userID uuid.UUID) (*models.SubscriptionTier, error) {
	var subscription models.UserSubscription
	err := s.db.Where("user_id = ? AND is_active = ? AND (end_date IS NULL OR end_date > ?)",
		userID, true, time.Now()).
		Preload("Tier").
		First(&subscription).Error

	if err != nil {
		// Return free tier
		var freeTier models.SubscriptionTier
		s.db.Where("code = ?", "free").First(&freeTier)
		return &freeTier, nil
	}

	return &subscription.Tier, nil
}

// ==========================================
// SEED DATA
// ==========================================

func (s *PremiumContentService) SeedExercises() error {
	exercises := []models.MewingExercise{
		// Quick exercises (5 min)
		{
			Name:            "Quick Tongue Posture Check",
			Description:     "A fast check to ensure proper tongue positioning",
			Icon:            "checkmark-circle",
			Type:            models.ExerciseQuick,
			TimeOfDay:       models.Morning,
			DurationSeconds: 300,
			TargetAreas:     []string{"tongue", "posture"},
			IsPremium:        false,
			Tips:            []string{"Do this every morning", "Hold each position for 30 seconds"},
		},
		{
			Name:            "Wake-Up Jaw Stretch",
			Description:     "Gentle jaw exercises to start your day",
			Icon:            "sunny",
			Type:            models.ExerciseQuick,
			TimeOfDay:       models.Morning,
			DurationSeconds: 300,
			TargetAreas:     []string{"jawline", "chin"},
			IsPremium:        false,
		},
		{
			Name:            "Pre-Sleep Relaxation",
			Description:     "Calm your facial muscles before bed",
			Icon:            "moon",
			Type:            models.ExerciseQuick,
			TimeOfDay:       models.Night,
			DurationSeconds: 300,
			TargetAreas:     []string{"relaxation", "posture"},
			IsPremium:        false,
		},

		// Focused exercises (15 min)
		{
			Name:            "Jawline Definition Set",
			Description:     "Targeted exercises for a sharper jawline",
			Icon:            "fitness",
			Type:            models.ExerciseFocused,
			TimeOfDay:       models.Morning,
			DurationSeconds: 900,
			TargetAreas:     []string{"jawline"},
			IsPremium:        false,
		},
		{
			Name:            "Chin Sculpting Routine",
			Description:     "Exercises focused on chin definition",
			Icon:            "arrow-down",
			Type:            models.ExerciseFocused,
			TimeOfDay:       models.Afternoon,
			DurationSeconds: 900,
			TargetAreas:     []string{"chin"},
			IsPremium:        true,
		},
		{
			Name:            "Cheekbone Lifting",
			Description:     "Define and lift your cheekbones",
			Icon:            "arrow-up",
			Type:            models.ExerciseFocused,
			TimeOfDay:       models.Evening,
			DurationSeconds: 900,
			TargetAreas:     []string{"cheekbones"},
			IsPremium:        true,
		},

		// Deep exercises (30 min)
		{
			Name:            "Complete Face Workout",
			Description:     "Full facial muscle training session",
			Icon:            "body",
			Type:            models.ExerciseDeep,
			TimeOfDay:       models.Morning,
			DurationSeconds: 1800,
			TargetAreas:     []string{"jawline", "chin", "cheekbones"},
			IsPremium:        true,
		},
		{
			Name:            "Advanced Mewing Session",
			Description:     "Deep mewing with breathing exercises",
			Icon:            "leaf",
			Type:            models.ExerciseDeep,
			TimeOfDay:       models.Evening,
			DurationSeconds: 1800,
			TargetAreas:     []string{"jawline", "breathing", "posture"},
			IsPremium:        true,
		},

		// Marathon (60 min)
		{
			Name:            "Ultimate Transformation Session",
			Description:     "Complete mewing masterclass for dedicated practitioners",
			Icon:            "trophy",
			Type:            models.ExerciseMarathon,
			TimeOfDay:       models.Evening,
			DurationSeconds: 3600,
			TargetAreas:     []string{"jawline", "chin", "cheekbones", "posture", "breathing"},
			IsPremium:       true,
		},
	}

	for _, exercise := range exercises {
		s.db.FirstOrCreate(&exercise, models.MewingExercise{Name: exercise.Name})
	}

	return nil
}

func (s *PremiumContentService) SeedSubscriptionTiers() error {
	tiers := []models.SubscriptionTier{
		{
			Code:                "free",
			Name:                "Free",
			Description:         "Get started with basic mewing",
			MonthlyPrice:        0,
			DailyScanLimit:      3,
			DailySessionLimit:   2,
			StreakFreezeLimit:   1,
			HasAICoaching:       false,
			HasPersonalizedPlan: false,
			HasVideoGuides:      false,
			HasNoAds:           false,
		},
		{
			Code:                "premium",
			Name:                "Premium",
			Description:         "Everything you need to transform",
			MonthlyPrice:        9.99,
			YearlyPrice:         79.99,
			YearlyDiscount:      33,
			DailyScanLimit:      -1, // Unlimited
			DailySessionLimit:   -1,
			StreakFreezeLimit:   5,
			HasAICoaching:       true,
			HasPersonalizedPlan: true,
			HasVideoGuides:      true,
			HasNoAds:           true,
		},
		{
			Code:                "vip",
			Name:                "VIP",
			Description:         "The ultimate mewing experience",
			MonthlyPrice:        19.99,
			YearlyPrice:         159.99,
			YearlyDiscount:      33,
			DailyScanLimit:      -1,
			DailySessionLimit:   -1,
			StreakFreezeLimit:   -1, // Unlimited
			HasAICoaching:       true,
			HasPersonalizedPlan: true,
			HasVideoGuides:      true,
			HasPrioritySupport:  true,
			HasNoAds:           true,
		},
	}

	for _, tier := range tiers {
		s.db.FirstOrCreate(&tier, models.SubscriptionTier{Code: tier.Code})
	}

	return nil
}
