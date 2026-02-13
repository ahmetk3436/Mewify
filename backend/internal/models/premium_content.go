package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ==========================================
// PREMIUM CONTENT & EXERCISES
// ==========================================

// ExerciseType - Egzersiz türleri
type ExerciseType string

const (
	ExerciseQuick     ExerciseType = "quick"     // 5 dakika
	ExerciseFocused   ExerciseType = "focused"   // 15 dakika
	ExerciseDeep      ExerciseType = "deep"      // 30 dakika
	ExerciseMarathon  ExerciseType = "marathon"  // 60 dakika
)

// TimeOfDay - Günün zamanı
type TimeOfDay string

const (
	Morning   TimeOfDay = "morning"
	Afternoon TimeOfDay = "afternoon"
	Evening   TimeOfDay = "evening"
	Night     TimeOfDay = "night"
)

// MewingExercise - Mewing egzersiz tanımı
type MewingExercise struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`

	// Temel bilgiler
	Name        string `gorm:"not null" json:"name"`
	Description string `gorm:"not null" json:"description"`
	Icon        string `gorm:"not null" json:"icon"` // Ionicons name
	VideoURL    string `json:"video_url"` // Premium video guide

	// Kategorizasyon
	Type        ExerciseType `gorm:"not null" json:"type"`
	TimeOfDay   TimeOfDay    `gorm:"not null" json:"time_of_day"`
	Difficulty  int          `gorm:"default:1" json:"difficulty"` // 1-5

	// Süre
	DurationSeconds int `gorm:"not null" json:"duration_seconds"`

	// Hedef bölgeler
	TargetAreas []string `gorm:"type:text[]" json:"target_areas"` // ["jawline", "chin", "cheekbones"]

	// Premium mu?
	IsPremium   bool `gorm:"default:false" json:"is_premium"`

	// Talimatlar (adım adım)
	Instructions []ExerciseInstruction `gorm:"foreignKey:ExerciseID" json:"instructions"`

	// İpuçları
	Tips []string `gorm:"type:text[]" json:"tips"`
}

// ExerciseInstruction - Adım adım talimat
type ExerciseInstruction struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	ExerciseID  uuid.UUID `gorm:"type:uuid;not null;index" json:"exercise_id"`
	StepNumber  int       `gorm:"not null" json:"step_number"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `gorm:"not null" json:"description"`
	DurationSec int       `json:"duration_sec"` // Bu adımın süresi
}

// DailyRoutine - Günlük rutin
type DailyRoutine struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Date      time.Time `gorm:"type:date;not null" json:"date"`

	// Morning routine
	MorningExercises []uuid.UUID `gorm:"type:uuid[]" json:"morning_exercises"`
	MorningMinutes   int         `gorm:"default:0" json:"morning_minutes"`

	// Evening routine
	EveningExercises []uuid.UUID `gorm:"type:uuid[]" json:"evening_exercises"`
	EveningMinutes   int         `gorm:"default:0" json:"evening_minutes"`

	// Completion tracking
	MorningCompleted   bool `gorm:"default:false" json:"morning_completed"`
	EveningCompleted   bool `gorm:"default:false" json:"evening_completed"`

	// AI-generated personalization
	GeneratedByAI     bool   `gorm:"default:false" json:"generated_by_ai"`
	PersonalNotes     string `json:"personal_notes"`
}

// WeeklyPlan - Haftalık plan (Premium)
type WeeklyPlan struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	WeekStart time.Time `gorm:"type:date;not null" json:"week_start"`

	// Hedefler
	WeeklyGoalMinutes int `gorm:"default:180" json:"weekly_goal_minutes"` // 3 saat
	WeeklyGoalSessions int `gorm:"default:14" json:"weekly_goal_sessions"` // Günde 2

	// Günlük hedefler
	MondayGoal    int `json:"monday_goal"`
	TuesdayGoal   int `json:"tuesday_goal"`
	WednesdayGoal int `json:"wednesday_goal"`
	ThursdayGoal  int `json:"thursday_goal"`
	FridayGoal    int `json:"friday_goal"`
	SaturdayGoal  int `json:"saturday_goal"`
	SundayGoal    int `json:"sunday_goal"`

	// Odak alanları (scan sonuçlarına göre)
	FocusAreas []string `gorm:"type:text[]" json:"focus_areas"`

	// AI generated
	GeneratedByAI bool `gorm:"default:false" json:"generated_by_ai"`
	AIInsights    string `json:"ai_insights"` // Neden bu plan?
}

