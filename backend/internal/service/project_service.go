package service

import (
	"errors"

	"github.com/industrial-attachment/office-management-backend/internal/dto"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"gorm.io/gorm"
)

type ProjectService interface {
	CreateProject(req *dto.CreateProjectRequest) (*dto.ProjectResponse, error)
	GetProjectByID(id uint) (*dto.ProjectResponse, error)
	UpdateProject(id uint, req *dto.UpdateProjectRequest) (*dto.ProjectResponse, error)
	DeleteProject(id uint) error
	ListProjects(page, pageSize int, status model.ProjectStatus, projectType model.ProjectType) ([]dto.ProjectResponse, int64, error)
}

type projectService struct {
	repo repository.ProjectRepository
}

func NewProjectService(repo repository.ProjectRepository) ProjectService {
	return &projectService{repo: repo}
}

func (s *projectService) CreateProject(req *dto.CreateProjectRequest) (*dto.ProjectResponse, error) {
	// Check for duplicate project name
	if _, err := s.repo.GetByName(req.Name); err == nil {
		return nil, errors.New("project with this name already exists")
	}

	// Validate end date is after start date
	if !req.EndDate.After(req.StartDate) {
		return nil, errors.New("end_date must be after start_date")
	}

	// Default status to Active if not provided
	status := req.Status
	if status == "" {
		status = model.ProjectStatusActive
	}

	project := &model.Project{
		Name:             req.Name,
		ShortDescription: req.ShortDescription,
		StartDate:        req.StartDate,
		EndDate:          req.EndDate,
		Status:           status,
		Type:             req.Type,
	}

	if err := s.repo.Create(project); err != nil {
		return nil, err
	}

	return toProjectResponse(project), nil
}

func (s *projectService) GetProjectByID(id uint) (*dto.ProjectResponse, error) {
	project, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}
	return toProjectResponse(project), nil
}

func (s *projectService) UpdateProject(id uint, req *dto.UpdateProjectRequest) (*dto.ProjectResponse, error) {
	project, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("project not found")
		}
		return nil, err
	}

	// Only apply fields that were explicitly sent (pointer != nil)
	if req.Name != nil {
		project.Name = *req.Name
	}
	if req.ShortDescription != nil {
		project.ShortDescription = *req.ShortDescription
	}
	if req.StartDate != nil {
		project.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		project.EndDate = *req.EndDate
	}
	if req.Status != nil {
		project.Status = *req.Status
	}
	if req.Type != nil {
		project.Type = *req.Type
	}

	// Validate date order after applying updates
	if !project.EndDate.After(project.StartDate) {
		return nil, errors.New("end_date must be after start_date")
	}

	if err := s.repo.Update(project); err != nil {
		return nil, err
	}

	return toProjectResponse(project), nil
}

func (s *projectService) DeleteProject(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("project not found")
		}
		return err
	}
	return s.repo.Delete(id)
}

func (s *projectService) ListProjects(page, pageSize int, status model.ProjectStatus, projectType model.ProjectType) ([]dto.ProjectResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	projects, total, err := s.repo.GetAll(page, pageSize, status, projectType)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]dto.ProjectResponse, len(projects))
	for i, p := range projects {
		responses[i] = *toProjectResponse(&p)
	}

	return responses, total, nil
}

func toProjectResponse(p *model.Project) *dto.ProjectResponse {
	return &dto.ProjectResponse{
		ID:               p.ID,
		Name:             p.Name,
		ShortDescription: p.ShortDescription,
		StartDate:        p.StartDate,
		EndDate:          p.EndDate,
		Status:           p.Status,
		Type:             p.Type,
		CreatedAt:        p.CreatedAt,
		UpdatedAt:        p.UpdatedAt,
	}
}

