package config

import (
	"os"
	"time"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret        string
	JWTAccessExpiry  time.Duration
	JWTRefreshExpiry time.Duration

	AppleClientIDs string

	AdminEmails  string
	AdminUserIDs string
	AdminToken   string

	RevenueCatWebhookAuth string
	GLMAPIKey             string
	GLMAPIURL             string
	GLMModel              string
	DeepSeekAPIKey        string
	DeepSeekAPIURL        string
	DeepSeekModel         string
	LLMTimeout            time.Duration

	OpenAIAPIKey string
	OpenAIModel  string

	Port        string
	CORSOrigins string
}

func Load() *Config {
	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "mewify_db"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:        getEnv("JWT_SECRET", ""),
		JWTAccessExpiry:  parseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m")),
		JWTRefreshExpiry: parseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h")),

		AppleClientIDs: getEnv("APPLE_CLIENT_IDS", getEnv("APPLE_CLIENT_ID", "")),

		AdminEmails:  getEnv("ADMIN_EMAILS", ""),
		AdminUserIDs: getEnv("ADMIN_USER_IDS", ""),
		AdminToken:   getEnv("ADMIN_TOKEN", ""),

		RevenueCatWebhookAuth: getEnv("REVENUECAT_WEBHOOK_AUTH", ""),
		// GLM is primary provider.
		GLMAPIKey: getEnv("GLM_API_KEY", getEnv("MEWIFY_GLM_API_KEY", "")),
		GLMAPIURL: getEnv("GLM_API_URL", getEnv("MEWIFY_GLM_API_URL", "https://api.z.ai/api/paas/v4/chat/completions")),
		GLMModel:  getEnv("GLM_MODEL", getEnv("MEWIFY_GLM_MODEL", "glm-4.7")),
		// DeepSeek is secondary fallback provider.
		DeepSeekAPIKey: getEnv("DEEPSEEK_API_KEY", getEnv("MEWIFY_DEEPSEEK_API_KEY", "")),
		DeepSeekAPIURL: getEnv("DEEPSEEK_API_URL", getEnv("MEWIFY_DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")),
		DeepSeekModel:  getEnv("DEEPSEEK_MODEL", getEnv("MEWIFY_DEEPSEEK_MODEL", "deepseek-chat")),
		LLMTimeout:     parseDuration(getEnv("LLM_TIMEOUT", "20s")),

		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
		OpenAIModel:  getEnv("OPENAI_MODEL", "gpt-4o-mini"),

		Port:        getEnv("PORT", "8080"),
		CORSOrigins: getEnv("CORS_ORIGINS", "*"),
	}
}

func (c *Config) DSN() string {
	return "host=" + c.DBHost +
		" user=" + c.DBUser +
		" password=" + c.DBPassword +
		" dbname=" + c.DBName +
		" port=" + c.DBPort +
		" sslmode=" + c.DBSSLMode +
		" TimeZone=UTC"
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute
	}
	return d
}
