package model

import (
	"time"

	"gorm.io/gorm"
)

// ──────────────────────────────────────────────────────────
// System Roles
// ──────────────────────────────────────────────────────────

// Predefined system role constants.
const (
	RoleSuperAdmin = "super_admin"
	RoleAdmin      = "admin"
	RoleManager    = "manager"
	RoleUser       = "user"
)

// AllSystemRoles returns every valid system role, ordered by privilege.
func AllSystemRoles() []string {
	return []string{RoleSuperAdmin, RoleAdmin, RoleManager, RoleUser}
}

// IsValidSystemRole checks whether the given string is a known role.
func IsValidSystemRole(role string) bool {
	for _, r := range AllSystemRoles() {
		if r == role {
			return true
		}
	}
	return false
}

// ──────────────────────────────────────────────────────────
// Permission
// ──────────────────────────────────────────────────────────

// Permission represents a granular action that can be assigned to a role.
type Permission struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"uniqueIndex;size:100;not null" json:"name"`
	Description string         `gorm:"size:255" json:"description"`
	Resource    string         `gorm:"size:50;not null;index" json:"resource"` // e.g. "users", "projects", "tasks"
	Action      string         `gorm:"size:50;not null" json:"action"`         // e.g. "create", "read", "update", "delete"
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// ──────────────────────────────────────────────────────────
// RolePermission  (many-to-many join table)
// ──────────────────────────────────────────────────────────

// RolePermission maps a system role to a permission.
type RolePermission struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Role         string         `gorm:"size:50;not null;index" json:"role"`
	PermissionID uint           `gorm:"not null;index" json:"permission_id"`
	CreatedAt    time.Time      `json:"created_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	Permission Permission `gorm:"foreignKey:PermissionID" json:"permission,omitempty"`
}

// ──────────────────────────────────────────────────────────
// ProjectRole  (per-project role override)
// ──────────────────────────────────────────────────────────

// Predefined project-level role constants.
const (
	ProjectRoleOwner  = "owner"
	ProjectRoleEditor = "editor"
	ProjectRoleViewer = "viewer"
)

// AllProjectRoles returns every valid project role.
func AllProjectRoles() []string {
	return []string{ProjectRoleOwner, ProjectRoleEditor, ProjectRoleViewer}
}

// IsValidProjectRole checks whether the given string is a known project role.
func IsValidProjectRole(role string) bool {
	for _, r := range AllProjectRoles() {
		if r == role {
			return true
		}
	}
	return false
}

// ProjectRole assigns a user a specific role within a project.
type ProjectRole struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	ProjectID uint           `gorm:"not null;index" json:"project_id"`
	Role      string         `gorm:"size:50;not null" json:"role"` // owner / editor / viewer
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

