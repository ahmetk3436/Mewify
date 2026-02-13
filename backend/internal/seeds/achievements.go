package seeds

import (
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"gorm.io/gorm"
)

func SeedAchievements(db *gorm.DB) error {
	achievements := []models.Achievement{
		// ============ SCANS ============
		{Code: "first_scan", Name: "Hello, World!", Description: "Complete your first face scan", Icon: "camera", Category: "scans", RequirementType: "scan_count", RequirementValue: 1, XPReward: 50, Rarity: 1, SortOrder: 1},
		{Code: "scan_5", Name: "Getting Started", Description: "Complete 5 face scans", Icon: "scan-outline", Category: "scans", RequirementType: "scan_count", RequirementValue: 5, XPReward: 100, Rarity: 1, SortOrder: 2},
		{Code: "scan_10", Name: "Regular Scanner", Description: "Complete 10 face scans", Icon: "scan", Category: "scans", RequirementType: "scan_count", RequirementValue: 10, XPReward: 200, Rarity: 2, SortOrder: 3},
		{Code: "scan_25", Name: "Scanner Pro", Description: "Complete 25 face scans", Icon: "barcode-outline", Category: "scans", RequirementType: "scan_count", RequirementValue: 25, XPReward: 400, Rarity: 2, SortOrder: 4},
		{Code: "scan_50", Name: "Scan Master", Description: "Complete 50 face scans", Icon: "analytics", Category: "scans", RequirementType: "scan_count", RequirementValue: 50, XPReward: 800, Rarity: 3, SortOrder: 5},
		{Code: "scan_100", Name: "Century Scanner", Description: "Complete 100 face scans", Icon: "ribbon", Category: "scans", RequirementType: "scan_count", RequirementValue: 100, XPReward: 1500, Rarity: 3, SortOrder: 6},
		{Code: "scan_365", Name: "Year of Scanning", Description: "Complete 365 face scans", Icon: "calendar", Category: "scans", RequirementType: "scan_count", RequirementValue: 365, XPReward: 5000, Rarity: 4, IsLegendary: true, SortOrder: 7},

		// ============ STREAKS ============
		{Code: "streak_3", Name: "On Fire!", Description: "Maintain a 3-day streak", Icon: "flame-outline", Category: "streak", RequirementType: "streak", RequirementValue: 3, XPReward: 75, Rarity: 1, SortOrder: 10},
		{Code: "streak_7", Name: "Week Warrior", Description: "Maintain a 7-day streak", Icon: "flame", Category: "streak", RequirementType: "streak", RequirementValue: 7, XPReward: 200, Rarity: 2, SortOrder: 11},
		{Code: "streak_14", Name: "Two Week Champion", Description: "Maintain a 14-day streak", Icon: "medal-outline", Category: "streak", RequirementType: "streak", RequirementValue: 14, XPReward: 400, Rarity: 2, SortOrder: 12},
		{Code: "streak_30", Name: "Monthly Master", Description: "Maintain a 30-day streak", Icon: "medal", Category: "streak", RequirementType: "streak", RequirementValue: 30, XPReward: 800, Rarity: 3, SortOrder: 13},
		{Code: "streak_60", Name: "Double Month", Description: "Maintain a 60-day streak", Icon: "trophy-outline", Category: "streak", RequirementType: "streak", RequirementValue: 60, XPReward: 1500, Rarity: 3, SortOrder: 14},
		{Code: "streak_100", Name: "Century Streak", Description: "Maintain a 100-day streak", Icon: "trophy", Category: "streak", RequirementType: "streak", RequirementValue: 100, XPReward: 3000, Rarity: 4, IsLegendary: true, SortOrder: 15},
		{Code: "streak_365", Name: "Year of Dedication", Description: "Maintain a 365-day streak", Icon: "star", Category: "streak", RequirementType: "streak", RequirementValue: 365, XPReward: 10000, Rarity: 4, IsLegendary: true, IsSecret: true, SortOrder: 16},

		// ============ SCORES ============
		{Code: "score_5", Name: "First Steps", Description: "Achieve a score of 5 or higher", Icon: "trending-up-outline", Category: "scores", RequirementType: "score", RequirementValue: 5, XPReward: 50, Rarity: 1, SortOrder: 20},
		{Code: "score_6", Name: "Above Average", Description: "Achieve a score of 6 or higher", Icon: "trending-up", Category: "scores", RequirementType: "score", RequirementValue: 6, XPReward: 100, Rarity: 1, SortOrder: 21},
		{Code: "score_7", Name: "Good Progress", Description: "Achieve a score of 7 or higher", Icon: "star-outline", Category: "scores", RequirementType: "score", RequirementValue: 7, XPReward: 200, Rarity: 2, SortOrder: 22},
		{Code: "score_8", Name: "Great Results", Description: "Achieve a score of 8 or higher", Icon: "star-half", Category: "scores", RequirementType: "score", RequirementValue: 8, XPReward: 400, Rarity: 2, SortOrder: 23},
		{Code: "score_9", Name: "Excellence", Description: "Achieve a score of 9 or higher", Icon: "star", Category: "scores", RequirementType: "score", RequirementValue: 9, XPReward: 800, Rarity: 3, SortOrder: 24},
		{Code: "score_10", Name: "Perfection", Description: "Achieve a perfect score of 10", Icon: "diamond", Category: "scores", RequirementType: "score", RequirementValue: 10, XPReward: 2000, Rarity: 4, IsLegendary: true, SortOrder: 25},

		// ============ MEWING TIME ============
		{Code: "mewing_60", Name: "Hour Hero", Description: "Mew for 60 minutes total", Icon: "timer-outline", Category: "mewing", RequirementType: "mewing_minutes", RequirementValue: 60, XPReward: 100, Rarity: 1, SortOrder: 30},
		{Code: "mewing_600", Name: "10 Hour Club", Description: "Mew for 10 hours total", Icon: "timer", Category: "mewing", RequirementType: "mewing_minutes", RequirementValue: 600, XPReward: 300, Rarity: 2, SortOrder: 31},
		{Code: "mewing_3000", Name: "50 Hour Club", Description: "Mew for 50 hours total", Icon: "hourglass-outline", Category: "mewing", RequirementType: "mewing_minutes", RequirementValue: 3000, XPReward: 800, Rarity: 2, SortOrder: 32},
		{Code: "mewing_6000", Name: "100 Hour Club", Description: "Mew for 100 hours total", Icon: "hourglass", Category: "mewing", RequirementType: "mewing_minutes", RequirementValue: 6000, XPReward: 2000, Rarity: 3, SortOrder: 33},
		{Code: "mewing_30000", Name: "500 Hour Legend", Description: "Mew for 500 hours total", Icon: "infinite", Category: "mewing", RequirementType: "mewing_minutes", RequirementValue: 30000, XPReward: 5000, Rarity: 4, IsLegendary: true, SortOrder: 34},

		// ============ LEVELS ============
		{Code: "level_5", Name: "Rising Star", Description: "Reach level 5", Icon: "rocket-outline", Category: "levels", RequirementType: "level", RequirementValue: 5, XPReward: 200, Rarity: 1, SortOrder: 40},
		{Code: "level_10", Name: "Established", Description: "Reach level 10", Icon: "rocket", Category: "levels", RequirementType: "level", RequirementValue: 10, XPReward: 500, Rarity: 2, SortOrder: 41},
		{Code: "level_25", Name: "Veteran", Description: "Reach level 25", Icon: "shield-outline", Category: "levels", RequirementType: "level", RequirementValue: 25, XPReward: 1500, Rarity: 3, SortOrder: 42},
		{Code: "level_50", Name: "Elite", Description: "Reach level 50", Icon: "shield", Category: "levels", RequirementType: "level", RequirementValue: 50, XPReward: 5000, Rarity: 4, IsLegendary: true, SortOrder: 43},
		{Code: "level_100", Name: "Legend", Description: "Reach level 100", Icon: "crown", Category: "levels", RequirementType: "level", RequirementValue: 100, XPReward: 20000, Rarity: 4, IsLegendary: true, IsSecret: true, SortOrder: 44},

		// ============ SOCIAL ============
		{Code: "friend_1", Name: "Social Butterfly", Description: "Add your first friend", Icon: "person-add-outline", Category: "social", RequirementType: "friends", RequirementValue: 1, XPReward: 50, Rarity: 1, SortOrder: 50},
		{Code: "friend_5", Name: "Popular", Description: "Have 5 friends", Icon: "people-outline", Category: "social", RequirementType: "friends", RequirementValue: 5, XPReward: 200, Rarity: 2, SortOrder: 51},
		{Code: "friend_20", Name: "Influencer", Description: "Have 20 friends", Icon: "people", Category: "social", RequirementType: "friends", RequirementValue: 20, XPReward: 800, Rarity: 3, SortOrder: 52},
		{Code: "friend_50", Name: "Celebrity", Description: "Have 50 friends", Icon: "globe", Category: "social", RequirementType: "friends", RequirementValue: 50, XPReward: 2000, Rarity: 4, IsLegendary: true, SortOrder: 53},

		// ============ SPECIAL (SECRET) ============
		{Code: "early_adopter", Name: "Early Adopter", Description: "Joined Mewify in the first month", Icon: "flash", Category: "special", RequirementType: "special", RequirementValue: 0, XPReward: 1000, Rarity: 4, IsLegendary: true, IsSecret: true, SortOrder: 100},
		{Code: "perfectionist", Name: "Perfectionist", Description: "Get 10 consecutive 10/10 scores", Icon: "checkmark-done", Category: "special", RequirementType: "special", RequirementValue: 10, XPReward: 5000, Rarity: 4, IsLegendary: true, IsSecret: true, SortOrder: 101},
		{Code: "night_owl", Name: "Night Owl", Description: "Complete a session between 2-4 AM", Icon: "moon", Category: "special", RequirementType: "special", RequirementValue: 0, XPReward: 200, Rarity: 2, IsSecret: true, SortOrder: 102},
		{Code: "early_bird", Name: "Early Bird", Description: "Complete a session before 6 AM", Icon: "sunny", Category: "special", RequirementType: "special", RequirementValue: 0, XPReward: 200, Rarity: 2, IsSecret: true, SortOrder: 103},
		{Code: "dedicated", Name: "Truly Dedicated", Description: "Mew for 2+ hours in a single session", Icon: "heart", Category: "special", RequirementType: "special", RequirementValue: 120, XPReward: 500, Rarity: 3, IsSecret: true, SortOrder: 104},
	}

	for _, achievement := range achievements {
		if err := db.FirstOrCreate(&achievement, models.Achievement{Code: achievement.Code}).Error; err != nil {
			return err
		}
	}

	return nil
}
