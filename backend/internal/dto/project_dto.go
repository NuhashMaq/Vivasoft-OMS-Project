package dto

import (
	"time"

	"github.com/industrial-attachment/office-management-backend/internal/model"
)

// CreateProjectRequest is the payload for POST /api/v1/projects.
type CreateProjectRequest struct {
	Name             string              `json:"name" binding:"required"`
	ShortDescription string              `json:"short_description" binding:"required"`
	StartDate        time.Time           `json:"start_date" binding:"required"`
	EndDate          time.Time           `json:"end_date" binding:"required"`
	Status           model.ProjectStatus `json:"status" binding:"omitempty,oneof=Active Completed 'On Hold'"`
	Type             model.ProjectType   `json:"type" binding:"required,oneof=Client Internal R&D"`
}

// UpdateProjectRequest is the payload for PUT /api/v1/projects/:id.
// All fields are optional — only non-nil values will be applied.
type UpdateProjectRequest struct {
	Name             *string              `json:"name"`
	ShortDescription *string              `json:"short_description"`
	StartDate        *time.Time           `json:"start_date"`
	EndDate          *time.Time           `json:"end_date"`
	Status           *model.ProjectStatus `json:"status" binding:"omitempty,oneof=Active Completed 'On Hold'"`
	Type             *model.ProjectType   `json:"type" binding:"omitempty,oneof=Client Internal R&D"`
}

// ProjectResponse is the outbound representation of a project.
type ProjectResponse struct {
	ID               uint                `json:"id"`
	Name             string              `json:"name"`
	ShortDescription string              `json:"short_description"`
	StartDate        time.Time           `json:"start_date"`
	EndDate          time.Time           `json:"end_date"`
	Status           model.ProjectStatus `json:"status"`
	Type             model.ProjectType   `json:"type"`
	CreatedAt        time.Time           `json:"created_at"`
	UpdatedAt        time.Time           `json:"updated_at"`
}

