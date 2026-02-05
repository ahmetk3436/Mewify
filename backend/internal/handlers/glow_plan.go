package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
)

type GlowPlanHandler struct {
	service *services.GlowPlanService
}

func NewGlowPlanHandler(service *services.GlowPlanService) *GlowPlanHandler {
	return &GlowPlanHandler{service: service}
}

func (h *GlowPlanHandler) List(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	plans, err := h.service.GetUserGlowPlans(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to retrieve glow plans"})
	}

	var planDTOs []dto.GlowPlanResponse
	for _, plan := range plans {
		planDTOs = append(planDTOs, dto.GlowPlanResponse{
			ID:             plan.ID,
			UserID:         plan.UserID,
			AnalysisID:     plan.AnalysisID,
			Category:       plan.Category,
			Title:          plan.Title,
			Description:    plan.Description,
			Priority:       plan.Priority,
			Difficulty:     plan.Difficulty,
			TimeframeWeeks: plan.TimeframeWeeks,
			IsCompleted:    plan.IsCompleted,
			CompletedAt:    plan.CompletedAt,
			CreatedAt:      plan.CreatedAt,
			UpdatedAt:      plan.UpdatedAt,
		})
	}

	response := dto.GlowPlanListResponse{
		Plans:      planDTOs,
		TotalCount: len(planDTOs),
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": response})
}

func (h *GlowPlanHandler) Generate(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	var req dto.GenerateGlowPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	plans, err := h.service.GenerateGlowPlan(userID, req.AnalysisID)
	if err != nil {
		if err.Error() == "analysis not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": true, "message": "Analysis not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to generate glow plan"})
	}

	var planDTOs []dto.GlowPlanResponse
	for _, plan := range plans {
		planDTOs = append(planDTOs, dto.GlowPlanResponse{
			ID:             plan.ID,
			UserID:         plan.UserID,
			AnalysisID:     plan.AnalysisID,
			Category:       plan.Category,
			Title:          plan.Title,
			Description:    plan.Description,
			Priority:       plan.Priority,
			Difficulty:     plan.Difficulty,
			TimeframeWeeks: plan.TimeframeWeeks,
			IsCompleted:    plan.IsCompleted,
			CompletedAt:    plan.CompletedAt,
			CreatedAt:      plan.CreatedAt,
			UpdatedAt:      plan.UpdatedAt,
		})
	}

	response := dto.GlowPlanListResponse{
		Plans:      planDTOs,
		TotalCount: len(planDTOs),
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"error": false, "data": response})
}

func (h *GlowPlanHandler) MarkComplete(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	planIDStr := c.Params("id")
	planID, err := uuid.Parse(planIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid plan ID"})
	}

	var req dto.CompleteGlowPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	plan, err := h.service.MarkAsCompleted(planID, userID, req.IsCompleted)
	if err != nil {
		if err.Error() == "plan not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": true, "message": "Plan not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to update plan"})
	}

	response := dto.GlowPlanResponse{
		ID:             plan.ID,
		UserID:         plan.UserID,
		AnalysisID:     plan.AnalysisID,
		Category:       plan.Category,
		Title:          plan.Title,
		Description:    plan.Description,
		Priority:       plan.Priority,
		Difficulty:     plan.Difficulty,
		TimeframeWeeks: plan.TimeframeWeeks,
		IsCompleted:    plan.IsCompleted,
		CompletedAt:    plan.CompletedAt,
		CreatedAt:      plan.CreatedAt,
		UpdatedAt:      plan.UpdatedAt,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": response})
}

func (h *GlowPlanHandler) GetProgress(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	total, completed, err := h.service.GetUserProgress(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to retrieve progress"})
	}

	progressPercentage := 0
	if total > 0 {
		progressPercentage = int((float64(completed) / float64(total)) * 100)
	}

	response := dto.ProgressResponse{
		TotalPlans:         total,
		CompletedPlans:     completed,
		ProgressPercentage: progressPercentage,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": response})
}
