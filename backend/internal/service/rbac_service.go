package service

import (
	"errors"
	"fmt"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"gorm.io/gorm"
)

// RBACService handles role-based access control operations.
type RBACService interface {
	// ── System role management (super_admin only) ───────────
	AssignSystemRole(assignerRole string, userID uint, newRole string) error
	GetUserSystemRole(userID uint) (string, error)

	// ── Permission checks ───────────────────────────────────
	HasPermission(role, permissionName string) (bool, error)
	GetPermissionsForRole(role string) ([]model.RolePermission, error)

	// ── Project role management ─────────────────────────────
	AssignProjectRole(assignerRole string, assignerID, userID, projectID uint, role string) error
	UpdateProjectRole(assignerRole string, assignerID, userID, projectID uint, role string) error
	GetProjectRole(userID, projectID uint) (*model.ProjectRole, error)
	GetProjectMembers(projectID uint) ([]model.ProjectRole, error)
	GetUserProjects(userID uint) ([]model.ProjectRole, error)
	RevokeProjectRole(assignerRole string, assignerID, userID, projectID uint) error

	// ── Super admin task modification restriction ───────────
	CanModifyTask(systemRole string, projectRole string) (bool, error)

	// ── Seed default permissions ────────────────────────────
	SeedDefaultPermissions() error
}

type rbacService struct {
	userRepo repository.UserRepository
	permRepo repository.PermissionRepository
	rpRepo   repository.RolePermissionRepository
	projRepo repository.ProjectRoleRepository
}

func NewRBACService(
	userRepo repository.UserRepository,
	permRepo repository.PermissionRepository,
	rpRepo repository.RolePermissionRepository,
	projRepo repository.ProjectRoleRepository,
) RBACService {
	return &rbacService{
		userRepo: userRepo,
		permRepo: permRepo,
		rpRepo:   rpRepo,
		projRepo: projRepo,
	}
}

// ─── System role management ─────────────────────────────────

// AssignSystemRole lets a super_admin change another user's system role.
func (s *rbacService) AssignSystemRole(assignerRole string, userID uint, newRole string) error {
	if assignerRole != model.RoleSuperAdmin {
		return errors.New("only super_admin can assign system roles")
	}
	if !model.IsValidSystemRole(newRole) {
		return fmt.Errorf("invalid system role: %s", newRole)
	}

	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return err
	}

	// Prevent changing another super_admin's role
	if user.Role == model.RoleSuperAdmin && newRole != model.RoleSuperAdmin {
		return errors.New("cannot demote another super_admin")
	}

	user.Role = newRole
	return s.userRepo.Update(user)
}

// GetUserSystemRole returns the system role of a user.
func (s *rbacService) GetUserSystemRole(userID uint) (string, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return "", err
	}
	return user.Role, nil
}

// ─── Permission checks ──────────────────────────────────────

func (s *rbacService) HasPermission(role, permissionName string) (bool, error) {
	// Super admin always has all permissions
	if role == model.RoleSuperAdmin {
		return true, nil
	}
	return s.rpRepo.HasPermission(role, permissionName)
}

func (s *rbacService) GetPermissionsForRole(role string) ([]model.RolePermission, error) {
	return s.rpRepo.GetByRole(role)
}

// ─── Project role management ────────────────────────────────

// AssignProjectRole assigns a project-level role. Only super_admin, admin, or
// the project owner can do this.
func (s *rbacService) AssignProjectRole(assignerRole string, assignerID, userID, projectID uint, role string) error {
	if !model.IsValidProjectRole(role) {
		return fmt.Errorf("invalid project role: %s", role)
	}

	if err := s.canManageProjectRoles(assignerRole, assignerID, projectID); err != nil {
		return err
	}

	// Check if assignment already exists
	existing, err := s.projRepo.GetByUserAndProject(userID, projectID)
	if err == nil && existing != nil {
		return errors.New("user already has a role in this project; use update instead")
	}

	pr := &model.ProjectRole{
		UserID:    userID,
		ProjectID: projectID,
		Role:      role,
	}
	return s.projRepo.Assign(pr)
}

func (s *rbacService) UpdateProjectRole(assignerRole string, assignerID, userID, projectID uint, role string) error {
	if !model.IsValidProjectRole(role) {
		return fmt.Errorf("invalid project role: %s", role)
	}

	if err := s.canManageProjectRoles(assignerRole, assignerID, projectID); err != nil {
		return err
	}

	pr, err := s.projRepo.GetByUserAndProject(userID, projectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user does not have a role in this project")
		}
		return err
	}

	pr.Role = role
	return s.projRepo.Update(pr)
}

func (s *rbacService) GetProjectRole(userID, projectID uint) (*model.ProjectRole, error) {
	return s.projRepo.GetByUserAndProject(userID, projectID)
}

func (s *rbacService) GetProjectMembers(projectID uint) ([]model.ProjectRole, error) {
	return s.projRepo.GetByProject(projectID)
}

func (s *rbacService) GetUserProjects(userID uint) ([]model.ProjectRole, error) {
	return s.projRepo.GetByUser(userID)
}

func (s *rbacService) RevokeProjectRole(assignerRole string, assignerID, userID, projectID uint) error {
	if err := s.canManageProjectRoles(assignerRole, assignerID, projectID); err != nil {
		return err
	}
	return s.projRepo.Revoke(userID, projectID)
}

