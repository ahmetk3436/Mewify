package dto

// ErrorResponse is the standard error response format
type ErrorResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
}

// RegisterRequest represents the request body for user registration
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest represents the request body for user login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// RefreshTokenRequest represents the request body for refreshing a token
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken"`
}

// AppleSignInRequest represents the request body for Sign in with Apple
type AppleSignInRequest struct {
	IdentityToken string `json:"identityToken"`
}