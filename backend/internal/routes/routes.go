package routes

import (
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/handlers"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
)

func Setup(
	app *fiber.App,
	cfg *config.Config,
	authHandler *handlers.AuthHandler,
	healthHandler *handlers.HealthHandler,
	webhookHandler *handlers.WebhookHandler,
	moderationHandler *handlers.ModerationHandler,
	faceAnalysisHandler *handlers.FaceAnalysisHandler,
	mewingHandler *handlers.MewingHandler,
	glowPlanHandler *handlers.GlowPlanHandler,
	aiAnalysisHandler *handlers.AiAnalysisHandler,
	usageHandler *handlers.UsageHandler,
	legalHandler *handlers.LegalHandler,
) {
	api := app.Group("/api")

	// Health
	api.Get("/health", healthHandler.Check)

	// Legal pages (public, required for App Store)
	api.Get("/privacy-policy", legalHandler.PrivacyPolicy)
	api.Get("/terms", legalHandler.TermsOfService)

	// Auth (public)
	auth := api.Group("/auth")
	auth.Post("/register", authHandler.Register)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.Refresh)
	auth.Post("/apple", authHandler.AppleSignIn) // Sign in with Apple (Guideline 4.8)

	// Auth (protected)
	protected := api.Group("", middleware.JWTProtected(cfg))
	protected.Post("/auth/logout", authHandler.Logout)
	protected.Delete("/auth/account", authHandler.DeleteAccount) // Account deletion (Guideline 5.1.1)

	// Moderation - User endpoints (protected)
	protected.Post("/reports", moderationHandler.CreateReport)     // Report content (Guideline 1.2)
	protected.Post("/blocks", moderationHandler.BlockUser)         // Block user (Guideline 1.2)
	protected.Delete("/blocks/:id", moderationHandler.UnblockUser) // Unblock user

	// Face Analysis (protected)
	protected.Post("/analyses", faceAnalysisHandler.Create)
	protected.Get("/analyses", faceAnalysisHandler.List)
	protected.Get("/analyses/latest", faceAnalysisHandler.GetLatest)
	protected.Get("/analyses/stats", faceAnalysisHandler.GetStats)
	protected.Get("/analyses/:id", faceAnalysisHandler.GetByID)
	protected.Delete("/analyses/:id", faceAnalysisHandler.Delete)

	// AI Face Analysis (protected)
	protected.Post("/analyses/ai", aiAnalysisHandler.AnalyzeFace)

	// Usage tracking (protected)
	protected.Get("/usage/remaining", usageHandler.GetRemaining)

	// Mewing Progress (protected)
	mewing := protected.Group("/mewing")
	mewing.Post("/log", mewingHandler.Log)
	mewing.Get("/today", mewingHandler.GetToday)
	mewing.Get("/history", mewingHandler.GetHistory)
	mewing.Get("/streaks", mewingHandler.GetStreaks)
	mewing.Put("/goal", mewingHandler.UpdateGoal)
	mewing.Get("/goal", mewingHandler.GetGoal)

	// Glow Plan (protected)
	glowPlan := protected.Group("/glow-plan")
	glowPlan.Get("", glowPlanHandler.List)
	glowPlan.Post("/generate", glowPlanHandler.Generate)
	glowPlan.Get("/progress", glowPlanHandler.GetProgress)
	glowPlan.Put("/:id/complete", glowPlanHandler.MarkComplete)

	// Admin moderation panel (protected + admin check)
	admin := api.Group("/admin", middleware.JWTProtected(cfg), middleware.AdminOnly(cfg))
	admin.Get("/moderation/reports", moderationHandler.ListReports)
	admin.Put("/moderation/reports/:id", moderationHandler.ActionReport)

	// Webhooks (verified by auth header, not JWT)
	webhooks := api.Group("/webhooks")
	webhooks.Post("/revenuecat", webhookHandler.HandleRevenueCat)
}
