package services

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MonetizationService struct {
	db *gorm.DB
}

func NewMonetizationService(db *gorm.DB) *MonetizationService {
	return &MonetizationService{db: db}
}

func (s *MonetizationService) GetDB() *gorm.DB {
	return s.db
}

// ==========================================
// CURRENCY & GEMS
// ==========================================

func (s *MonetizationService) GetUserCurrency(userID uuid.UUID) (*models.UserCurrency, error) {
	var currency models.UserCurrency
	err := s.db.Where("user_id = ?", userID).First(&currency).Error
	if err == gorm.ErrRecordNotFound {
		// Create new currency record
		currency = models.UserCurrency{
			UserID:                 userID,
			Gems:                   0,
			TotalGems:              0,
			StreakFreezesAvailable: 1, // Free users get 1/month
			LastFreezeReset:        time.Now(),
		}
		if err := s.db.Create(&currency).Error; err != nil {
			return nil, err
		}
		return &currency, nil
	}
	return &currency, err
}

func (s *MonetizationService) AddGems(userID uuid.UUID, amount int, reason, description string, relatedID *uuid.UUID, relatedType string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		// Get or create currency
		var currency models.UserCurrency
		if err := tx.Where("user_id = ?", userID).First(&currency).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				currency = models.UserCurrency{
					UserID:                 userID,
					Gems:                   amount,
					TotalGems:              amount,
					StreakFreezesAvailable: 1,
					LastFreezeReset:        time.Now(),
				}
				if err := tx.Create(&currency).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		} else {
			// Update balance
			if err := tx.Model(&currency).Updates(map[string]interface{}{
				"gems":        gorm.Expr("gems + ?", amount),
				"total_gems":  gorm.Expr("total_gems + ?", amount),
			}).Error; err != nil {
				return err
			}
		}

		// Record transaction
		transaction := models.GemTransaction{
			UserID:      userID,
			Amount:      amount,
			Reason:      reason,
			Description: description,
			RelatedID:   relatedID,
			RelatedType: relatedType,
		}
		return tx.Create(&transaction).Error
	})
}

func (s *MonetizationService) SpendGems(userID uuid.UUID, amount int, reason, description string) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		var currency models.UserCurrency
		if err := tx.Where("user_id = ?", userID).First(&currency).Error; err != nil {
			return err
		}

		if currency.Gems < amount {
			return fmt.Errorf("insufficient gems: have %d, need %d", currency.Gems, amount)
		}

		// Update balance
		if err := tx.Model(&currency).Update("gems", gorm.Expr("gems - ?", amount)).Error; err != nil {
			return err
		}

		// Record transaction
		transaction := models.GemTransaction{
			UserID:      userID,
			Amount:      -amount,
			Reason:      reason,
			Description: description,
		}
		return tx.Create(&transaction).Error
	})
}

// ==========================================
// STREAK FREEZE
// ==========================================

func (s *MonetizationService) CanUseStreakFreeze(userID uuid.UUID, isPremium bool) (bool, string, error) {
	var currency models.UserCurrency
	if err := s.db.Where("user_id = ?", userID).First(&currency).Error; err != nil {
		// Create default
		currency = models.UserCurrency{
			UserID:                 userID,
			Gems:                   0,
			StreakFreezesAvailable: 1,
			LastFreezeReset:        time.Now(),
		}
	}

	// Premium users get unlimited freezes
	if isPremium {
		return true, "premium", nil
	}

	// Check monthly reset
	now := time.Now()
	if currency.LastFreezeReset.Month() != now.Month() || currency.LastFreezeReset.Year() != now.Year() {
		// Reset monthly freeze
		currency.StreakFreezesAvailable = 1
		currency.StreakFreezesUsed = 0
		currency.LastFreezeReset = now
		s.db.Save(&currency)
	}

	if currency.StreakFreezesAvailable > currency.StreakFreezesUsed {
		return true, "free_monthly", nil
	}

	// Check if user has enough gems (50 gems = 1 freeze)
	if currency.Gems >= 50 {
		return true, "gems", nil
	}

	return false, "", nil
}

