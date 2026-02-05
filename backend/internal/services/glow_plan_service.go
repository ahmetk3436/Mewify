package services

import (
	"errors"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
)

type GlowPlanService struct {
	db *gorm.DB
}

func NewGlowPlanService(db *gorm.DB) *GlowPlanService {
	return &GlowPlanService{db: db}
}

func (s *GlowPlanService) GetUserGlowPlans(userID uuid.UUID) ([]models.GlowPlan, error) {
	var plans []models.GlowPlan
	err := s.db.Where("user_id = ?", userID).
		Order("priority DESC, created_at DESC").
		Find(&plans).Error
	return plans, err
}

func (s *GlowPlanService) GenerateGlowPlan(userID, analysisID uuid.UUID) ([]models.GlowPlan, error) {
	// Get the analysis to check it exists and belongs to user
	var analysis models.FaceAnalysis
	if err := s.db.Where("id = ? AND user_id = ?", analysisID, userID).First(&analysis).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("analysis not found")
		}
		return nil, err
	}

	// Delete existing plans for this user (regenerate)
	s.db.Where("user_id = ?", userID).Delete(&models.GlowPlan{})

	// Generate mock recommendations based on lowest scoring areas
	recommendations := s.generateMockRecommendations(userID, analysisID, &analysis)

	// Save to database
	var createdPlans []models.GlowPlan
	for _, rec := range recommendations {
		if err := s.db.Create(&rec).Error; err != nil {
			return nil, err
		}
		createdPlans = append(createdPlans, rec)
	}

	return createdPlans, nil
}

func (s *GlowPlanService) MarkAsCompleted(planID, userID uuid.UUID, isCompleted bool) (*models.GlowPlan, error) {
	var plan models.GlowPlan
	if err := s.db.Where("id = ? AND user_id = ?", planID, userID).First(&plan).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("plan not found")
		}
		return nil, err
	}

	plan.IsCompleted = isCompleted
	if isCompleted {
		now := time.Now()
		plan.CompletedAt = &now
	} else {
		plan.CompletedAt = nil
	}

	if err := s.db.Save(&plan).Error; err != nil {
		return nil, err
	}

	return &plan, nil
}

func (s *GlowPlanService) GetUserProgress(userID uuid.UUID) (int, int, error) {
	var total int64
	var completed int64

	if err := s.db.Model(&models.GlowPlan{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return 0, 0, err
	}

	if err := s.db.Model(&models.GlowPlan{}).Where("user_id = ? AND is_completed = ?", userID, true).Count(&completed).Error; err != nil {
		return 0, 0, err
	}

	return int(total), int(completed), nil
}

// Private helper methods
func (s *GlowPlanService) generateMockRecommendations(userID, analysisID uuid.UUID, analysis *models.FaceAnalysis) []models.GlowPlan {
	// Score map for prioritization
	scores := map[string]float64{
		"jawline":  analysis.JawlineScore,
		"skin":     analysis.SkinScore,
		"style":    (analysis.OverallScore + analysis.HarmonyScore) / 2,
		"fitness":  analysis.JawlineScore,
		"grooming": (analysis.SkinScore + analysis.OverallScore) / 2,
	}

	// Sort categories by score (lowest first = higher priority)
	type catScore struct {
		cat   string
		score float64
	}
	var sorted []catScore
	for cat, score := range scores {
		sorted = append(sorted, catScore{cat, score})
	}
	// Simple bubble sort
	for i := 0; i < len(sorted); i++ {
		for j := i + 1; j < len(sorted); j++ {
			if sorted[j].score < sorted[i].score {
				sorted[i], sorted[j] = sorted[j], sorted[i]
			}
		}
	}

	// Generate 5-8 recommendations
	rand.Seed(time.Now().UnixNano())
	numRecs := 5 + rand.Intn(4)

	var recommendations []models.GlowPlan
	for i := 0; i < numRecs; i++ {
		cat := sorted[i%len(sorted)].cat
		priority := 5 - (i % 5) // Higher priority for lower scoring areas

		plan := models.GlowPlan{
			UserID:         userID,
			AnalysisID:     analysisID,
			Category:       cat,
			Title:          s.getMockTitle(cat),
			Description:    s.getMockDescription(cat),
			Priority:       priority,
			Difficulty:     s.getRandomDifficulty(),
			TimeframeWeeks: 2 + rand.Intn(6),
			IsCompleted:    false,
		}
		recommendations = append(recommendations, plan)
	}

	return recommendations
}

func (s *GlowPlanService) getMockTitle(category string) string {
	titles := map[string][]string{
		"jawline": {
			"Improve Jaw Definition",
			"Enhance Jawline Structure",
			"Define Your Jawline",
		},
		"skin": {
			"Clear Skin Routine",
			"Brighten Skin Tone",
			"Reduce Skin Imperfections",
		},
		"style": {
			"Update Your Wardrobe",
			"Find Your Personal Style",
			"Enhance Your Look",
		},
		"fitness": {
			"Full Body Workout Plan",
			"Strength Training Routine",
			"Cardio Improvement Plan",
		},
		"grooming": {
			"Daily Grooming Routine",
			"Hair Care Improvement",
			"Personal Grooming Enhancement",
		},
	}
	list := titles[category]
	if len(list) == 0 {
		return "Improvement Plan"
	}
	return list[rand.Intn(len(list))]
}

func (s *GlowPlanService) getMockDescription(category string) string {
	descriptions := map[string]string{
		"jawline":  "Follow a specific facial exercise routine and maintain proper posture to enhance jawline definition over time.",
		"skin":     "Implement a consistent skincare routine with cleansing, exfoliation, and moisturizing to improve skin health and appearance.",
		"style":    "Update your wardrobe with well-fitting clothes that complement your body type and personal aesthetic.",
		"fitness":  "Engage in regular strength training and cardiovascular exercise to improve overall physique and muscle tone.",
		"grooming": "Establish a daily grooming routine including hair care, skincare, and personal hygiene for a polished appearance.",
	}
	if desc, ok := descriptions[category]; ok {
		return desc
	}
	return "Follow a personalized improvement plan for better results."
}

func (s *GlowPlanService) getRandomDifficulty() string {
	difficulties := []string{"easy", "medium", "hard"}
	return difficulties[rand.Intn(len(difficulties))]
}
