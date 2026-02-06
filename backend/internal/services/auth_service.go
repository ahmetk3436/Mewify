package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/config"
	"github.com/ahmetcoskunkizilkaya/mewify/backend/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

// generateJWT creates a new JWT token for the user
func (s *AuthService) generateJWT(userID uuid.UUID) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID.String(),
		"exp": time.Now().Add(s.cfg.JWTAccessExpiry).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}

// generateRefreshToken creates a new refresh token, stores its hash in DB, and returns the raw token
func (s *AuthService) generateRefreshToken(userID uuid.UUID) (string, error) {
	b := make([]byte, 64)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	rawToken := hex.EncodeToString(b)

	hash := sha256.Sum256([]byte(rawToken))
	tokenHash := hex.EncodeToString(hash[:])

	rt := models.RefreshToken{
		ID:        uuid.New(),
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(s.cfg.JWTRefreshExpiry),
		Revoked:   false,
	}
	if err := s.db.Create(&rt).Error; err != nil {
		return "", fmt.Errorf("failed to store refresh token: %w", err)
	}

	return rawToken, nil
}

// Register creates a new user
func (s *AuthService) Register(email, password string) (*models.User, string, string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", "", err
	}

	user := models.User{
		ID:       uuid.New(),
		Email:    email,
		Password: string(hashedPassword),
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, "", "", err
	}

	accessToken, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return &user, accessToken, refreshToken, nil
}

// Login authenticates a user
func (s *AuthService) Login(email, password string) (*models.User, string, string, error) {
	var user models.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", "", errors.New("invalid credentials")
		}
		return nil, "", "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, "", "", errors.New("invalid credentials")
	}

	accessToken, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return &user, accessToken, refreshToken, nil
}

// RefreshToken validates a refresh token and returns a new access token
func (s *AuthService) RefreshToken(refreshTokenStr string) (string, error) {
	hash := sha256.Sum256([]byte(refreshTokenStr))
	tokenHash := hex.EncodeToString(hash[:])

	var rt models.RefreshToken
	err := s.db.Where("token_hash = ? AND revoked = ? AND expires_at > ?", tokenHash, false, time.Now()).First(&rt).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("invalid or expired refresh token")
		}
		return "", fmt.Errorf("failed to query refresh token: %w", err)
	}

	accessToken, err := s.generateJWT(rt.UserID)
	if err != nil {
		return "", err
	}

	return accessToken, nil
}

// Logout revokes a refresh token
func (s *AuthService) Logout(refreshTokenStr string) error {
	hash := sha256.Sum256([]byte(refreshTokenStr))
	tokenHash := hex.EncodeToString(hash[:])

	result := s.db.Model(&models.RefreshToken{}).Where("token_hash = ?", tokenHash).Update("revoked", true)
	if result.Error != nil {
		return fmt.Errorf("failed to revoke refresh token: %w", result.Error)
	}

	return nil
}

// AppleSignIn handles Sign in with Apple (Guideline 4.8)
func (s *AuthService) AppleSignIn(identityToken string) (*models.User, string, string, error) {
	parts := strings.Split(identityToken, ".")
	if len(parts) != 3 {
		return nil, "", "", errors.New("invalid identity token format")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to decode identity token payload: %w", err)
	}

	var claims struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, "", "", fmt.Errorf("failed to parse identity token claims: %w", err)
	}

	if claims.Sub == "" {
		return nil, "", "", errors.New("missing sub claim in identity token")
	}

	email := claims.Email
	if email == "" {
		email = "apple_" + claims.Sub + "@privaterelay.appleid.com"
	}

	var user models.User
	err = s.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			user = models.User{
				ID:    uuid.New(),
				Email: email,
			}
			if err := s.db.Create(&user).Error; err != nil {
				return nil, "", "", fmt.Errorf("failed to create apple user: %w", err)
			}
		} else {
			return nil, "", "", err
		}
	}

	accessToken, err := s.generateJWT(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", err
	}

	return &user, accessToken, refreshToken, nil
}

// DeleteAccount handles account deletion (Guideline 5.1.1)
func (s *AuthService) DeleteAccount(userID uuid.UUID) error {
	// 1. Delete associated refresh tokens
	if err := s.db.Where("user_id = ?", userID).Delete(&models.RefreshToken{}).Error; err != nil {
		return fmt.Errorf("failed to delete refresh tokens: %w", err)
	}

	// 2. Soft delete the user (GORM default behavior with DeletedAt)
	if err := s.db.Delete(&models.User{}, userID).Error; err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}
