package handler

import (
	"net/http"
	"strconv"

	"github.com/industrial-attachment/office-management-backend/internal/dto"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/service"
	"github.com/gin-gonic/gin"
)

type ProjectHandler struct {
	service service.ProjectService
}

func NewProjectHandler(service service.ProjectService) *ProjectHandler {
	return &ProjectHandler{service: service}
}

// CreateProject handles POST /api/v1/projects
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	var req dto.CreateProjectRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.service.CreateProject(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"data":    project,
	})
}

// GetProject handles GET /api/v1/projects/:project_id
func (h *ProjectHandler) GetProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	project, err := h.service.GetProjectByID(uint(id))
	if err != nil {
		if err.Error() == "project not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": project})
}

// UpdateProject handles PUT /api/v1/projects/:project_id
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req dto.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.service.UpdateProject(uint(id), &req)
	if err != nil {
		if err.Error() == "project not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project updated successfully",
		"data":    project,
	})
}

// DeleteProject handles DELETE /api/v1/projects/:project_id
func (h *ProjectHandler) DeleteProject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("project_id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.service.DeleteProject(uint(id)); err != nil {
		if err.Error() == "project not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// ListProjects handles GET /api/v1/projects
// Supports query params: page, page_size, status, type
func (h *ProjectHandler) ListProjects(c *gin.Context) {
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

	status := model.ProjectStatus(c.Query("status"))
	projectType := model.ProjectType(c.Query("type"))

	projects, total, err := h.service.ListProjects(page, pageSize, status, projectType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      projects,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

