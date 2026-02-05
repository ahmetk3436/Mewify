package handlers

import (
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// Register handles user registration
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	user, token, err := h.service.Register(req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to register user"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"error":   false,
		"message": "User registered successfully",
		"token":   token,
		"user":    user,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	user, token, err := h.service.Login(req.Email, req.Password)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid credentials"})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Login successful",
		"token":   token,
		"user":    user,
	})
}

// Refresh handles token refresh
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	// Implementation depends on specific refresh logic requirements
	return c.JSON(fiber.Map{"error": false, "message": "Token refresh endpoint"})
}

// AppleSignIn handles Sign in with Apple (Guideline 4.8)
func (h *AuthHandler) AppleSignIn(c *fiber.Ctx) error {
	var req dto.AppleSignInRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	if req.IdentityToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Identity token is required"})
	}

	user, token, err := h.service.AppleSignIn(req.IdentityToken)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to sign in with Apple"})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Apple sign in successful",
		"token":   token,
		"user":    user,
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Implementation for invalidating tokens on client side or server side blacklist
	return c.JSON(fiber.Map{"error": false, "message": "Logout successful"})
}

// DeleteAccount handles account deletion (Guideline 5.1.1)
func (h *AuthHandler) DeleteAccount(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	if err := h.service.DeleteAccount(userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to delete account"})
	}

	return c.JSON(fiber.Map{
		"error":   false,
		"message": "Account deleted successfully",
	})
}