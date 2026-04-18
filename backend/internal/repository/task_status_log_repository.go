package repository

import (
	"context"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

type TaskStatusLogRepository struct {
	DB *gorm.DB
}

func NewTaskStatusLogRepository(db *gorm.DB) *TaskStatusLogRepository {
	return &TaskStatusLogRepository{DB: db}
}

func (r *TaskStatusLogRepository) Create(ctx context.Context, log *model.TaskStatusLog) error {
	return r.DB.WithContext(ctx).Create(log).Error
}

func (r *TaskStatusLogRepository) ListByTask(ctx context.Context, taskID uint) ([]model.TaskStatusLog, error) {
	var logs []model.TaskStatusLog
	err := r.DB.WithContext(ctx).
		Where("task_id = ?", taskID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}
