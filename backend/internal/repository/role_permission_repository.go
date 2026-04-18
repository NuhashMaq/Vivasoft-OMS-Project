package repository

import (
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

// RolePermissionRepository maps system roles to permissions.
type RolePermissionRepository interface {
	Assign(rolePermission *model.RolePermission) error
	Revoke(role string, permissionID uint) error
	GetByRole(role string) ([]model.RolePermission, error)
	HasPermission(role, permissionName string) (bool, error)
	RevokeAllByRole(role string) error
}

type rolePermissionRepository struct {
	db *gorm.DB
}

func NewRolePermissionRepository(db *gorm.DB) RolePermissionRepository {
	return &rolePermissionRepository{db: db}
}

func (r *rolePermissionRepository) Assign(rp *model.RolePermission) error {
	return r.db.Create(rp).Error
}

func (r *rolePermissionRepository) Revoke(role string, permissionID uint) error {
	return r.db.Where("role = ? AND permission_id = ?", role, permissionID).
		Delete(&model.RolePermission{}).Error
}

func (r *rolePermissionRepository) GetByRole(role string) ([]model.RolePermission, error) {
	var rps []model.RolePermission
	if err := r.db.Preload("Permission").Where("role = ?", role).Find(&rps).Error; err != nil {
		return nil, err
	}
	return rps, nil
}

func (r *rolePermissionRepository) HasPermission(role, permissionName string) (bool, error) {
	var count int64
	err := r.db.Model(&model.RolePermission{}).
		Joins("JOIN permissions ON permissions.id = role_permissions.permission_id").
		Where("role_permissions.role = ? AND permissions.name = ? AND permissions.deleted_at IS NULL", role, permissionName).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *rolePermissionRepository) RevokeAllByRole(role string) error {
	return r.db.Where("role = ?", role).Delete(&model.RolePermission{}).Error
}