func (s *MonetizationService) UseStreakFreeze(userID uuid.UUID, isPremium bool) error {
	canUse, method, err := s.CanUseStreakFreeze(userID, isPremium)
	if err != nil {
		return err
	}
	if !canUse {
		return fmt.Errorf("no streak freeze available")
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		// Create freeze record
		freeze := models.StreakFreeze{
			UserID:        userID,
			FrozenDate:    time.Now().AddDate(0, 0, -1).Truncate(24 * time.Hour), // Yesterday
			PaymentMethod: method,
		}

		switch method {
		case "premium":
			freeze.GemCost = 0
		case "free_monthly":
			freeze.GemCost = 0
			if err := tx.Model(&models.UserCurrency{}).
				Where("user_id = ?", userID).
				Update("streak_freezes_used", gorm.Expr("streak_freezes_used + 1")).Error; err != nil {
				return err
			}
		case "gems":
			freeze.GemCost = 50
			if err := s.SpendGems(userID, 50, "streak_freeze", "Streak freeze purchase"); err != nil {
				return err
			}
		}

		freeze.UsedAt = time.Now()
		return tx.Create(&freeze).Error
	})
}

// ==========================================
// DAILY CHESTS / LOOT BOXES
// ==========================================

// ChestRewardConfig - Default reward configurations
var chestRewards = []struct {
	RewardType  string
	RewardValue int
	Weight      int
	MinStreak   int
	IsPremium   bool
}{
	// Common rewards (high weight)
	{"gems", 5, 30, 0, false},
	{"gems", 10, 25, 0, false},
	{"xp", 25, 25, 0, false},
	{"xp", 50, 20, 0, false},

	// Rare rewards (medium weight)
	{"gems", 25, 10, 3, false},
	{"xp", 100, 10, 3, false},
	{"avatar_item", 1, 8, 5, false}, // Common avatar item

	// Epic rewards (low weight)
	{"gems", 50, 5, 7, false},
	{"avatar_item", 2, 4, 7, false}, // Rare avatar item
	{"premium_pass", 24, 3, 0, false}, // 24-hour premium pass

	// Legendary rewards (very low weight)
	{"gems", 100, 2, 14, false},
	{"avatar_item", 3, 1, 14, true}, // Epic avatar item (premium only can be legendary)
}

func (s *MonetizationService) OpenDailyChest(userID uuid.UUID, currentStreak int, isPremium bool) (*models.UserChest, error) {
	// Calculate total weight
	totalWeight := 0
	eligibleRewards := []struct {
		RewardType  string
		RewardValue int
	}{}

	for _, r := range chestRewards {
		if r.MinStreak <= currentStreak && (!r.IsPremium || isPremium) {
			totalWeight += r.Weight
			eligibleRewards = append(eligibleRewards, struct {
				RewardType  string
				RewardValue int
			}{r.RewardType, r.RewardValue})
		}
	}

	if len(eligibleRewards) == 0 {
		// Fallback to basic reward
		eligibleRewards = []struct {
			RewardType  string
			RewardValue int
		}{{"gems", 5}}
		totalWeight = 1
	}

	// Random selection
	rand.Seed(time.Now().UnixNano())
	roll := rand.Intn(totalWeight)
	cumulative := 0
	var selectedReward struct {
		RewardType  string
		RewardValue int
	}

	for i, r := range chestRewards {
		if r.MinStreak <= currentStreak && (!r.IsPremium || isPremium) {
			cumulative += r.Weight
			if roll < cumulative {
				selectedReward = eligibleRewards[i]
				break
			}
		}
	}

	// Create chest record
	chest := models.UserChest{
		UserID:    userID,
		ChestType: models.ChestDaily,
		OpenedAt:  time.Now(),
	}

	if err := s.db.Create(&chest).Error; err != nil {
		return nil, err
	}

	// Create reward result
	result := models.ChestRewardResult{
		UserChestID: chest.ID,
		RewardType:  selectedReward.RewardType,
		RewardValue: selectedReward.RewardValue,
	}

	if err := s.db.Create(&result).Error; err != nil {
		return nil, err
	}

	// Grant the reward
	switch selectedReward.RewardType {
	case "gems":
		if err := s.AddGems(userID, selectedReward.RewardValue, "daily_chest", "Daily chest reward", &chest.ID, "chest"); err != nil {
			return nil, err
		}
	case "xp":
		// Add XP through gamification service
		// This would call the gamification service
	case "premium_pass":
		// Grant temporary premium access
		// This would update user's temporary premium status
	}

	chest.Rewards = []models.ChestRewardResult{result}
	return &chest, nil
}

// ==========================================
// PROGRESS DECAY
// ==========================================

