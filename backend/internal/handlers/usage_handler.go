package handlers

import (
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UsageHandler struct {
	usageService *services.UsageService
}

func NewUsageHandler(usageService *services.UsageService) *UsageHandler {
	return &UsageHandler{
		usageService: usageService,
	}
}

func (h *UsageHandler) GetRemaining(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	remaining, isPremium, err := h.usageService.GetRemainingUses(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to get usage info"})
	}

	return c.JSON(fiber.Map{
		"error":          false,
		"remaining_uses": remaining,
		"is_premium":     isPremium,
		"daily_limit":    services.FreeDailyLimit,
	})
}
