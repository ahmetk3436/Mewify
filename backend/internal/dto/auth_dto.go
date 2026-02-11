package dto

import "github.com/google/uuid"

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type ClaimGuestRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// AppleSignInRequest accepts both snake_case and legacy camelCase payloads.
type AppleSignInRequest struct {
	IdentityToken       string `json:"identity_token"`
	IdentityTokenLegacy string `json:"identityToken,omitempty"`
	AuthCode            string `json:"authorization_code,omitempty"`
	FullName            string `json:"full_name,omitempty"`
	Email               string `json:"email,omitempty"`
}

type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         UserResponse `json:"user"`
}

type UserResponse struct {
	ID    uuid.UUID `json:"id"`
	Email string    `json:"email"`
}

type ErrorResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
}
