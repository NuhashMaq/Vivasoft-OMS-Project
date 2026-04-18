package model

import (
	"time"

	"gorm.io/gorm"
)

type EmploymentStatus string

const (
	EmploymentStatusActive   EmploymentStatus = "active"
	EmploymentStatusInactive EmploymentStatus = "inactive"
)

type Employee struct {
	ID           uint             `gorm:"primaryKey" json:"id"`
	FirstName    string           `json:"first_name"`
	LastName     string           `json:"last_name"`
	Email        string           `gorm:"uniqueIndex" json:"email"`
	Phone        string           `json:"phone"`
	Designation  string           `json:"designation"`
	Department   string           `json:"department"`
	JoiningDate  time.Time        `json:"joining_date"`
	Status       EmploymentStatus `json:"status" gorm:"default:'active'"`
	CreatedAt    time.Time        `json:"created_at"`
	UpdatedAt    time.Time        `json:"updated_at"`
	DeletedAt    gorm.DeletedAt   `gorm:"index" json:"-"`
}

