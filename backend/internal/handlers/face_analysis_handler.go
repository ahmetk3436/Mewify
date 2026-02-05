package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/services"
)

type FaceAnalysisHandler struct {
	service services.FaceAnalysisService
}

func NewFaceAnalysisHandler(service services.FaceAnalysisService) *FaceAnalysisHandler {
	return &FaceAnalysisHandler{
		service: service,
	}
}

func (h *FaceAnalysisHandler) Create(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	var req dto.CreateFaceAnalysisRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid request body"})
	}

	analysis, err := h.service.CreateAnalysis(userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to create analysis"})
	}

	response := dto.FaceAnalysisResponse{
		ID:             analysis.ID,
		UserID:         analysis.UserID,
		ImageURL:       analysis.ImageURL,
		OverallScore:   analysis.OverallScore,
		SymmetryScore:  analysis.SymmetryScore,
		JawlineScore:   analysis.JawlineScore,
		SkinScore:      analysis.SkinScore,
		EyeScore:       analysis.EyeScore,
		NoseScore:      analysis.NoseScore,
		LipsScore:      analysis.LipsScore,
		HarmonyScore:   analysis.HarmonyScore,
		Strengths:      analysis.Strengths,
		Improvements:   analysis.Improvements,
		AnalyzedAt:     analysis.AnalyzedAt,
		CreatedAt:      analysis.CreatedAt,
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"error": false, "data": response})
}

func (h *FaceAnalysisHandler) GetByID(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	idStr := c.Params("id")
	analysisID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid analysis ID"})
	}

	analysis, err := h.service.GetAnalysisByID(analysisID, userID)
	if err != nil {
		if err.Error() == "analysis not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": true, "message": "Analysis not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to retrieve analysis"})
	}

	response := dto.FaceAnalysisResponse{
		ID:             analysis.ID,
		UserID:         analysis.UserID,
		ImageURL:       analysis.ImageURL,
		OverallScore:   analysis.OverallScore,
		SymmetryScore:  analysis.SymmetryScore,
		JawlineScore:   analysis.JawlineScore,
		SkinScore:      analysis.SkinScore,
		EyeScore:       analysis.EyeScore,
		NoseScore:      analysis.NoseScore,
		LipsScore:      analysis.LipsScore,
		HarmonyScore:   analysis.HarmonyScore,
		Strengths:      analysis.Strengths,
		Improvements:   analysis.Improvements,
		AnalyzedAt:     analysis.AnalyzedAt,
		CreatedAt:      analysis.CreatedAt,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": response})
}

func (h *FaceAnalysisHandler) List(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	analyses, total, err := h.service.ListAnalyses(userID, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to retrieve analyses"})
	}

	responseList := make([]dto.FaceAnalysisResponse, len(analyses))
	for i, analysis := range analyses {
		responseList[i] = dto.FaceAnalysisResponse{
			ID:             analysis.ID,
			UserID:         analysis.UserID,
			ImageURL:       analysis.ImageURL,
			OverallScore:   analysis.OverallScore,
			SymmetryScore:  analysis.SymmetryScore,
			JawlineScore:   analysis.JawlineScore,
			SkinScore:      analysis.SkinScore,
			EyeScore:       analysis.EyeScore,
			NoseScore:      analysis.NoseScore,
			LipsScore:      analysis.LipsScore,
			HarmonyScore:   analysis.HarmonyScore,
			Strengths:      analysis.Strengths,
			Improvements:   analysis.Improvements,
			AnalyzedAt:     analysis.AnalyzedAt,
			CreatedAt:      analysis.CreatedAt,
		}
	}

	response := dto.PaginatedAnalysesResponse{
		Analyses: responseList,
		Total:    total,
		Page:     page,
		Limit:    limit,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": response})
}

func (h *FaceAnalysisHandler) Delete(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	idStr := c.Params("id")
	analysisID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": true, "message": "Invalid analysis ID"})
	}

	err = h.service.DeleteAnalysis(analysisID, userID)
	if err != nil {
		if err.Error() == "analysis not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": true, "message": "Analysis not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to delete analysis"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "message": "Analysis deleted successfully"})
}

func (h *FaceAnalysisHandler) GetLatest(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	analysis, err := h.service.GetLatestAnalysis(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to retrieve analysis"})
	}

	if analysis == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": true, "message": "No analysis found"})
	}

	response := dto.FaceAnalysisResponse{
		ID:             analysis.ID,
		UserID:         analysis.UserID,
		ImageURL:       analysis.ImageURL,
		OverallScore:   analysis.OverallScore,
		SymmetryScore:  analysis.SymmetryScore,
		JawlineScore:   analysis.JawlineScore,
		SkinScore:      analysis.SkinScore,
		EyeScore:       analysis.EyeScore,
		NoseScore:      analysis.NoseScore,
		LipsScore:      analysis.LipsScore,
		HarmonyScore:   analysis.HarmonyScore,
		Strengths:      analysis.Strengths,
		Improvements:   analysis.Improvements,
		AnalyzedAt:     analysis.AnalyzedAt,
		CreatedAt:      analysis.CreatedAt,
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": response})
}

func (h *FaceAnalysisHandler) GetStats(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": true, "message": "Invalid user ID"})
	}

	stats, err := h.service.GetAnalysisStats(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": true, "message": "Failed to retrieve stats"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"error": false, "data": stats})
}