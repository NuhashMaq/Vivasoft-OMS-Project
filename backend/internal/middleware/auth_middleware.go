package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/industrial-attachment/office-management-backend/internal/config"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

// AuthMiddleware validates the JWT signature AND checks that a matching
// active session exists in the database (double-validation).
func AuthMiddleware(cfg *config.Config, authService service.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// 1. Verify JWT signature & claims
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(cfg.JWT.SecretKey), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		// 2. Validate session exists and is not expired in the database
		session, err := authService.ValidateSession(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Session invalid or expired. Please login again."})
			c.Abort()
			return
		}

		// 3. Set context values for downstream handlers
		c.Set("userID", session.UserID)
		c.Set("sessionID", session.ID)

		if email, exists := claims["email"]; exists {
			c.Set("email", email)
		}
		if role, exists := claims["role"]; exists {
			c.Set("role", role)
		}

		c.Next()
	}
}

