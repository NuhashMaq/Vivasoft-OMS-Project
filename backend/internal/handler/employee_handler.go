package handler

import (
	"net/http"
	"strconv"

	"github.com/industrial-attachment/office-management-backend/internal/dto"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type EmployeeHandler struct {
	service service.EmployeeService
}

func NewEmployeeHandler(service service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{service: service}
}

// CreateEmployee handles POST /api/v1/employees
func (h *EmployeeHandler) CreateEmployee(c *gin.Context) {
	var req dto.CreateEmployeeRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee, err := h.service.CreateEmployee(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Employee created successfully",
		"data":    employee,
	})
}

// GetEmployee handles GET /api/v1/employees/:id
func (h *EmployeeHandler) GetEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	employee, err := h.service.GetEmployeeByID(uint(id))
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": employee})
}

// UpdateEmployee handles PUT /api/v1/employees/:id
func (h *EmployeeHandler) UpdateEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	var req dto.UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	employee, err := h.service.UpdateEmployee(uint(id), &req)
	if err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Employee updated successfully",
		"data":    employee,
	})
}

// DeleteEmployee handles DELETE /api/v1/employees/:id
func (h *EmployeeHandler) DeleteEmployee(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid employee ID"})
		return
	}

	if err := h.service.DeleteEmployee(uint(id)); err != nil {
		if err.Error() == "employee not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee deleted successfully"})
}

// ListEmployees handles GET /api/v1/employees
// Supports query params: page, page_size, department, status
func (h *EmployeeHandler) ListEmployees(c *gin.Context) {
	page := 1
	pageSize := 10

	if p := c.Query("page"); p != "" {
		if pageVal, err := strconv.Atoi(p); err == nil && pageVal > 0 {
			page = pageVal
		}
	}
	if ps := c.Query("page_size"); ps != "" {
		if psVal, err := strconv.Atoi(ps); err == nil && psVal > 0 {
			pageSize = psVal
		}
	}

	department := c.Query("department")
	status := model.EmploymentStatus(c.Query("status"))

	employees, total, err := h.service.ListEmployees(page, pageSize, department, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      employees,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

