package repository

import (
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

// PermissionRepository handles Permission CRUD.
type PermissionRepository interface {
	Create(permission *model.Permission) error
	GetByID(id uint) (*model.Permission, error)
	GetByName(name string) (*model.Permission, error)
	GetAll() ([]model.Permission, error)
	GetByResource(resource string) ([]model.Permission, error)
	Delete(id uint) error
}

type permissionRepository struct {
	db *gorm.DB
}

func NewPermissionRepository(db *gorm.DB) PermissionRepository {
	return &permissionRepository{db: db}
}

func (r *permissionRepository) Create(permission *model.Permission) error {
	return r.db.Create(permission).Error
}

func (r *permissionRepository) GetByID(id uint) (*model.Permission, error) {
	var p model.Permission
	if err := r.db.First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *permissionRepository) GetByName(name string) (*model.Permission, error) {
	var p model.Permission
	if err := r.db.Where("name = ?", name).First(&p).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *permissionRepository) GetAll() ([]model.Permission, error) {
	var perms []model.Permission
	if err := r.db.Find(&perms).Error; err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *permissionRepository) GetByResource(resource string) ([]model.Permission, error) {
	var perms []model.Permission
	if err := r.db.Where("resource = ?", resource).Find(&perms).Error; err != nil {
		return nil, err
	}
	return perms, nil
}

func (r *permissionRepository) Delete(id uint) error {
	return r.db.Delete(&model.Permission{}, id).Error
}

