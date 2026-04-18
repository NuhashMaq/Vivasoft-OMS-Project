package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/dto"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

// AuthHandler exposes HTTP endpoints for authentication & session management.
type AuthHandler struct {
	authService service.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login authenticates a user and returns a JWT + session.
// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ipAddress := c.ClientIP()
	userAgent := c.Request.UserAgent()

	session, token, err := h.authService.Login(req.Email, req.Password, ipAddress, userAgent)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.LoginResponse{
		Message:   "Login successful",
		Token:     token,
		UserID:    session.UserID,
		ExpiresAt: session.ExpiresAt.Format("2006-01-02T15:04:05Z"),
	})
}

// Logout invalidates the current session.
// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	token := extractToken(c)
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No token provided"})
		return
	}

	if err := h.authService.Logout(token); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, dto.LogoutResponse{Message: "Logged out successfully"})
}

// LogoutAll invalidates all sessions for the authenticated user.
// POST /api/v1/auth/logout-all
func (h *AuthHandler) LogoutAll(c *gin.Context) {
	userIDRaw, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userID, ok := userIDRaw.(uint)
	if !ok {
		// JWT sub is often stored as float64 when parsed from MapClaims
		if f, ok := userIDRaw.(float64); ok {
			userID = uint(f)
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
			return
		}
	}

	if err := h.authService.LogoutAll(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout all sessions"})
		return
	}

	c.JSON(http.StatusOK, dto.LogoutResponse{Message: "All sessions invalidated"})
}

// Me returns the profile of the currently authenticated user.
// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	token := extractToken(c)
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
		return
	}

	session, err := h.authService.ValidateSession(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":    session.User.ID,
		"email":      session.User.Email,
		"first_name": session.User.FirstName,
		"last_name":  session.User.LastName,
		"role":       session.User.Role,
		"is_active":  session.User.IsActive,
	})
}

// extractToken pulls the Bearer token from the Authorization header.
func extractToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}

