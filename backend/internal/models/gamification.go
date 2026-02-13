package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserGamification - Kullanıcının oyun verileri
type UserGamification struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"user_id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// XP & Leveling
	TotalXP       int `gorm:"default:0" json:"total_xp"`
	CurrentLevel  int `gorm:"default:1" json:"current_level"`
	XPToNextLevel int `gorm:"default:200" json:"xp_to_next_level"`

	// Streak System
	CurrentStreak  int       `gorm:"default:0" json:"current_streak"`
	LongestStreak  int       `gorm:"default:0" json:"longest_streak"`
	LastActivityAt time.Time  `json:"last_activity_at"`
	StreakFreezes int       `gorm:"default:3" json:"streak_freezes"` // Satın alınabilir
	StreakShieldUntil *time.Time `json:"streak_shield_until"` // Premium koruma

	// Stats
	TotalScans        int `gorm:"default:0" json:"total_scans"`
	TotalMewingMinutes int `gorm:"default:0" json:"total_mewing_minutes"`
	BestScore         float64 `gorm:"default:0" json:"best_score"`
	AverageScore      float64 `gorm:"default:0" json:"average_score"`

	// Social
	GlobalRank    int  `gorm:"default:0" json:"global_rank"`
	WeeklyRank    int  `gorm:"default:0" json:"weekly_rank"`
	FriendsCount  int  `gorm:"default:0" json:"friends_count"`
	ReferralCount int  `gorm:"default:0" json:"referral_count"`

	// Achievements earned count
	AchievementsEarned int `gorm:"default:0" json:"achievements_earned"`
}

// Achievement - Başarım tanımları
type Achievement struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt   time.Time `json:"created_at"`

	// Identification
	Code        string `gorm:"uniqueIndex;not null" json:"code"` // "first_scan", "streak_7", etc.
	Name        string `gorm:"not null" json:"name"`
	Description string `gorm:"not null" json:"description"`
	Icon        string `gorm:"not null" json:"icon"` // Ionicons name
	Category    string `gorm:"not null" json:"category"` // "scans", "streak", "social", "special"

	// Requirements
	RequirementType  string `gorm:"not null" json:"requirement_type"` // "count", "streak", "score", "time"
	RequirementValue int    `gorm:"not null" json:"requirement_value"`

	// Rewards
	XPReward     int  `gorm:"default:0" json:"xp_reward"`
	IsSecret     bool `gorm:"default:false" json:"is_secret"` // Gizli başarımlar
	IsLegendary  bool `gorm:"default:false" json:"is_legendary"` // Efsanevi
	Rarity       int  `gorm:"default:1" json:"rarity"` // 1=common, 2=rare, 3=epic, 4=legendary

	// Display
	SortOrder    int    `gorm:"default:0" json:"sort_order"`
	IsActive     bool   `gorm:"default:true" json:"is_active"`
}

// UserAchievement - Kullanıcının kazandığı başarımlar
type UserAchievement struct {
	ID             uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	AchievementID  uuid.UUID `gorm:"type:uuid;not null;index" json:"achievement_id"`
	EarnedAt       time.Time `json:"earned_at"`
	Notified       bool      `gorm:"default:false" json:"notified"` // Push notification sent?

	Achievement    Achievement `gorm:"foreignKey:AchievementID" json:"achievement"`
}

