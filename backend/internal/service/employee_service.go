package service

import (
	"errors"

	"github.com/industrial-attachment/office-management-backend/internal/dto"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/repository"
	"gorm.io/gorm"
)

type EmployeeService interface {
	CreateEmployee(req *dto.CreateEmployeeRequest) (*dto.EmployeeResponse, error)
	GetEmployeeByID(id uint) (*dto.EmployeeResponse, error)
	UpdateEmployee(id uint, req *dto.UpdateEmployeeRequest) (*dto.EmployeeResponse, error)
	DeleteEmployee(id uint) error
	ListEmployees(page, pageSize int, department string, status model.EmploymentStatus) ([]dto.EmployeeResponse, int64, error)
}

type employeeService struct {
	repo repository.EmployeeRepository
}

func NewEmployeeService(repo repository.EmployeeRepository) EmployeeService {
	return &employeeService{repo: repo}
}

func (s *employeeService) CreateEmployee(req *dto.CreateEmployeeRequest) (*dto.EmployeeResponse, error) {
	// Check for duplicate email
	if _, err := s.repo.GetByEmail(req.Email); err == nil {
		return nil, errors.New("employee with this email already exists")
	}

	// Default status to active if not provided
	status := req.Status
	if status == "" {
		status = model.EmploymentStatusActive
	}

	employee := &model.Employee{
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		Email:       req.Email,
		Phone:       req.Phone,
		Designation: req.Designation,
		Department:  req.Department,
		JoiningDate: req.JoiningDate,
		Status:      status,
	}

	if err := s.repo.Create(employee); err != nil {
		return nil, err
	}

	return toEmployeeResponse(employee), nil
}

func (s *employeeService) GetEmployeeByID(id uint) (*dto.EmployeeResponse, error) {
	employee, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("employee not found")
		}
		return nil, err
	}
	return toEmployeeResponse(employee), nil
}

func (s *employeeService) UpdateEmployee(id uint, req *dto.UpdateEmployeeRequest) (*dto.EmployeeResponse, error) {
	employee, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("employee not found")
		}
		return nil, err
	}

	// Only apply fields that were explicitly sent (pointer != nil)
	if req.FirstName != nil {
		employee.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		employee.LastName = *req.LastName
	}
	if req.Email != nil {
		employee.Email = *req.Email
	}
	if req.Phone != nil {
		employee.Phone = *req.Phone
	}
	if req.Designation != nil {
		employee.Designation = *req.Designation
	}
	if req.Department != nil {
		employee.Department = *req.Department
	}
	if req.JoiningDate != nil {
		employee.JoiningDate = *req.JoiningDate
	}
	if req.Status != nil {
		employee.Status = *req.Status
	}

	if err := s.repo.Update(employee); err != nil {
		return nil, err
	}

	return toEmployeeResponse(employee), nil
}

func (s *employeeService) DeleteEmployee(id uint) error {
	_, err := s.repo.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("employee not found")
		}
		return err
	}
	return s.repo.Delete(id)
}

func (s *employeeService) ListEmployees(page, pageSize int, department string, status model.EmploymentStatus) ([]dto.EmployeeResponse, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	employees, total, err := s.repo.GetAll(page, pageSize, department, status)
	if err != nil {
		return nil, 0, err
	}

	responses := make([]dto.EmployeeResponse, len(employees))
	for i, emp := range employees {
		responses[i] = *toEmployeeResponse(&emp)
	}

	return responses, total, nil
}

func toEmployeeResponse(e *model.Employee) *dto.EmployeeResponse {
	return &dto.EmployeeResponse{
		ID:          e.ID,
		FirstName:   e.FirstName,
		LastName:    e.LastName,
		Email:       e.Email,
		Phone:       e.Phone,
		Designation: e.Designation,
		Department:  e.Department,
		JoiningDate: e.JoiningDate,
		Status:      e.Status,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}

