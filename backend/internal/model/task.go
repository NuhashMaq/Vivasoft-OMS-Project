package model

import "time"

type TaskStatus string

const (
	TaskToDo       TaskStatus = "To Do"
	TaskInProgress TaskStatus = "In Progress"
	TaskDone       TaskStatus = "Done"
)

type Task struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	ProjectID   uint       `json:"project_id" gorm:"not null;index"`
	Title       string     `json:"title" gorm:"not null"`
	Description string     `json:"description" gorm:"type:text;default:''"`
	Deadline    *time.Time `json:"deadline,omitempty"`

	Status     TaskStatus `json:"status" gorm:"type:varchar(20);not null;default:'To Do'"`
	AssigneeID uint       `json:"assignee_id" gorm:"not null;index"`

	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

// DTOs (requests)
type CreateTaskReq struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description"`
	Deadline    *string `json:"deadline"` // YYYY-MM-DD
	AssigneeID  uint    `json:"assignee_id" binding:"required"`
}

// UpdateTaskReq is used to update task details (title, description, deadline, assignee)
type UpdateTaskReq struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Deadline    *string `json:"deadline"` // YYYY-MM-DD
	AssigneeID  *uint   `json:"assignee_id"`
}

type UpdateTaskStatusReq struct {
	Status TaskStatus `json:"status" binding:"required"`
	Reason string     `json:"reason"`
}

