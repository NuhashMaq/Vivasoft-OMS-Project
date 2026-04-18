package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/dto"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

// RBACHandler exposes HTTP endpoints for role & permission management.
type RBACHandler struct {
	rbacService service.RBACService
}

// NewRBACHandler creates a new RBACHandler.
func NewRBACHandler(rbacService service.RBACService) *RBACHandler {
	return &RBACHandler{rbacService: rbacService}
}

// ── System role endpoints ───────────────────────────────────

// AssignSystemRole assigns a system role to a user.
// PUT /api/v1/roles/system
func (h *RBACHandler) AssignSystemRole(c *gin.Context) {
	var req dto.AssignSystemRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignerRole := getRoleFromContext(c)

	if err := h.rbacService.AssignSystemRole(assignerRole, req.UserID, req.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SystemRoleResponse{
		Message: "System role assigned successfully",
		UserID:  req.UserID,
		Role:    req.Role,
	})
}

// GetPermissions returns all permissions for the caller's role.
// GET /api/v1/roles/permissions
func (h *RBACHandler) GetPermissions(c *gin.Context) {
	role := getRoleFromContext(c)
	rps, err := h.rbacService.GetPermissionsForRole(role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var perms []dto.PermissionResponse
	for _, rp := range rps {
		perms = append(perms, dto.PermissionResponse{
			ID:          rp.Permission.ID,
			Name:        rp.Permission.Name,
			Description: rp.Permission.Description,
			Resource:    rp.Permission.Resource,
			Action:      rp.Permission.Action,
		})
	}

	c.JSON(http.StatusOK, gin.H{"role": role, "permissions": perms})
}

// ── Project role endpoints ──────────────────────────────────

// AssignProjectRole assigns a user a role within a project.
// POST /api/v1/projects/:project_id/roles
func (h *RBACHandler) AssignProjectRole(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
		return
	}

	var req dto.AssignProjectRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignerRole := getRoleFromContext(c)
	assignerID := getUintFromContext(c, "userID")

	if err := h.rbacService.AssignProjectRole(assignerRole, assignerID, req.UserID, uint(projectID), req.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.ProjectRoleResponse{
		Message:   "Project role assigned successfully",
		UserID:    req.UserID,
		ProjectID: uint(projectID),
		Role:      req.Role,
	})
}

// UpdateProjectRole updates a user's role within a project.
// PUT /api/v1/projects/:project_id/roles/:user_id
func (h *RBACHandler) UpdateProjectRole(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
		return
	}

	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	var req dto.UpdateProjectRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignerRole := getRoleFromContext(c)
	assignerID := getUintFromContext(c, "userID")

	if err := h.rbacService.UpdateProjectRole(assignerRole, assignerID, uint(userID), uint(projectID), req.Role); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ProjectRoleResponse{
		Message:   "Project role updated successfully",
		UserID:    uint(userID),
		ProjectID: uint(projectID),
		Role:      req.Role,
	})
}

// GetProjectMembers returns all members of a project with their roles.
// GET /api/v1/projects/:project_id/roles
func (h *RBACHandler) GetProjectMembers(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
		return
	}

	members, err := h.rbacService.GetProjectMembers(uint(projectID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var resp []dto.ProjectMemberResponse
	for _, m := range members {
		resp = append(resp, dto.ProjectMemberResponse{
			UserID:    m.UserID,
			FirstName: m.User.FirstName,
			LastName:  m.User.LastName,
			Email:     m.User.Email,
			Role:      m.Role,
		})
	}

	c.JSON(http.StatusOK, gin.H{"project_id": projectID, "members": resp})
}

// RevokeProjectRole removes a user's role from a project.
// DELETE /api/v1/projects/:project_id/roles/:user_id
func (h *RBACHandler) RevokeProjectRole(c *gin.Context) {
	projectID, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project_id"})
		return
	}

	userID, err := strconv.ParseUint(c.Param("user_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	assignerRole := getRoleFromContext(c)
	assignerID := getUintFromContext(c, "userID")

	if err := h.rbacService.RevokeProjectRole(assignerRole, assignerID, uint(userID), uint(projectID)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project role revoked successfully"})
}

// ── Helpers ─────────────────────────────────────────────────

func getRoleFromContext(c *gin.Context) string {
	role, exists := c.Get("role")
	if !exists {
		return ""
	}
	if s, ok := role.(string); ok {
		return s
	}
	return ""
}

func getUintFromContext(c *gin.Context, key string) uint {
	v, exists := c.Get(key)
	if !exists {
		return 0
	}
	switch val := v.(type) {
	case uint:
		return val
	case float64:
		return uint(val)
	case int:
		return uint(val)
	default:
		return 0
	}
}

