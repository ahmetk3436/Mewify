package handlers

import (
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MonetizationHandler struct {
	monetizationService *services.MonetizationService
	gamificationService *services.GamificationService
}

func NewMonetizationHandler(monetizationService *services.MonetizationService, gamificationService *services.GamificationService) *MonetizationHandler {
	return &MonetizationHandler{
		monetizationService: monetizationService,
		gamificationService: gamificationService,
	}
}

// ==========================================
// CURRENCY & GEMS
// ==========================================

// GetCurrency godoc
// @Summary Get user's currency balance
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.UserCurrency
// @Router /monetization/currency [get]
func (h *MonetizationHandler) GetCurrency(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	currency, err := h.monetizationService.GetUserCurrency(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get currency",
		})
	}

	// Check if premium
	isPremium := c.Locals("isPremium") == true
	if isPremium {
		currency.StreakFreezesAvailable = -1 // Unlimited
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  currency,
	})
}

// GetGemHistory godoc
// @Summary Get gem transaction history
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Param limit query int false "Limit" default(50)
// @Router /monetization/gems/history [get]
func (h *MonetizationHandler) GetGemHistory(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	limit := c.QueryInt("limit", 50)

	var transactions []models.GemTransaction
	if err := h.monetizationService.GetDB().
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&transactions).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get history",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  transactions,
	})
}

// ==========================================
// STREAK FREEZE
// ==========================================

// CanUseStreakFreeze godoc
// @Summary Check if user can use streak freeze
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/streak-freeze/check [get]
func (h *MonetizationHandler) CanUseStreakFreeze(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	isPremium := c.Locals("isPremium") == true

	canUse, method, err := h.monetizationService.CanUseStreakFreeze(userID, isPremium)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to check streak freeze",
		})
	}

	return c.JSON(fiber.Map{
		"error":        false,
		"can_use":      canUse,
		"method":       method,
		"gem_cost":     50,
		"is_premium":   isPremium,
	})
}

// UseStreakFreeze godoc
// @Summary Use streak freeze to protect streak
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/streak-freeze/use [post]
func (h *MonetizationHandler) UseStreakFreeze(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	isPremium := c.Locals("isPremium") == true

	if err := h.monetizationService.UseStreakFreeze(userID, isPremium); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Streak freeze activated! Your streak is safe.",
	})
}

// ==========================================
// DAILY CHESTS
// ==========================================

// OpenDailyChest godoc
// @Summary Open daily chest for rewards
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/chest/open [post]
func (h *MonetizationHandler) OpenDailyChest(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	isPremium := c.Locals("isPremium") == true

	// Get current streak
	gami, _ := h.gamificationService.GetGamificationStats(userID)
	currentStreak := 0
	if gami != nil {
		currentStreak = gami.CurrentStreak
	}

	chest, err := h.monetizationService.OpenDailyChest(userID, currentStreak, isPremium)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to open chest",
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Chest opened!",
		"data": fiber.Map{
			"chest":   chest,
			"rewards": chest.Rewards,
		},
	})
}

// CheckDailyChestStatus godoc
// @Summary Check if daily chest is available
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/chest/status [get]
func (h *MonetizationHandler) CheckDailyChestStatus(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	today := time.Now().Truncate(24 * time.Hour)
	var chest models.UserChest
	err := h.monetizationService.GetDB().
		Where("user_id = ? AND chest_type = ? AND opened_at >= ?", userID, models.ChestDaily, today).
		First(&chest).Error

	available := err != nil // If no chest found, available = true

	return c.JSON(fiber.Map{
		"error":     false,
		"available": available,
		"opened":    !available,
	})
}

// ==========================================
// PROGRESS DECAY
// ==========================================

// GetDecayStatus godoc
// @Summary Get user's decay status
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/decay/status [get]
func (h *MonetizationHandler) GetDecayStatus(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	status, err := h.monetizationService.CheckDecayStatus(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to check decay status",
		})
	}

	message := h.monetizationService.GetDecayMessage(status.DecayLevel)

	return c.JSON(fiber.Map{
		"error":       false,
		"data":        status,
		"message":     message,
		"days_since":  int(time.Since(status.LastActiveAt).Hours() / 24),
	})
}

// ==========================================
// ACCOUNTABILITY PARTNERS
// ==========================================

// SendFriendRequest godoc
// @Summary Send friend request
// @Tags monetization
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body object true "Friend request"
// @Router /monetization/friends/request [post]
func (h *MonetizationHandler) SendFriendRequest(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	var req struct {
		ReceiverID string `json:"receiver_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid request",
		})
	}

	receiverID, err := uuid.Parse(req.ReceiverID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid receiver ID",
		})
	}

	if err := h.monetizationService.SendFriendRequest(userID, receiverID); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Friend request sent!",
	})
}

// AcceptFriendRequest godoc
// @Summary Accept friend request
// @Tags monetization
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body object true "Accept request"
// @Router /monetization/friends/accept [post]
func (h *MonetizationHandler) AcceptFriendRequest(c *fiber.Ctx) error {
	var req struct {
		ConnectionID string `json:"connection_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid request",
		})
	}

	connectionID, err := uuid.Parse(req.ConnectionID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid connection ID",
		})
	}

	if err := h.monetizationService.AcceptFriendRequest(connectionID); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Friend request accepted!",
	})
}

// GetFriends godoc
// @Summary Get user's friends
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/friends [get]
func (h *MonetizationHandler) GetFriends(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	friends, err := h.monetizationService.GetFriends(userID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get friends",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  friends,
	})
}

// SendNudge godoc
// @Summary Send nudge to friend
// @Tags monetization
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body object true "Nudge request"
// @Router /monetization/friends/nudge [post]
func (h *MonetizationHandler) SendNudge(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	var req struct {
		FriendID  string `json:"friend_id"`
		NudgeType string `json:"nudge_type"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid request",
		})
	}

	friendID, err := uuid.Parse(req.FriendID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid friend ID",
		})
	}

	if err := h.monetizationService.SendNudge(userID, friendID, req.NudgeType); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Nudge sent!",
	})
}

// GetFriendsLeaderboard godoc
// @Summary Get friends leaderboard
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/friends/leaderboard [get]
func (h *MonetizationHandler) GetFriendsLeaderboard(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	limit := c.QueryInt("limit", 10)

	leaderboard, err := h.monetizationService.GetFriendsLeaderboard(userID, limit)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get leaderboard",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  leaderboard,
	})
}

// ==========================================
// INTRO OFFERS
// ==========================================

// GetIntroOffers godoc
// @Summary Get active intro offers
// @Tags monetization
// @Security BearerAuth
// @Produce json
// @Router /monetization/offers [get]
func (h *MonetizationHandler) GetIntroOffers(c *fiber.Ctx) error {
	offers, err := h.monetizationService.GetActiveIntroOffers()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get offers",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  offers,
	})
}

// RedeemIntroOffer godoc
// @Summary Redeem an intro offer
// @Tags monetization
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body object true "Redeem request"
// @Router /monetization/offers/redeem [post]
func (h *MonetizationHandler) RedeemIntroOffer(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	var req struct {
		OfferID string `json:"offer_id"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid request",
		})
	}

	offerID, err := uuid.Parse(req.OfferID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid offer ID",
		})
	}

	userOffer, err := h.monetizationService.RedeemIntroOffer(userID, offerID)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   true,
			"message": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Offer redeemed!",
		"data":    userOffer,
	})
}

