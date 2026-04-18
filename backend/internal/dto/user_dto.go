package dto

// LoginRequest is the payload for POST /api/v1/auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse is returned after a successful login.
type LoginResponse struct {
	Message   string `json:"message"`
	Token     string `json:"token"`
	UserID    uint   `json:"user_id"`
	ExpiresAt string `json:"expires_at"`
}

// LogoutResponse is returned after a successful logout.
type LogoutResponse struct {
	Message string `json:"message"`
}

// SessionResponse describes an active session for the current user.
type SessionResponse struct {
	ID        uint   `json:"id"`
	IPAddress string `json:"ip_address"`
	UserAgent string `json:"user_agent"`
	ExpiresAt string `json:"expires_at"`
	CreatedAt string `json:"created_at"`
}