// canManageProjectRoles checks whether the assigner is allowed to manage
// project roles (super_admin, admin, or project owner).
func (s *rbacService) canManageProjectRoles(assignerRole string, assignerID, projectID uint) error {
	if assignerRole == model.RoleSuperAdmin || assignerRole == model.RoleAdmin {
		return nil // system-level admins can always manage
	}

	pr, err := s.projRepo.GetByUserAndProject(assignerID, projectID)
	if err != nil {
		return errors.New("you do not have permission to manage roles in this project")
	}
	if pr.Role != model.ProjectRoleOwner {
		return errors.New("only project owners, admins, or super admins can manage project roles")
	}
	return nil
}

// ─── Super admin task modification restriction ──────────────

// CanModifyTask determines whether a user can modify a task based on their
// system role and project role.
// Rule: super_admin can view everything but CANNOT modify tasks — they
// delegate task work. Only editor / owner at project level can modify.
func (s *rbacService) CanModifyTask(systemRole string, projectRole string) (bool, error) {
	// Super admin is restricted from modifying tasks
	if systemRole == model.RoleSuperAdmin {
		return false, nil
	}

	// Project-level check: only owner and editor can modify
	switch projectRole {
	case model.ProjectRoleOwner, model.ProjectRoleEditor:
		return true, nil
	case model.ProjectRoleViewer:
		return false, nil
	default:
		return false, nil
	}
}

// ─── Seed default permissions ───────────────────────────────

// SeedDefaultPermissions creates the default permission set and role mappings
// if they do not already exist. Should be called once at startup.
func (s *rbacService) SeedDefaultPermissions() error {
	// Define default permissions
	defaults := []model.Permission{
		{Name: "users:create", Description: "Create users", Resource: "users", Action: "create"},
		{Name: "users:read", Description: "Read users", Resource: "users", Action: "read"},
		{Name: "users:update", Description: "Update users", Resource: "users", Action: "update"},
		{Name: "users:delete", Description: "Delete users", Resource: "users", Action: "delete"},
		{Name: "users:assign_role", Description: "Assign system roles", Resource: "users", Action: "assign_role"},
		{Name: "projects:create", Description: "Create projects", Resource: "projects", Action: "create"},
		{Name: "projects:read", Description: "Read projects", Resource: "projects", Action: "read"},
		{Name: "projects:update", Description: "Update projects", Resource: "projects", Action: "update"},
		{Name: "projects:delete", Description: "Delete projects", Resource: "projects", Action: "delete"},
		{Name: "projects:assign_role", Description: "Assign project roles", Resource: "projects", Action: "assign_role"},
		{Name: "tasks:create", Description: "Create tasks", Resource: "tasks", Action: "create"},
		{Name: "tasks:read", Description: "Read tasks", Resource: "tasks", Action: "read"},
		{Name: "tasks:update", Description: "Update tasks", Resource: "tasks", Action: "update"},
		{Name: "tasks:delete", Description: "Delete tasks", Resource: "tasks", Action: "delete"},
		{Name: "employees:create", Description: "Create employees", Resource: "employees", Action: "create"},
		{Name: "employees:read", Description: "Read employees", Resource: "employees", Action: "read"},
		{Name: "employees:update", Description: "Update employees", Resource: "employees", Action: "update"},
		{Name: "employees:delete", Description: "Delete employees", Resource: "employees", Action: "delete"},
	}

	// Upsert permissions
	for i := range defaults {
		existing, err := s.permRepo.GetByName(defaults[i].Name)
		if err == nil && existing != nil {
			defaults[i].ID = existing.ID
			continue
		}
		if err := s.permRepo.Create(&defaults[i]); err != nil {
			return fmt.Errorf("failed to seed permission %s: %w", defaults[i].Name, err)
		}
	}

	// Build name→ID map
	allPerms, err := s.permRepo.GetAll()
	if err != nil {
		return err
	}
	permMap := make(map[string]uint)
	for _, p := range allPerms {
		permMap[p.Name] = p.ID
	}

	// Role → permissions mapping
	rolePermsMap := map[string][]string{
		model.RoleAdmin: {
			"users:create", "users:read", "users:update", "users:delete",
			"projects:create", "projects:read", "projects:update", "projects:delete", "projects:assign_role",
			"tasks:create", "tasks:read", "tasks:update", "tasks:delete",
			"employees:create", "employees:read", "employees:update", "employees:delete",
		},
		model.RoleManager: {
			"users:read",
			"projects:read", "projects:update", "projects:assign_role",
			"tasks:create", "tasks:read", "tasks:update", "tasks:delete",
			"employees:create", "employees:read", "employees:update",
		},
		model.RoleUser: {
			"users:read",
			"projects:read",
			"tasks:read",
			"employees:read",
		},
	}

	for role, permNames := range rolePermsMap {
		// Clear existing mappings for idempotency
		_ = s.rpRepo.RevokeAllByRole(role)

		for _, pName := range permNames {
			pid, ok := permMap[pName]
			if !ok {
				continue
			}
			rp := &model.RolePermission{Role: role, PermissionID: pid}
			if err := s.rpRepo.Assign(rp); err != nil {
				return fmt.Errorf("failed to assign %s → %s: %w", role, pName, err)
			}
		}
	}

	return nil
}