func (s *MonetizationService) UpdateDecayStatus(userID uuid.UUID) (*models.UserDecayStatus, error) {
	var status models.UserDecayStatus
	err := s.db.Where("user_id = ?", userID).First(&status).Error
	if err == gorm.ErrRecordNotFound {
		status = models.UserDecayStatus{
			UserID:       userID,
			LastActiveAt: time.Now(),
			DecayLevel:   0,
		}
		if err := s.db.Create(&status).Error; err != nil {
			return nil, err
		}
		return &status, nil
	}

	// Update last active
	now := time.Now()
	status.LastActiveAt = now
	status.DecayLevel = 0 // Reset decay on activity
	s.db.Save(&status)

	return &status, err
}

func (s *MonetizationService) CheckDecayStatus(userID uuid.UUID) (*models.UserDecayStatus, error) {
	var status models.UserDecayStatus
	err := s.db.Where("user_id = ?", userID).First(&status).Error
	if err == gorm.ErrRecordNotFound {
		return s.UpdateDecayStatus(userID)
	}

	// Calculate days since last activity
	daysInactive := int(time.Since(status.LastActiveAt).Hours() / 24)

	// Determine decay level
	newDecayLevel := 0
	if daysInactive >= 3 {
		newDecayLevel = 3 // Level drop
	} else if daysInactive >= 2 {
		newDecayLevel = 2 // Visual decay
	} else if daysInactive >= 1 {
		newDecayLevel = 1 // Warning
	}

	if newDecayLevel != status.DecayLevel {
		status.DecayLevel = newDecayLevel
		if newDecayLevel > 0 && status.DecayStartedAt == nil {
			now := time.Now()
			status.DecayStartedAt = &now
		}
		s.db.Save(&status)
	}

	return &status, nil
}

func (s *MonetizationService) GetDecayMessage(decayLevel int) string {
	switch decayLevel {
	case 1:
		return "⏰ You haven't mewed today! Keep your streak alive!"
	case 2:
		return "⚠️ Your muscles are starting to relax. Don't lose your progress!"
	case 3:
		return "🚨 Your progress is fading! Your level may decrease if you don't practice soon!"
	default:
		return ""
	}
}

// ==========================================
// ACCOUNTABILITY PARTNERS
// ==========================================

func (s *MonetizationService) SendFriendRequest(requesterID, receiverID uuid.UUID) error {
	// Check if already connected
	var existing models.FriendConnection
	if err := s.db.Where("(requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)",
		requesterID, receiverID, receiverID, requesterID).First(&existing).Error; err == nil {
		return fmt.Errorf("friend request already exists")
	}

	connection := models.FriendConnection{
		RequesterID: requesterID,
		ReceiverID:  receiverID,
		Status:      "pending",
	}
	return s.db.Create(&connection).Error
}

func (s *MonetizationService) AcceptFriendRequest(connectionID uuid.UUID) error {
	now := time.Now()
	return s.db.Model(&models.FriendConnection{}).
		Where("id = ?", connectionID).
		Updates(map[string]interface{}{
			"status":      "accepted",
			"accepted_at": now,
		}).Error
}

func (s *MonetizationService) SendNudge(senderID, receiverID uuid.UUID, nudgeType string) error {
	nudge := models.NudgeHistory{
		SenderID:   senderID,
		ReceiverID: receiverID,
		NudgeType:  nudgeType,
		Message:    s.getNudgeMessage(nudgeType),
	}

	if err := s.db.Create(&nudge).Error; err != nil {
		return err
	}

	// Update friend connection nudge count
	return s.db.Model(&models.FriendConnection{}).
		Where("(requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)",
			senderID, receiverID, receiverID, senderID).
		Updates(map[string]interface{}{
			"nudge_count":        gorm.Expr("nudge_count + 1"),
			"last_nudge_sent_at": time.Now(),
		}).Error
}

func (s *MonetizationService) getNudgeMessage(nudgeType string) string {
	switch nudgeType {
	case "missed_session":
		return "Hey! You missed your mewing session today. Let's get back on track! 💪"
	case "streak_at_risk":
		return "Your streak is at risk! Don't lose your progress! 🔥"
	case "encouragement":
		return "You're doing great! Keep up the good work! ⭐"
	default:
		return "Time to mew! Your friend is waiting for you! 😤"
	}
}

