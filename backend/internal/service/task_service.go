package service

import (
	"context"
	"errors"
	"time"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"gorm.io/gorm"
)

type TaskService struct {
	Repo          *repository.TaskRepository
	EmployeeRepo  repository.EmployeeRepository
	TaskStatusLog *repository.TaskStatusLogRepository
}

func NewTaskService(repo *repository.TaskRepository, employeeRepo repository.EmployeeRepository, taskStatusLog *repository.TaskStatusLogRepository) *TaskService {
	return &TaskService{Repo: repo, EmployeeRepo: employeeRepo, TaskStatusLog: taskStatusLog}
}

func (s *TaskService) Create(ctx context.Context, projectID uint, req model.CreateTaskReq) (*model.Task, map[string]string, error) {
	fields := map[string]string{}
	if req.Title == "" {
		fields["title"] = "required"
	}
	if req.AssigneeID == 0 {
		fields["assignee_id"] = "required"
	}
	if len(fields) > 0 {
		return nil, fields, errors.New("validation")
	}

	var deadline *time.Time
	if req.Deadline != nil && *req.Deadline != "" {
		d, err := time.Parse("2006-01-02", *req.Deadline)
		if err != nil {
			fields["deadline"] = "must be YYYY-MM-DD"
			return nil, fields, errors.New("validation")
		}
		deadline = &d
	}

	t := &model.Task{
		ProjectID:   projectID,
		Title:       req.Title,
		Description: req.Description,
		Deadline:    deadline,
		Status:      model.TaskToDo,
		AssigneeID:  req.AssigneeID,
	}

	if err := s.validateAssigneeActive(req.AssigneeID); err != nil {
		return nil, nil, err
	}

	if err := s.Repo.Create(ctx, t); err != nil {
		return nil, nil, err
	}

	if s.TaskStatusLog != nil {
		_ = s.TaskStatusLog.Create(ctx, &model.TaskStatusLog{
			TaskID:    t.ID,
			ToStatus:  t.Status,
			ChangedBy: req.AssigneeID,
			Comment:   "task created",
		})
	}
	return t, nil, nil
}

func (s *TaskService) GetByID(ctx context.Context, taskID uint) (*model.Task, error) {
	return s.Repo.GetByID(ctx, taskID)
}

func (s *TaskService) Update(ctx context.Context, taskID uint, req model.UpdateTaskReq) (*model.Task, error) {
	t, err := s.Repo.GetByID(ctx, taskID)
	if err != nil {
		return nil, errors.New("task not found")
	}

	if req.Title != "" {
		t.Title = req.Title
	}
	if req.Description != "" {
		t.Description = req.Description
	}
	if req.Deadline != nil && *req.Deadline != "" {
		d, err := time.Parse("2006-01-02", *req.Deadline)
		if err != nil {
			return nil, errors.New("invalid deadline format")
		}
		t.Deadline = &d
	}
	if req.AssigneeID != nil && *req.AssigneeID > 0 {
		if err := s.validateAssigneeActive(*req.AssigneeID); err != nil {
			return nil, err
		}
		t.AssigneeID = *req.AssigneeID
	}

	if err := s.Repo.Save(ctx, t); err != nil {
		return nil, err
	}
	return t, nil
}

func (s *TaskService) Delete(ctx context.Context, taskID uint) error {
	t, err := s.Repo.GetByID(ctx, taskID)
	if err != nil {
		return errors.New("task not found")
	}
	return s.Repo.Delete(ctx, t.ID)
}

func (s *TaskService) ListByProject(ctx context.Context, projectID uint) ([]model.Task, error) {
	return s.Repo.ListByProject(ctx, projectID)
}

func (s *TaskService) UpdateStatus(ctx context.Context, taskID uint, newStatus model.TaskStatus, canBackward bool, reason string) (*model.Task, error) {
	if !isValidStatus(newStatus) {
		return nil, errors.New("invalid_status")
	}

	t, err := s.Repo.GetByID(ctx, taskID)
	if err != nil {
		return nil, err
	}

	if !isValidTransition(t.Status, newStatus) {
		return nil, errors.New("invalid_transition")
	}

	oldStatus := t.Status
	backward := (t.Status == model.TaskDone && newStatus == model.TaskInProgress) ||
		(t.Status == model.TaskInProgress && newStatus == model.TaskToDo)

	if backward && !canBackward {
		return nil, errors.New("forbidden_backward")
	}
	if backward && reason == "" {
		return nil, errors.New("reason_required")
	}

	now := time.Now().UTC()
	if newStatus == model.TaskInProgress && t.StartedAt == nil {
		t.StartedAt = &now
	}
	if newStatus == model.TaskDone && t.CompletedAt == nil {
		t.CompletedAt = &now
	}

	t.Status = newStatus

	if err := s.Repo.Save(ctx, t); err != nil {
		return nil, err
	}

	if s.TaskStatusLog != nil {
		fromStatus := oldStatus
		_ = s.TaskStatusLog.Create(ctx, &model.TaskStatusLog{
			TaskID:     t.ID,
			FromStatus: &fromStatus,
			ToStatus:   newStatus,
			ChangedBy:  t.AssigneeID,
			Comment:    reason,
		})
	}

	return t, nil
}

func (s *TaskService) ListHistory(ctx context.Context, taskID uint) ([]model.TaskStatusLog, error) {
	if _, err := s.Repo.GetByID(ctx, taskID); err != nil {
		return nil, errors.New("task not found")
	}
	if s.TaskStatusLog == nil {
		return []model.TaskStatusLog{}, nil
	}
	return s.TaskStatusLog.ListByTask(ctx, taskID)
}

func (s *TaskService) validateAssigneeActive(assigneeID uint) error {
	if s.EmployeeRepo == nil {
		return nil
	}
	emp, err := s.EmployeeRepo.GetByID(assigneeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("assignee employee not found")
		}
		return err
	}
	if emp.Status == model.EmploymentStatusInactive {
		return errors.New("cannot assign task to inactive employee")
	}
	return nil
}

func isValidStatus(s model.TaskStatus) bool {
	return s == model.TaskToDo || s == model.TaskInProgress || s == model.TaskDone
}

func isValidTransition(from, to model.TaskStatus) bool {
	if from == to {
		return true
	}
	switch from {
	case model.TaskToDo:
		return to == model.TaskInProgress
	case model.TaskInProgress:
		return to == model.TaskDone || to == model.TaskToDo
	case model.TaskDone:
		return to == model.TaskInProgress
	default:
		return false
	}
}

