package dto

// ── System role DTOs ────────────────────────────────────────

// AssignSystemRoleRequest is the payload for assigning a system role.
type AssignSystemRoleRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Role   string `json:"role" binding:"required"`
}

// SystemRoleResponse is returned after a role assignment.
type SystemRoleResponse struct {
	Message string `json:"message"`
	UserID  uint   `json:"user_id"`
	Role    string `json:"role"`
}

// ── Project role DTOs ───────────────────────────────────────

// AssignProjectRoleRequest is the payload for assigning a project role.
type AssignProjectRoleRequest struct {
	UserID uint   `json:"user_id" binding:"required"`
	Role   string `json:"role" binding:"required"` // owner / editor / viewer
}

// UpdateProjectRoleRequest is the payload for updating a project role.
type UpdateProjectRoleRequest struct {
	Role string `json:"role" binding:"required"`
}

// ProjectRoleResponse is returned after a project role operation.
type ProjectRoleResponse struct {
	Message   string `json:"message"`
	UserID    uint   `json:"user_id"`
	ProjectID uint   `json:"project_id"`
	Role      string `json:"role"`
}

// ProjectMemberResponse describes a member of a project.
type ProjectMemberResponse struct {
	UserID    uint   `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}

// ── Permission DTOs ─────────────────────────────────────────

// PermissionResponse represents a single permission.
type PermissionResponse struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Resource    string `json:"resource"`
	Action      string `json:"action"`
}

