package handlers

import (
	"net/http"
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GamificationHandler struct {
	gamificationService *services.GamificationService
}

func NewGamificationHandler(gamificationService *services.GamificationService) *GamificationHandler {
	return &GamificationHandler{
		gamificationService: gamificationService,
	}
}

// GetGamificationStats godoc
// @Summary Get user's gamification stats
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.UserGamification
// @Router /gamification/stats [get]
func (h *GamificationHandler) GetGamificationStats(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	stats, err := h.gamificationService.GetGamificationStats(userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get stats",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  stats,
	})
}

// GetAchievements godoc
// @Summary Get all achievements with user progress
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Success 200 {array} models.Achievement
// @Router /gamification/achievements [get]
func (h *GamificationHandler) GetAchievements(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	// Get all achievements
	var achievements []models.Achievement
	if err := h.gamificationService.GetDB().Where("is_active = ?", true).Order("sort_order").Find(&achievements).Error; err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get achievements",
		})
	}

	// Get user's earned achievements
	earned, _ := h.gamificationService.GetUserAchievements(userID)
	earnedMap := make(map[uuid.UUID]models.UserAchievement)
	for _, e := range earned {
		earnedMap[e.AchievementID] = e
	}

	// Combine data
	type AchievementResponse struct {
		models.Achievement
		Earned   bool      `json:"earned"`
		EarnedAt *string   `json:"earned_at,omitempty"`
	}

	response := make([]AchievementResponse, len(achievements))
	for i, a := range achievements {
		earned := false
		if e, ok := earnedMap[a.ID]; ok && !e.EarnedAt.IsZero() {
			earned = true
		}
		response[i] = AchievementResponse{
			Achievement: a,
			Earned:      earned,
		}
		if e, ok := earnedMap[a.ID]; ok {
			t := e.EarnedAt.Format(time.RFC3339)
			response[i].EarnedAt = &t
		}
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  response,
	})
}

// GetDailyChallenge godoc
// @Summary Get today's challenge
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.UserDailyChallenge
// @Router /gamification/challenge/daily [get]
func (h *GamificationHandler) GetDailyChallenge(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	challenge, err := h.gamificationService.GetTodayChallenge(userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get challenge",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  challenge,
	})
}

// ClaimChallengeReward godoc
// @Summary Claim daily challenge reward
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Success 200 {object} fiber.Map
// @Router /gamification/challenge/claim [post]
func (h *GamificationHandler) ClaimChallengeReward(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	challenge, err := h.gamificationService.GetTodayChallenge(userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get challenge",
		})
	}

	if !challenge.Completed || challenge.ClaimedAt != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Challenge not completed or already claimed",
		})
	}

	now := time.Now()
	challenge.ClaimedAt = &now
	h.gamificationService.GetDB().Save(challenge)

	return c.JSON(fiber.Map{
		"error": false,
		"data": fiber.Map{
			"xp_earned": challenge.DailyChallenge.XPReward,
		},
	})
}

// GetLeaderboard godoc
// @Summary Get leaderboard
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Param period query string false "daily, weekly, monthly, all_time" default(all_time)
// @Param limit query int false "Limit results" default(100)
// @Success 200 {array} models.LeaderboardEntry
// @Router /gamification/leaderboard [get]
func (h *GamificationHandler) GetLeaderboard(c *fiber.Ctx) error {
	period := c.Query("period", "all_time")
	limit := c.QueryInt("limit", 100)

	if limit > 100 {
		limit = 100
	}

	entries, err := h.gamificationService.GetLeaderboard(period, limit)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get leaderboard",
		})
	}

	userID := c.Locals("userID").(uuid.UUID)
	userRank, _ := h.gamificationService.GetUserRank(userID, period)

	return c.JSON(fiber.Map{
		"error": false,
		"data": fiber.Map{
			"leaderboard": entries,
			"my_rank":     userRank,
		},
	})
}

// GetNotifications godoc
// @Summary Get unread notifications
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Success 200 {array} models.Notification
// @Router /gamification/notifications [get]
func (h *GamificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	notifications, err := h.gamificationService.GetUnreadNotifications(userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to get notifications",
		})
	}

	return c.JSON(fiber.Map{
		"error": false,
		"data":  notifications,
	})
}

// MarkNotificationRead godoc
// @Summary Mark notification as read
// @Tags gamification
// @Security BearerAuth
// @Param id path string true "Notification ID"
// @Success 200 {object} fiber.Map
// @Router /gamification/notifications/{id}/read [post]
func (h *GamificationHandler) MarkNotificationRead(c *fiber.Ctx) error {
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{
			"error":   true,
			"message": "Invalid notification ID",
		})
	}

	if err := h.gamificationService.MarkNotificationRead(notificationID); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{
			"error":   true,
			"message": "Failed to mark as read",
		})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Marked as read",
	})
}

// GetXPHistory godoc
// @Summary Get XP transaction history
// @Tags gamification
// @Security BearerAuth
// @Produce json
// @Param limit query int false "Limit results" default(50)
// @Success 200 {array} models.XPTransaction
// @Router /gamification/xp/history [get]
func (h *GamificationHandler) GetXPHistory(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	limit := c.QueryInt("limit", 50)

	var transactions []models.XPTransaction
	h.gamificationService.GetDB().Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&transactions)

	return c.JSON(fiber.Map{
		"error": false,
		"data":  transactions,
	})
}
