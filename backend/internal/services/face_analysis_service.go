package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/dto"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
)

type FaceAnalysisService interface {
	CreateAnalysis(userID uuid.UUID, req dto.CreateFaceAnalysisRequest) (*models.FaceAnalysis, error)
	GetAnalysisByID(analysisID, userID uuid.UUID) (*models.FaceAnalysis, error)
	ListAnalyses(userID uuid.UUID, page, limit int) ([]models.FaceAnalysis, int64, error)
	DeleteAnalysis(analysisID, userID uuid.UUID) error
	GetLatestAnalysis(userID uuid.UUID) (*models.FaceAnalysis, error)
	GetAnalysisStats(userID uuid.UUID) (*dto.AnalysisStatsResponse, error)
}

type faceAnalysisService struct {
	db *gorm.DB
}

func NewFaceAnalysisService(db *gorm.DB) *faceAnalysisService {
	return &faceAnalysisService{
		db: db,
	}
}

func (s *faceAnalysisService) CreateAnalysis(userID uuid.UUID, req dto.CreateFaceAnalysisRequest) (*models.FaceAnalysis, error) {
	analysis := &models.FaceAnalysis{
		UserID:        userID,
		ImageURL:      req.ImageURL,
		OverallScore:  req.OverallScore,
		SymmetryScore: req.SymmetryScore,
		JawlineScore:  req.JawlineScore,
		SkinScore:     req.SkinScore,
		EyeScore:      req.EyeScore,
		NoseScore:     req.NoseScore,
		LipsScore:     req.LipsScore,
		HarmonyScore:  req.HarmonyScore,
		Strengths:     req.Strengths,
		Improvements:  req.Improvements,
		AnalyzedAt:    req.AnalyzedAt,
	}

	if analysis.AnalyzedAt.IsZero() {
		analysis.AnalyzedAt = time.Now()
	}

	if err := s.db.Create(analysis).Error; err != nil {
		return nil, err
	}

	return analysis, nil
}

func (s *faceAnalysisService) GetAnalysisByID(analysisID, userID uuid.UUID) (*models.FaceAnalysis, error) {
	var analysis models.FaceAnalysis

	err := s.db.Where("id = ? AND user_id = ?", analysisID, userID).
		First(&analysis).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("analysis not found")
		}
		return nil, err
	}

	return &analysis, nil
}

func (s *faceAnalysisService) ListAnalyses(userID uuid.UUID, page, limit int) ([]models.FaceAnalysis, int64, error) {
	var analyses []models.FaceAnalysis
	var total int64

	offset := (page - 1) * limit

	// Get total count
	if err := s.db.Model(&models.FaceAnalysis{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&analyses).Error

	if err != nil {
		return nil, 0, err
	}

	return analyses, total, nil
}

func (s *faceAnalysisService) DeleteAnalysis(analysisID, userID uuid.UUID) error {
	result := s.db.Where("id = ? AND user_id = ?", analysisID, userID).
		Delete(&models.FaceAnalysis{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return errors.New("analysis not found")
	}

	return nil
}

func (s *faceAnalysisService) GetLatestAnalysis(userID uuid.UUID) (*models.FaceAnalysis, error) {
	var analysis models.FaceAnalysis

	err := s.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		First(&analysis).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}

	return &analysis, nil
}

func (s *faceAnalysisService) GetAnalysisStats(userID uuid.UUID) (*dto.AnalysisStatsResponse, error) {
	var stats dto.AnalysisStatsResponse
	var monthlyData []struct {
		Month string
		Avg   float64
	}

	// Get average scores
	row := s.db.Model(&models.FaceAnalysis{}).
		Select(`
			COALESCE(AVG(overall_score), 0) as avg_overall,
			COALESCE(AVG(symmetry_score), 0) as avg_symmetry,
			COALESCE(AVG(jawline_score), 0) as avg_jawline,
			COALESCE(AVG(skin_score), 0) as avg_skin,
			COALESCE(AVG(eye_score), 0) as avg_eye,
			COALESCE(AVG(nose_score), 0) as avg_nose,
			COALESCE(AVG(lips_score), 0) as avg_lips,
			COALESCE(AVG(harmony_score), 0) as avg_harmony,
			COUNT(*) as total
		`).
		Where("user_id = ?", userID).
		Row()

	err := row.Scan(
		&stats.AverageOverall,
		&stats.AverageSymmetry,
		&stats.AverageJawline,
		&stats.AverageSkin,
		&stats.AverageEye,
		&stats.AverageNose,
		&stats.AverageLips,
		&stats.AverageHarmony,
		&stats.TotalAnalyses,
	)

	if err != nil {
		return nil, err
	}

	// Get monthly trend (last 6 months)
	err = s.db.Model(&models.FaceAnalysis{}).
		Select(`
			TO_CHAR(analyzed_at, 'YYYY-MM') as month,
			AVG(overall_score) as avg
		`).
		Where("user_id = ? AND analyzed_at >= NOW() - INTERVAL '6 months'", userID).
		Group("month").
		Order("month ASC").
		Find(&monthlyData).Error

	if err != nil {
		return nil, err
	}

	// Convert to response format
	stats.MonthlyTrend = make([]dto.MonthlyScore, len(monthlyData))
	for i, data := range monthlyData {
		stats.MonthlyTrend[i] = dto.MonthlyScore{
			Month: data.Month,
			Score: data.Avg,
		}
	}

	return &stats, nil
}
