package repository

import (
	"context"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

type TaskRepository struct {
	DB *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{DB: db}
}

func (r *TaskRepository) Create(ctx context.Context, t *model.Task) error {
	return r.DB.WithContext(ctx).Create(t).Error
}

func (r *TaskRepository) GetByID(ctx context.Context, id uint) (*model.Task, error) {
	var t model.Task
	if err := r.DB.WithContext(ctx).First(&t, id).Error; err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TaskRepository) Delete(ctx context.Context, id uint) error {
	return r.DB.WithContext(ctx).Delete(&model.Task{}, id).Error
}

func (r *TaskRepository) ListByProject(ctx context.Context, projectID uint) ([]model.Task, error) {
	var tasks []model.Task
	err := r.DB.WithContext(ctx).
		Where("project_id = ?", projectID).
		Order("id DESC").
		Find(&tasks).Error
	return tasks, err
}

func (r *TaskRepository) Save(ctx context.Context, t *model.Task) error {
	return r.DB.WithContext(ctx).Save(t).Error
}

