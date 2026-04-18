package repository

import (
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

type ProjectRepository interface {
	Create(project *model.Project) error
	GetByID(id uint) (*model.Project, error)
	GetByName(name string) (*model.Project, error)
	Update(project *model.Project) error
	Delete(id uint) error
	GetAll(page, pageSize int, status model.ProjectStatus, projectType model.ProjectType) ([]model.Project, int64, error)
}

type projectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{db: db}
}

func (r *projectRepository) Create(project *model.Project) error {
	return r.db.Create(project).Error
}

func (r *projectRepository) GetByID(id uint) (*model.Project, error) {
	var project model.Project
	if err := r.db.First(&project, id).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) GetByName(name string) (*model.Project, error) {
	var project model.Project
	if err := r.db.Where("name = ?", name).First(&project).Error; err != nil {
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) Update(project *model.Project) error {
	return r.db.Save(project).Error
}

func (r *projectRepository) Delete(id uint) error {
	return r.db.Delete(&model.Project{}, id).Error
}

func (r *projectRepository) GetAll(page, pageSize int, status model.ProjectStatus, projectType model.ProjectType) ([]model.Project, int64, error) {
	var projects []model.Project
	var total int64

	query := r.db.Model(&model.Project{})

	// Apply optional filters
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if projectType != "" {
		query = query.Where("type = ?", projectType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&projects).Error; err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

