package middleware

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

// RequireRole returns middleware that only allows users with one of the
// specified system roles to proceed.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found in context"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role type"})
			c.Abort()
			return
		}

		if !allowed[roleStr] {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role privileges"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission returns middleware that checks whether the caller's role
// has the named permission (looked up via RBACService).
func RequirePermission(rbacService service.RBACService, permissionName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Role not found in context"})
			c.Abort()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid role type"})
			c.Abort()
			return
		}

		has, err := rbacService.HasPermission(roleStr, permissionName)
		if err != nil || !has {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have permission: " + permissionName})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireProjectRole ensures the caller has one of the given roles on the
// project identified by the :project_id URL parameter.
func RequireProjectRole(rbacService service.RBACService, projectRoles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(projectRoles))
	for _, r := range projectRoles {
		allowed[r] = true
	}

	return func(c *gin.Context) {
		userIDRaw, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}
		userID := toUint(userIDRaw)

		projectIDStr := c.Param("project_id")
		projectID, err := strconv.ParseUint(projectIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
			c.Abort()
			return
		}

		// Super admin and admin bypass project-level checks
		if role, ok := c.Get("role"); ok {
			if roleStr, ok := role.(string); ok && (roleStr == "super_admin" || roleStr == "admin") {
				c.Set("projectRole", "owner") // treat as owner for downstream
				c.Next()
				return
			}
		}

		pr, err := rbacService.GetProjectRole(userID, uint(projectID))
		if err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this project"})
			c.Abort()
			return
		}

		if !allowed[pr.Role] {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient project role"})
			c.Abort()
			return
		}

		c.Set("projectRole", pr.Role)
		c.Next()
	}
}

// RestrictSuperAdminTaskModification prevents super_admin users from modifying
// tasks. They can read but not create/update/delete.
func RestrictSuperAdminTaskModification() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.Next()
			return
		}

		roleStr, ok := role.(string)
		if !ok {
			c.Next()
			return
		}

		if roleStr == "super_admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Super admin cannot modify tasks directly. Please delegate to a project member.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// toUint safely converts an interface{} (often float64 from JWT) to uint.
func toUint(v interface{}) uint {
	switch val := v.(type) {
	case uint:
		return val
	case float64:
		return uint(val)
	case int:
		return uint(val)
	case int64:
		return uint(val)
	default:
		return 0
	}
}

