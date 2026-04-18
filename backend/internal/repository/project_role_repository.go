package repository

import (
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

// ProjectRoleRepository manages per-project role assignments.
type ProjectRoleRepository interface {
	Assign(pr *model.ProjectRole) error
	Update(pr *model.ProjectRole) error
	GetByUserAndProject(userID, projectID uint) (*model.ProjectRole, error)
	GetByProject(projectID uint) ([]model.ProjectRole, error)
	GetByUser(userID uint) ([]model.ProjectRole, error)
	Revoke(userID, projectID uint) error
	RevokeAllByProject(projectID uint) error
}

type projectRoleRepository struct {
	db *gorm.DB
}

func NewProjectRoleRepository(db *gorm.DB) ProjectRoleRepository {
	return &projectRoleRepository{db: db}
}

func (r *projectRoleRepository) Assign(pr *model.ProjectRole) error {
	return r.db.Create(pr).Error
}

func (r *projectRoleRepository) Update(pr *model.ProjectRole) error {
	return r.db.Save(pr).Error
}

func (r *projectRoleRepository) GetByUserAndProject(userID, projectID uint) (*model.ProjectRole, error) {
	var pr model.ProjectRole
	if err := r.db.Where("user_id = ? AND project_id = ?", userID, projectID).
		Preload("User").
		First(&pr).Error; err != nil {
		return nil, err
	}
	return &pr, nil
}

func (r *projectRoleRepository) GetByProject(projectID uint) ([]model.ProjectRole, error) {
	var prs []model.ProjectRole
	if err := r.db.Where("project_id = ?", projectID).
		Preload("User").
		Find(&prs).Error; err != nil {
		return nil, err
	}
	return prs, nil
}

func (r *projectRoleRepository) GetByUser(userID uint) ([]model.ProjectRole, error) {
	var prs []model.ProjectRole
	if err := r.db.Where("user_id = ?", userID).Find(&prs).Error; err != nil {
		return nil, err
	}
	return prs, nil
}

func (r *projectRoleRepository) Revoke(userID, projectID uint) error {
	return r.db.Where("user_id = ? AND project_id = ?", userID, projectID).
		Delete(&model.ProjectRole{}).Error
}

func (r *projectRoleRepository) RevokeAllByProject(projectID uint) error {
	return r.db.Where("project_id = ?", projectID).Delete(&model.ProjectRole{}).Error
}