func (s *MonetizationService) GetFriends(userID uuid.UUID) ([]models.FriendConnection, error) {
	var connections []models.FriendConnection
	err := s.db.Where("(requester_id = ? OR receiver_id = ?) AND status = ?", userID, userID, "accepted").
		Find(&connections).Error
	return connections, err
}

func (s *MonetizationService) GetFriendsLeaderboard(userID uuid.UUID, limit int) ([]map[string]interface{}, error) {
	// Get user's friends
	var friendIDs []uuid.UUID
	if err := s.db.Model(&models.FriendConnection{}).
		Select("CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END as friend_id", userID).
		Where("(requester_id = ? OR receiver_id = ?) AND status = ?", userID, userID, "accepted").
		Pluck("friend_id", &friendIDs).Error; err != nil {
		return nil, err
	}

	// Include self
	friendIDs = append(friendIDs, userID)

	// Get gamification data for friends
	var results []map[string]interface{}
	err := s.db.Table("user_gamifications").
		Select("user_id, total_xp, current_level, current_streak").
		Where("user_id IN ?", friendIDs).
		Order("total_xp DESC").
		Limit(limit).
		Find(&results).Error

	return results, err
}

// ==========================================
// INTRO OFFERS
// ==========================================

func (s *MonetizationService) GetActiveIntroOffers() ([]models.IntroOffer, error) {
	var offers []models.IntroOffer
	now := time.Now()
	err := s.db.Where("is_active = ? AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at >= ?)",
		true, now, now).
		Find(&offers).Error
	return offers, err
}

func (s *MonetizationService) RedeemIntroOffer(userID, offerID uuid.UUID) (*models.UserIntroOffer, error) {
	var offer models.IntroOffer
	if err := s.db.First(&offer, offerID).Error; err != nil {
		return nil, err
	}

	// Check if user already redeemed
	var existing models.UserIntroOffer
	if err := s.db.Where("user_id = ? AND offer_id = ?", userID, offerID).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("offer already redeemed")
	}

	userOffer := models.UserIntroOffer{
		UserID:     userID,
		OfferID:    offerID,
		RedeemedAt: time.Now(),
		ExpiresAt:  time.Now().AddDate(0, 0, offer.DurationDays),
	}

	if err := s.db.Create(&userOffer).Error; err != nil {
		return nil, err
	}

	return &userOffer, nil
}

// ==========================================
// SEED DATA
// ==========================================

func (s *MonetizationService) SeedIntroOffers() error {
	offers := []models.IntroOffer{
		{
			OfferType:        "3_day_challenge",
			Price:            0.99,
			OriginalPrice:    9.99,
			DiscountPercent:  90,
			DurationDays:     3,
			IsActive:         true,
		},
		{
			OfferType:        "first_month_discount",
			Price:            2.99,
			OriginalPrice:    9.99,
			DiscountPercent:  70,
			DurationDays:     30,
			IsActive:         true,
		},
		{
			OfferType:        "lifetime_access",
			Price:            199.00,
			OriginalPrice:    999.00,
			DiscountPercent:  80,
			DurationDays:     36500, // 100 years
			IsActive:         true,
		},
	}

	for _, offer := range offers {
		s.db.FirstOrCreate(&offer, models.IntroOffer{OfferType: offer.OfferType})
	}

	return nil
}

func (s *MonetizationService) SeedAvatarItems() error {
	items := []models.AvatarItem{
		// Common items
		{Name: "Basic Cap", Category: "accessory", Rarity: 1, GemCost: 25},
		{Name: "Sunglasses", Category: "accessory", Rarity: 1, GemCost: 30},
		{Name: "Simple Background", Category: "background", Rarity: 1, GemCost: 20},

		// Rare items
		{Name: "Cool Headband", Category: "accessory", Rarity: 2, ChestOnly: true},
		{Name: "Jawline Mask", Category: "face", Rarity: 2, ChestOnly: true},
		{Name: "Gym Background", Category: "background", Rarity: 2, ChestOnly: true},

		// Epic items
		{Name: "Golden Crown", Category: "accessory", Rarity: 3, IsPremium: true},
		{Name: "Fire Eyes", Category: "face", Rarity: 3, IsPremium: true},

		// Legendary items
		{Name: "Diamond Jawline", Category: "face", Rarity: 4, IsPremium: true},
		{Name: "Cosmic Background", Category: "background", Rarity: 4, IsPremium: true},
	}

	for _, item := range items {
		s.db.FirstOrCreate(&item, models.AvatarItem{Name: item.Name})
	}

	return nil
}
