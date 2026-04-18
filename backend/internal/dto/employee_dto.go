package dto

import (
	"time"

	"github.com/industrial-attachment/office-management-backend/internal/model"
)

// CreateEmployeeRequest is the payload for POST /api/v1/employees.
type CreateEmployeeRequest struct {
	FirstName   string                 `json:"first_name" binding:"required"`
	LastName    string                 `json:"last_name" binding:"required"`
	Email       string                 `json:"email" binding:"required,email"`
	Phone       string                 `json:"phone" binding:"required"`
	Designation string                 `json:"designation" binding:"required"`
	Department  string                 `json:"department" binding:"required"`
	JoiningDate time.Time              `json:"joining_date" binding:"required"`
	Status      model.EmploymentStatus `json:"status" binding:"omitempty,oneof=active inactive"`
}

// UpdateEmployeeRequest is the payload for PUT /api/v1/employees/:id.
// All fields are optional — only non-zero values will be applied.
type UpdateEmployeeRequest struct {
	FirstName   *string                 `json:"first_name"`
	LastName    *string                 `json:"last_name"`
	Email       *string                 `json:"email" binding:"omitempty,email"`
	Phone       *string                 `json:"phone"`
	Designation *string                 `json:"designation"`
	Department  *string                 `json:"department"`
	JoiningDate *time.Time              `json:"joining_date"`
	Status      *model.EmploymentStatus `json:"status" binding:"omitempty,oneof=active inactive"`
}

// EmployeeResponse is the outbound representation of an employee.
type EmployeeResponse struct {
	ID          uint                   `json:"id"`
	FirstName   string                 `json:"first_name"`
	LastName    string                 `json:"last_name"`
	Email       string                 `json:"email"`
	Phone       string                 `json:"phone"`
	Designation string                 `json:"designation"`
	Department  string                 `json:"department"`
	JoiningDate time.Time              `json:"joining_date"`
	Status      model.EmploymentStatus `json:"status"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

