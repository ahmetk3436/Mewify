package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
)

type AiAnalysisHandler struct {
	service *services.AiAnalysisService
}

func NewAiAnalysisHandler(service *services.AiAnalysisService) *AiAnalysisHandler {
	return &AiAnalysisHandler{
		service: service,
	}
}

type aiAnalyzeRequest struct {
	ImageBase64 string `json:"image_base64"`
}

func (h *AiAnalysisHandler) AnalyzeFace(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	var req aiAnalyzeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	if req.ImageBase64 == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "image_base64 is required"})
	}

	analysis, err := h.service.AnalyzeImage(userID, req.ImageBase64)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to analyze image: " + err.Error()})
	}

	response := dto.FaceAnalysisResponse{
		ID:            analysis.ID,
		UserID:        analysis.UserID,
		ImageURL:      analysis.ImageURL,
		OverallScore:  analysis.OverallScore,
		SymmetryScore: analysis.SymmetryScore,
		JawlineScore:  analysis.JawlineScore,
		SkinScore:     analysis.SkinScore,
		EyeScore:      analysis.EyeScore,
		NoseScore:     analysis.NoseScore,
		LipsScore:     analysis.LipsScore,
		HarmonyScore:  analysis.HarmonyScore,
		Strengths:     analysis.Strengths,
		Improvements:  analysis.Improvements,
		AnalyzedAt:    analysis.AnalyzedAt,
		CreatedAt:     analysis.CreatedAt,
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"error": false, "data": response})
}
