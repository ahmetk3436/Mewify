package models

import (
	"time"

	"github.com/google/uuid"
)

// ==========================================
// CURRENCY & ECONOMY
// ==========================================

// UserCurrency - Kullanıcı para birimi
type UserCurrency struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`

	// Gems (soft currency - earned through activities)
	Gems         int `gorm:"default:0" json:"gems"`
	TotalGems    int `gorm:"default:0" json:"total_gems"` // Lifetime earned

	// Streak Freezes available (free users get 1/month, premium unlimited)
	StreakFreezesAvailable int `gorm:"default:1" json:"streak_freezes_available"`
	StreakFreezesUsed      int `gorm:"default:0" json:"streak_freezes_used"`

	// Monthly reset
	LastFreezeReset time.Time `json:"last_freeze_reset"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GemTransaction - Gem hareketleri
type GemTransaction struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	// Transaction info
	Amount      int    `gorm:"not null" json:"amount"` // Positive = earn, Negative = spend
	Reason      string `gorm:"not null" json:"reason"` // "session_complete", "streak_freeze", "daily_chest", etc.
	Description string `json:"description"`

	// Related entity
	RelatedID   *uuid.UUID `json:"related_id"`   // Session ID, Achievement ID, etc.
	RelatedType string     `json:"related_type"` // "session", "achievement", "chest"

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// STREAK FREEZE
// ==========================================

// StreakFreeze - Streak koruma kaydı
type StreakFreeze struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	// Which day was frozen
	FrozenDate time.Time `gorm:"type:date;not null" json:"frozen_date"`

	// How it was paid for
	PaymentMethod string `gorm:"not null" json:"payment_method"` // "gems", "premium", "free_monthly"
	GemCost       int    `gorm:"default:0" json:"gem_cost"`

	// Status
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	UsedAt    time.Time `json:"used_at"`

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// LOOT BOXES / DAILY CHESTS
// ==========================================

// ChestType - Sandık türleri
type ChestType string

const (
	ChestDaily    ChestType = "daily"    // Her session sonrası
	ChestStreak   ChestType = "streak"   // Streak milestone
	ChestWeekly   ChestType = "weekly"   // Haftalık ödül
	ChestAchievement ChestType = "achievement" // Achievement ödülü
)

// ChestReward - Sandık ödülü tanımı
type ChestReward struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Type      ChestType `gorm:"not null" json:"type"`

	// Reward content
	RewardType  string `gorm:"not null" json:"reward_type"`  // "gems", "xp", "avatar_item", "premium_pass"
	RewardValue int    `gorm:"not null" json:"reward_value"` // Amount or item ID

	// Probability
	Weight      int `gorm:"default:1" json:"weight"`       // Higher = more likely
	MinStreak   int `gorm:"default:0" json:"min_streak"`   // Minimum streak to be eligible
	IsPremium   bool `gorm:"default:false" json:"is_premium"` // Premium only reward

	IsActive bool `gorm:"default:true" json:"is_active"`
}

// UserChest - Kullanıcının açtığı sandıklar
type UserChest struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	// Chest info
	ChestType ChestType `gorm:"not null" json:"chest_type"`

	// Rewards earned
	Rewards []ChestRewardResult `gorm:"foreignKey:UserChestID" json:"rewards"`

	// When opened
	OpenedAt time.Time `json:"opened_at"`

	CreatedAt time.Time `json:"created_at"`
}

// ChestRewardResult - Sandık açılma sonucu
type ChestRewardResult struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserChestID  uuid.UUID `gorm:"type:uuid;not null;index" json:"user_chest_id"`

	RewardType  string `gorm:"not null" json:"reward_type"`
	RewardValue int    `gorm:"not null" json:"reward_value"`

	// For avatar items
	ItemID      *uuid.UUID `json:"item_id"`
	ItemName    string     `json:"item_name"`

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// PROGRESS DECAY
// ==========================================

