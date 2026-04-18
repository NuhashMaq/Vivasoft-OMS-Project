package repository

import (
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

type EmployeeRepository interface {
	Create(employee *model.Employee) error
	GetByID(id uint) (*model.Employee, error)
	GetByEmail(email string) (*model.Employee, error)
	Update(employee *model.Employee) error
	Delete(id uint) error
	GetAll(page, pageSize int, department string, status model.EmploymentStatus) ([]model.Employee, int64, error)
}

type employeeRepository struct {
	db *gorm.DB
}

func NewEmployeeRepository(db *gorm.DB) EmployeeRepository {
	return &employeeRepository{db: db}
}

func (r *employeeRepository) Create(employee *model.Employee) error {
	return r.db.Create(employee).Error
}

func (r *employeeRepository) GetByID(id uint) (*model.Employee, error) {
	var employee model.Employee
	if err := r.db.First(&employee, id).Error; err != nil {
		return nil, err
	}
	return &employee, nil
}

func (r *employeeRepository) GetByEmail(email string) (*model.Employee, error) {
	var employee model.Employee
	if err := r.db.Where("email = ?", email).First(&employee).Error; err != nil {
		return nil, err
	}
	return &employee, nil
}

func (r *employeeRepository) Update(employee *model.Employee) error {
	return r.db.Save(employee).Error
}

func (r *employeeRepository) Delete(id uint) error {
	return r.db.Delete(&model.Employee{}, id).Error
}

func (r *employeeRepository) GetAll(page, pageSize int, department string, status model.EmploymentStatus) ([]model.Employee, int64, error) {
	var employees []model.Employee
	var total int64

	query := r.db.Model(&model.Employee{})

	// Apply optional filters
	if department != "" {
		query = query.Where("department = ?", department)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&employees).Error; err != nil {
		return nil, 0, err
	}

	return employees, total, nil
}

