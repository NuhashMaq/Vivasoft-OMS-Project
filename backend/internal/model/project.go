package model

import (
	"time"

	"gorm.io/gorm"
)

type ProjectStatus string
type ProjectType string

const (
	ProjectStatusActive    ProjectStatus = "Active"
	ProjectStatusCompleted ProjectStatus = "Completed"
	ProjectStatusOnHold    ProjectStatus = "On Hold"
)

const (
	ProjectTypeClient   ProjectType = "Client"
	ProjectTypeInternal ProjectType = "Internal"
	ProjectTypeRnD      ProjectType = "R&D"
)

type Project struct {
	ID               uint           `gorm:"primaryKey" json:"id"`
	Name             string         `gorm:"uniqueIndex" json:"name"`
	ShortDescription string         `json:"short_description"`
	StartDate        time.Time      `json:"start_date"`
	EndDate          time.Time      `json:"end_date"`
	Status           ProjectStatus  `json:"status" gorm:"default:'Active'"`
	Type             ProjectType    `json:"type"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

