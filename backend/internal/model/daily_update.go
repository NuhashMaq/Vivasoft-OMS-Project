package model

import "time"

type DailyUpdate struct {
	ID         uint              `json:"id" gorm:"primaryKey"`
	UserID     uint              `json:"user_id" gorm:"not null;index:idx_daily_user_date,unique"`
	UpdateDate time.Time         `json:"update_date" gorm:"type:date;not null;index:idx_daily_user_date,unique"`
	Summary    string            `json:"summary" gorm:"type:text;default:''"`
	HoursWorked *float64         `json:"hours_worked,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`

	Items []DailyUpdateItem `json:"items,omitempty" gorm:"foreignKey:DailyUpdateID;constraint:OnDelete:CASCADE"`
}

type DailyUpdateItem struct {
	ID            uint   `json:"id" gorm:"primaryKey"`
	DailyUpdateID uint   `json:"daily_update_id" gorm:"not null;index"`
	TaskID        *uint  `json:"task_id,omitempty" gorm:"index"`
	ProjectID     uint   `json:"project_id" gorm:"not null;index"`
	Action        string `json:"action" gorm:"type:varchar(32);not null"`
	Comment       string `json:"comment" gorm:"type:text;default:''"`

	NewTaskTitle       string  `json:"new_task_title,omitempty" gorm:"type:text;default:''"`
	NewTaskDescription string  `json:"new_task_description,omitempty" gorm:"type:text;default:''"`
	NewTaskAssigneeID  *uint   `json:"new_task_assignee_id,omitempty" gorm:"index"`
	NewTaskDeadline    *time.Time `json:"new_task_deadline,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type DailyUpdateHistory struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	DailyUpdateID uint      `json:"daily_update_id" gorm:"not null;index"`
	EditedBy      uint      `json:"edited_by" gorm:"not null;index"`
	Summary       string    `json:"summary" gorm:"type:text;default:''"`
	HoursWorked   *float64  `json:"hours_worked,omitempty"`
	ItemsJSON     string    `json:"items_json" gorm:"type:text;not null"`
	EditedAt      time.Time `json:"edited_at" gorm:"autoCreateTime"`
}

type DailyUpdateItemReq struct {
	TaskID               *uint   `json:"task_id"`
	ProjectID            uint    `json:"project_id"`
	Action               string  `json:"action"`
	Comment              string  `json:"comment"`
	NewTaskTitle         string  `json:"new_task_title"`
	NewTaskDescription   string  `json:"new_task_description"`
	NewTaskAssigneeID    *uint   `json:"new_task_assignee_id"`
	NewTaskDeadline      *string `json:"new_task_deadline"`
}

type UpsertDailyUpdateReq struct {
	Date       string               `json:"date"`
	Summary    string               `json:"summary"`
	HoursWorked *float64            `json:"hours_worked"`
	Updates    []DailyUpdateItemReq `json:"updates"`
}