// DailyChallenge - Günlük görevler
type DailyChallenge struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Date        time.Time `gorm:"type:date;not null;uniqueIndex" json:"date"`
	CreatedAt   time.Time `json:"created_at"`

	// Challenge definition
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"not null" json:"description"`
	Icon        string `gorm:"not null" json:"icon"`

	// Requirements
	ChallengeType  string `gorm:"not null" json:"challenge_type"` // "mewing_minutes", "scan", "streak"
	TargetValue    int    `gorm:"not null" json:"target_value"`

	// Rewards
	XPReward       int  `gorm:"default:50" json:"xp_reward"`
	BonusStreakDay bool `gorm:"default:false" json:"bonus_streak_day"` // +1 gün streak

	// Difficulty
	Difficulty     int `gorm:"default:1" json:"difficulty"` // 1=easy, 2=medium, 3=hard
}

// UserDailyChallenge - Kullanıcının günlük görev durumu
type UserDailyChallenge struct {
	ID              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID          uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	DailyChallengeID uuid.UUID `gorm:"type:uuid;not null;index" json:"daily_challenge_id"`
	CreatedAt       time.Time `json:"created_at"`

	// Progress
	CurrentValue int  `gorm:"default:0" json:"current_value"`
	Completed    bool `gorm:"default:false" json:"completed"`
	ClaimedAt    *time.Time `json:"claimed_at"` // Ödül alındı mı?

	DailyChallenge DailyChallenge `gorm:"foreignKey:DailyChallengeID" json:"daily_challenge"`
}

// WeeklyChallenge - Haftalık yarışmalar
type WeeklyChallenge struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	WeekStart   time.Time `gorm:"type:date;not null;uniqueIndex" json:"week_start"`
	CreatedAt   time.Time `json:"created_at"`

	// Challenge
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"not null" json:"description"`
	Icon        string `gorm:"not null" json:"icon"`

	// Type
	ChallengeType string `gorm:"not null" json:"challenge_type"` // "total_minutes", "total_scans", "streak"

	// Rewards (top 3)
	FirstPlaceXP  int `gorm:"default:500" json:"first_place_xp"`
	SecondPlaceXP int `gorm:"default:300" json:"second_place_xp"`
	ThirdPlaceXP  int `gorm:"default:200" json:"third_place_xp"`
}

// LeaderboardEntry - Sıralama tablosu
type LeaderboardEntry struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Period    string    `gorm:"not null;index"` // "daily", "weekly", "monthly", "all_time"
	Score     int       `gorm:"not null;index" json:"score"`
	Rank      int       `gorm:"default:0" json:"rank"`
	UpdatedAt time.Time `json:"updated_at"`

	// Denormalized for quick access
	Username  string `gorm:"not null" json:"username"`
	AvatarURL string `json:"avatar_url"`
}

// XPTransaction - XP hareketleri (audit log)
type XPTransaction struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CreatedAt   time.Time `json:"created_at"`

	Amount      int    `gorm:"not null" json:"amount"` // positive = earned, negative = spent
	Reason      string `gorm:"not null" json:"reason"` // "scan", "mewing", "achievement", "challenge"
	ReferenceID string `json:"reference_id"` // Related entity ID

	Description string `json:"description"`
}

// Notification - Bildirimler
type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`

	Type      string `gorm:"not null" json:"type"` // "achievement", "challenge", "streak", "social"
	Title     string `gorm:"not null" json:"title"`
	Body      string `gorm:"not null" json:"body"`
	ImageURL  string `json:"image_url"`

	Read      bool      `gorm:"default:false" json:"read"`
	ReadAt    *time.Time `json:"read_at"`

	// Action
	ActionType string `json:"action_type"` // "open_screen", "claim_reward"
	ActionData string `json:"action_data"` // JSON data for action
}

// SocialConnection - Arkadaşlık sistemi
type SocialConnection struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	RequesterID uuid.UUID `gorm:"type:uuid;not null;index" json:"requester_id"`
	AddresseeID uuid.UUID `gorm:"type:uuid;not null;index" json:"addressee_id"`
	Status      string    `gorm:"not null;default:'pending'" json:"status"` // pending, accepted, rejected
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// FriendActivity - Arkadaş aktiviteleri (feed)
type FriendActivity struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID      uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CreatedAt   time.Time `json:"created_at"`

	ActivityType string `gorm:"not null" json:"activity_type"` // "scan", "achievement", "challenge", "streak"
	Title        string `gorm:"not null" json:"title"`
	Icon         string `gorm:"not null" json:"icon"`
	Metadata     string `gorm:"type:jsonb" json:"metadata"` // Additional data

	// Privacy
	IsPublic     bool `gorm:"default:true" json:"is_public"`
}

// Referral - Davet sistemi
type Referral struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ReferrerID   uuid.UUID `gorm:"type:uuid;not null;index" json:"referrer_id"`
	ReferredID   uuid.UUID `gorm:"type:uuid;not null;index" json:"referred_id"`
	Code         string    `gorm:"not null" json:"code"`
	CreatedAt    time.Time `json:"created_at"`
	RewardClaimed bool     `gorm:"default:false" json:"reward_claimed"`
}