// UserDecayStatus - Kullanıcı decay durumu
type UserDecayStatus struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`

	// Last activity
	LastActiveAt time.Time `json:"last_active_at"`

	// Decay level (0 = no decay, 1 = warning, 2 = visual decay, 3 = level drop)
	DecayLevel    int `gorm:"default:0" json:"decay_level"`
	DecayStartedAt *time.Time `json:"decay_started_at"`

	// How many levels lost to decay
	LevelsLostToDecay int `gorm:"default:0" json:"levels_lost_to_decay"`

	// Warnings sent
	WarningSentAt *time.Time `json:"warning_sent_at"`

	UpdatedAt time.Time `json:"updated_at"`
}

// ==========================================
// SHAREABLE CONTENT
// ==========================================

// ShareableCard - Paylaşılabilir kart
type ShareableCard struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	// Card type
	CardType string `gorm:"not null" json:"card_type"` // "before_after", "milestone", "streak", "score"

	// Content
	BeforeImageURL string `json:"before_image_url"`
	AfterImageURL  string `json:"after_image_url"`
	DayCount       int    `json:"day_count"`
	ScoreBefore    float64 `json:"score_before"`
	ScoreAfter     float64 `json:"score_after"`

	// Generated image
	GeneratedImageURL string `json:"generated_image_url"`

	// Sharing stats
	SharedOn    []string `gorm:"type:text[]" json:"shared_on"` // ["instagram", "twitter"]
	ShareCount  int      `gorm:"default:0" json:"share_count"`

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// ACCOUNTABILITY PARTNERS
// ==========================================

// FriendConnection - Arkadaşlık bağlantısı
type FriendConnection struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	// Users
	RequesterID uuid.UUID `gorm:"type:uuid;not null;index" json:"requester_id"`
	ReceiverID  uuid.UUID `gorm:"type:uuid;not null;index" json:"receiver_id"`

	// Status
	Status     string    `gorm:"not null;default:'pending'" json:"status"` // pending, accepted, blocked
	AcceptedAt *time.Time `json:"accepted_at"`

	// Accountability features
	NudgeCount       int `gorm:"default:0" json:"nudge_count"`        // How many times nudged
	LastNudgeSentAt  *time.Time `json:"last_nudge_sent_at"`
	NudgedByPartner  bool `gorm:"default:false" json:"nudged_by_partner"` // Was nudged by this partner

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// NudgeHistory - Nudge geçmişi
type NudgeHistory struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	SenderID   uuid.UUID `gorm:"type:uuid;not null;index" json:"sender_id"`
	ReceiverID uuid.UUID `gorm:"type:uuid;not null;index" json:"receiver_id"`

	// Nudge context
	NudgeType string `gorm:"not null" json:"nudge_type"` // "missed_session", "streak_at_risk", "encouragement"
	Message   string `json:"message"`

	// Response
	WasOpened   bool      `gorm:"default:false" json:"was_opened"`
	OpenedAt    *time.Time `json:"opened_at"`
	RespondedAt *time.Time `json:"responded_at"`

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// INTRODUCTORY OFFERS
// ==========================================

// IntroOffer - Başlangıç teklifi
type IntroOffer struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	// Offer details
	OfferType   string  `gorm:"not null" json:"offer_type"`   // "3_day_challenge", "first_month_discount"
	Price       float64 `gorm:"not null" json:"price"`        // $0.99, $1.99, etc.
	OriginalPrice float64 `gorm:"not null" json:"original_price"`
	DiscountPercent int `gorm:"default:0" json:"discount_percent"`

	// Duration
	DurationDays int `gorm:"not null" json:"duration_days"`

	// Availability
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	StartsAt    *time.Time `json:"starts_at"`
	EndsAt      *time.Time `json:"ends_at"`

	CreatedAt time.Time `json:"created_at"`
}

// UserIntroOffer - Kullanıcının kullandığı teklif
type UserIntroOffer struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	OfferID   uuid.UUID `gorm:"type:uuid;not null" json:"offer_id"`

	// Redemption
	RedeemedAt    time.Time `json:"redeemed_at"`
	ExpiresAt     time.Time `json:"expires_at"`
	ConvertedToSubscription bool `gorm:"default:false" json:"converted_to_subscription"`
	ConvertedAt   *time.Time `json:"converted_at"`

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// AVATAR CUSTOMIZATION
// ==========================================

// AvatarItem - Avatar eşyası
type AvatarItem struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`

	// Item info
	Name        string `gorm:"not null" json:"name"`
	Description string `json:"description"`
	Category    string `gorm:"not null" json:"category"` // "head", "face", "accessory", "background"
	IconURL     string `json:"icon_url"`

	// Rarity
	Rarity      int `gorm:"default:1" json:"rarity"` // 1=common, 2=rare, 3=epic, 4=legendary

	// How to obtain
	GemCost     int  `gorm:"default:0" json:"gem_cost"`    // 0 = not purchasable
	IsPremium   bool `gorm:"default:false" json:"is_premium"`
	ChestOnly   bool `gorm:"default:false" json:"chest_only"` // Only from chests

	IsActive bool `gorm:"default:true" json:"is_active"`
}

// UserAvatarItem - Kullanıcının sahip olduğu eşyalar
type UserAvatarItem struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	AvatarItemID uuid.UUID `gorm:"type:uuid;not null" json:"avatar_item_id"`

	// Equipped status
	IsEquipped bool `gorm:"default:false" json:"is_equipped"`

	// How obtained
	ObtainedAt  time.Time `json:"obtained_at"`
	ObtainMethod string   `json:"obtain_method"` // "purchase", "chest", "achievement"
}
