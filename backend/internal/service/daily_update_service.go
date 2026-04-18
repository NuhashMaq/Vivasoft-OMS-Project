package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"gorm.io/gorm"
)

type DailyUpdateService struct {
	Repo     *repository.DailyUpdateRepository
	TaskRepo *repository.TaskRepository
}

func NewDailyUpdateService(repo *repository.DailyUpdateRepository, taskRepo *repository.TaskRepository) *DailyUpdateService {
	return &DailyUpdateService{Repo: repo, TaskRepo: taskRepo}
}

func (s *DailyUpdateService) Upsert(ctx context.Context, userID uint, req model.UpsertDailyUpdateReq) (*model.DailyUpdate, error) {
	if len(req.Updates) == 0 {
		return nil, errors.New("at least one update item is required")
	}

	updateDate, err := parseDailyDate(req.Date)
	if err != nil {
		return nil, err
	}
	if !isWeekday(updateDate) {
		return nil, errors.New("daily updates are only accepted for weekdays")
	}

	items, err := s.buildItems(ctx, req.Updates)
	if err != nil {
		return nil, err
	}

	existing, err := s.Repo.GetByUserAndDate(ctx, userID, updateDate)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if existing == nil {
		daily := &model.DailyUpdate{
			UserID:      userID,
			UpdateDate:  updateDate,
			Summary:     req.Summary,
			HoursWorked: req.HoursWorked,
			Items:       items,
		}
		if err := s.Repo.Create(ctx, daily); err != nil {
			return nil, err
		}
		if err := s.createTasksFromItems(ctx, daily.Items); err != nil {
			return nil, err
		}
		return daily, nil
	}

	if err := s.storeHistory(ctx, *existing, userID); err != nil {
		return nil, err
	}

	existing.Summary = req.Summary
	existing.HoursWorked = req.HoursWorked
	if err := s.Repo.Update(ctx, existing); err != nil {
		return nil, err
	}

	for i := range items {
		items[i].DailyUpdateID = existing.ID
	}
	if err := s.Repo.ReplaceItems(ctx, existing.ID, items); err != nil {
		return nil, err
	}
	if err := s.createTasksFromItems(ctx, items); err != nil {
		return nil, err
	}

	updated, err := s.Repo.GetByUserAndDate(ctx, userID, updateDate)
	if err != nil {
		return nil, err
	}
	return updated, nil
}

func (s *DailyUpdateService) ListByUser(ctx context.Context, userID uint, from, to time.Time) ([]model.DailyUpdate, error) {
	if to.Before(from) {
		return nil, errors.New("invalid date range")
	}
	return s.Repo.ListByUserBetween(ctx, userID, from, to)
}

func (s *DailyUpdateService) MissingWeekdayCount(ctx context.Context, userID uint, from, to time.Time) (int, error) {
	if to.Before(from) {
		return 0, errors.New("invalid date range")
	}
	weekdays := weekdaysBetween(from, to)
	count, err := s.Repo.CountUserSubmissionsByDates(ctx, userID, weekdays)
	if err != nil {
		return 0, err
	}
	missing := len(weekdays) - int(count)
	if missing < 0 {
		missing = 0
	}
	return missing, nil
}

func (s *DailyUpdateService) buildItems(ctx context.Context, reqItems []model.DailyUpdateItemReq) ([]model.DailyUpdateItem, error) {
	items := make([]model.DailyUpdateItem, 0, len(reqItems))
	for _, in := range reqItems {
		action := strings.ToLower(strings.TrimSpace(in.Action))
		if action != "started" && action != "progressed" && action != "completed" && action != "new_task" {
			return nil, errors.New("invalid action; allowed: started, progressed, completed, new_task")
		}

		projectID := in.ProjectID
		if projectID == 0 {
			if in.TaskID == nil || *in.TaskID == 0 {
				return nil, errors.New("project_id is required when task_id is not provided")
			}
			task, err := s.TaskRepo.GetByID(ctx, *in.TaskID)
			if err != nil {
				return nil, errors.New("task_id not found")
			}
			projectID = task.ProjectID
		}

		item := model.DailyUpdateItem{
			TaskID:              in.TaskID,
			ProjectID:           projectID,
			Action:              action,
			Comment:             in.Comment,
			NewTaskTitle:        strings.TrimSpace(in.NewTaskTitle),
			NewTaskDescription:  in.NewTaskDescription,
			NewTaskAssigneeID:   in.NewTaskAssigneeID,
		}

		if in.NewTaskDeadline != nil && strings.TrimSpace(*in.NewTaskDeadline) != "" {
			d, err := time.Parse("2006-01-02", *in.NewTaskDeadline)
			if err != nil {
				return nil, errors.New("new_task_deadline must be YYYY-MM-DD")
			}
			item.NewTaskDeadline = &d
		}

		if item.Action == "new_task" && item.NewTaskTitle == "" {
			return nil, errors.New("new_task_title is required when action is new_task")
		}
		items = append(items, item)
	}
	return items, nil
}

func (s *DailyUpdateService) createTasksFromItems(ctx context.Context, items []model.DailyUpdateItem) error {
	if s.TaskRepo == nil {
		return nil
	}

	for _, item := range items {
		if item.Action != "new_task" || strings.TrimSpace(item.NewTaskTitle) == "" {
			continue
		}
		if item.NewTaskAssigneeID == nil || *item.NewTaskAssigneeID == 0 {
			return errors.New("new_task_assignee_id is required for new_task action")
		}

		t := &model.Task{
			ProjectID:   item.ProjectID,
			Title:       item.NewTaskTitle,
			Description: item.NewTaskDescription,
			Deadline:    item.NewTaskDeadline,
			Status:      model.TaskToDo,
			AssigneeID:  *item.NewTaskAssigneeID,
		}
		if err := s.TaskRepo.Create(ctx, t); err != nil {
			return err
		}
	}

	return nil
}

func (s *DailyUpdateService) storeHistory(ctx context.Context, existing model.DailyUpdate, editedBy uint) error {
	itemsJSON, err := json.Marshal(existing.Items)
	if err != nil {
		return err
	}
	history := &model.DailyUpdateHistory{
		DailyUpdateID: existing.ID,
		EditedBy:      editedBy,
		Summary:       existing.Summary,
		HoursWorked:   existing.HoursWorked,
		ItemsJSON:     string(itemsJSON),
	}
	return s.Repo.CreateHistory(ctx, history)
}

func parseDailyDate(dateStr string) (time.Time, error) {
	if strings.TrimSpace(dateStr) == "" {
		now := time.Now().UTC()
		return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC), nil
	}
	t, err := time.Parse("2006-01-02", strings.TrimSpace(dateStr))
	if err != nil {
		return time.Time{}, errors.New("date must be YYYY-MM-DD")
	}
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC), nil
}

func isWeekday(t time.Time) bool {
	return t.Weekday() != time.Saturday && t.Weekday() != time.Sunday
}

func weekdaysBetween(from, to time.Time) []time.Time {
	out := make([]time.Time, 0)
	start := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(to.Year(), to.Month(), to.Day(), 0, 0, 0, 0, time.UTC)
	for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
		if isWeekday(d) {
			out = append(out, d)
		}
	}
	return out
}
