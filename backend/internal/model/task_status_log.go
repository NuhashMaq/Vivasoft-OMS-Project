package model

import "time"

type TaskStatusLog struct {
	ID         uint       `json:"id" gorm:"primaryKey"`
	TaskID     uint       `json:"task_id" gorm:"not null;index"`
	FromStatus *TaskStatus `json:"from_status,omitempty" gorm:"type:varchar(20)"`
	ToStatus   TaskStatus `json:"to_status" gorm:"type:varchar(20);not null"`
	ChangedBy  uint       `json:"changed_by" gorm:"not null;index"`
	Comment    string     `json:"comment" gorm:"type:text;default:''"`
	CreatedAt  time.Time  `json:"created_at"`
}