// PersonalizedTip - Kişiselleştirilmiş ipucu
type PersonalizedTip struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CreatedAt time.Time `json:"created_at"`

	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`

	// İpucu içeriği
	Title       string `gorm:"not null" json:"title"`
	Description string `gorm:"not null" json:"description"`
	Icon        string `gorm:"not null" json:"icon"`

	// Kategorizasyon
	Category    string `gorm:"not null" json:"category"` // "technique", "motivation", "nutrition", "lifestyle"
	Priority    int    `gorm:"default:1" json:"priority"` // 1-5

	// Kişiselleştirme nedeni
	BasedOn     string `json:"based_on"` // "low_jawline_score", "streak_break_risk", etc.

	// Zamanlama
	ShowAt      TimeOfDay `json:"show_at"` // En iyi ne zaman gösterilsin
	IsActive    bool      `gorm:"default:true" json:"is_active"`

	// Premium mu?
	IsPremium   bool `gorm:"default:false" json:"is_premium"`
}

// TechniqueCorrection - Teknik düzeltme önerisi
type TechniqueCorrection struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	CreatedAt time.Time `json:"created_at"`

	// Sorun
	Issue       string `gorm:"not null" json:"issue"` // "tongue_position", "breathing", "posture"
	Severity    int    `gorm:"default:1" json:"severity"` // 1-3

	// Düzeltme
	Correction  string `gorm:"not null" json:"correction"`
	ExerciseID  uuid.UUID `json:"exercise_id"` // Önerilen egzersiz

	// Progress
	IsResolved  bool      `gorm:"default:false" json:"is_resolved"`
	ResolvedAt  *time.Time `json:"resolved_at"`
}

// PremiumFeature - Premium özellik tanımı
type PremiumFeature struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Code        string    `gorm:"uniqueIndex;not null" json:"code"` // "unlimited_scans", "ai_coaching"
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"not null" json:"description"`
	Icon        string    `gorm:"not null" json:"icon"`

	// Tier requirement
	MinTier     int `gorm:"default:1" json:"min_tier"` // 1=Premium, 2=VIP

	// Display
	SortOrder   int  `gorm:"default:0" json:"sort_order"`
	IsActive    bool `gorm:"default:true" json:"is_active"`
}

// SubscriptionTier - Abonelik seviyesi
type SubscriptionTier struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Code        string    `gorm:"uniqueIndex;not null" json:"code"` // "free", "premium", "vip"
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"not null" json:"description"`

	// Fiyatlandırma
	MonthlyPrice  float64 `json:"monthly_price"`
	YearlyPrice   float64 `json:"yearly_price"`
	YearlyDiscount int    `json:"yearly_discount"` // Yüzde indirim

	// Özellikler
	Features []PremiumFeature `gorm:"many2many:tier_features;" json:"features"`

	// Limitler
	DailyScanLimit     int `json:"daily_scan_limit"` // -1 = unlimited
	DailySessionLimit  int `json:"daily_session_limit"`
	StreakFreezeLimit  int `json:"streak_freeze_limit"`

	// Özel içerik
	HasAICoaching      bool `json:"has_ai_coaching"`
	HasPersonalizedPlan bool `json:"has_personalized_plan"`
	HasVideoGuides     bool `json:"has_video_guides"`
	HasPrioritySupport bool `json:"has_priority_support"`
	HasNoAds           bool `json:"has_no_ads"`

	SortOrder int  `gorm:"default:0" json:"sort_order"`
	IsActive  bool `gorm:"default:true" json:"is_active"`
}

// UserSubscription - Kullanıcı aboneliği
type UserSubscription struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	TierID    uuid.UUID `gorm:"type:uuid;not null" json:"tier_id"`

	StartDate  time.Time `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`

	// Auto-renewal
	AutoRenew bool `gorm:"default:true" json:"auto_renew"`

	// RevenueCat integration
	RevenueCatID     string `json:"revenue_cat_id"`
	ProductID        string `json:"product_id"` // "monthly_premium", "yearly_premium"
	OriginalTransactionID string `json:"original_transaction_id"`

	// Status
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	CanceledAt  *time.Time `json:"canceled_at"`

	// Relations
	Tier       SubscriptionTier `gorm:"foreignKey:TierID" json:"tier"`

	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}
