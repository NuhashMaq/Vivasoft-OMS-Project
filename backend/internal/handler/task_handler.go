package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"github.com/industrial-attachment/office-management-backend/internal/service"
)

type TaskHandler struct {
	Service      *service.TaskService
	ragEngineURL string
}

func NewTaskHandler(svc *service.TaskService, ragEngineURL string) *TaskHandler {
	return &TaskHandler{Service: svc, ragEngineURL: strings.TrimRight(ragEngineURL, "/")}
}

// CreateTask creates a new task
// POST /api/v1/projects/:project_id/tasks
func (h *TaskHandler) CreateTask(c *gin.Context) {
	projectID64, err := strconv.ParseUint(c.Param("project_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	var req model.CreateTaskReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	task, fields, err := h.Service.Create(c.Request.Context(), uint(projectID64), req)
	if err != nil {
		if err.Error() == "validation" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "validation failed", "fields": fields})
			return
		}
		if err.Error() == "cannot assign task to inactive employee" || err.Error() == "assignee employee not found" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		return
	}

	c.JSON(http.StatusCreated, task)
}

// GetTask retrieves a single task by ID
// GET /api/v1/tasks/:id
func (h *TaskHandler) GetTask(c *gin.Context) {
	taskID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	task, err := h.Service.GetByID(c.Request.Context(), uint(taskID64))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// ListTasksByProject lists all tasks in a project
// GET /api/v1/projects/:project_id/tasks
func (h *TaskHandler) ListTasksByProject(c *gin.Context) {
	projectID64, err := strconv.ParseUint(c.Param("project_id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
		return
	}

	tasks, err := h.Service.ListByProject(c.Request.Context(), uint(projectID64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

// UpdateTask updates task title, description, deadline, and assignee
// PUT /api/v1/tasks/:id
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	taskID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	var req model.UpdateTaskReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	updated, err := h.Service.Update(c.Request.Context(), uint(taskID64), req)
	if err != nil {
		switch err.Error() {
		case "task not found":
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		case "cannot assign task to inactive employee", "assignee employee not found", "invalid deadline format":
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		}
		return
	}

	c.JSON(http.StatusOK, updated)
}

func (h *TaskHandler) notifyRAGTaskDone(projectID, taskID uint, status string) {
	endpoint := h.ragEngineURL + "/v1/tasks/status-changed"
	payload := map[string]string{
		"project_id": strconv.FormatUint(uint64(projectID), 10),
		"task_id":    strconv.FormatUint(uint64(taskID), 10),
		"status":     status,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 3 * time.Second}
	_, _ = client.Do(req)
}

// DeleteTask deletes a task
// DELETE /api/v1/tasks/:id
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	taskID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	err = h.Service.Delete(c.Request.Context(), uint(taskID64))
	if err != nil {
		switch err.Error() {
		case "task not found":
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "task deleted successfully"})
}

// UpdateTaskStatus updates task status
// PUT /api/v1/tasks/:id/status
func (h *TaskHandler) UpdateTaskStatus(c *gin.Context) {
	taskID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	currentTask, err := h.Service.GetByID(c.Request.Context(), uint(taskID64))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}
	wasDone := currentTask.Status == model.TaskDone

	var req model.UpdateTaskStatusReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	roleValue, _ := c.Get("role")
	role, _ := roleValue.(string)
	canBackward := role == model.RoleAdmin || role == model.RoleManager

	updated, err := h.Service.UpdateStatus(c.Request.Context(), uint(taskID64), req.Status, canBackward, req.Reason)
	if err != nil {
		switch err.Error() {
		case "invalid_status":
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status"})
		case "invalid_transition":
			c.JSON(http.StatusConflict, gin.H{"error": "invalid transition"})
		case "forbidden_backward":
			c.JSON(http.StatusForbidden, gin.H{"error": "not allowed"})
		case "reason_required":
			c.JSON(http.StatusBadRequest, gin.H{"error": "reason required for backward move"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		}
		return
	}

	c.JSON(http.StatusOK, updated)

	if !wasDone && updated.Status == model.TaskDone && h.ragEngineURL != "" {
		go h.notifyRAGTaskDone(updated.ProjectID, updated.ID, string(updated.Status))
	}
}

// GetTaskHistory returns status transition history for a task.
// GET /api/v1/tasks/:id/history
func (h *TaskHandler) GetTaskHistory(c *gin.Context) {
	taskID64, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
		return
	}

	history, err := h.Service.ListHistory(c.Request.Context(), uint(taskID64))
	if err != nil {
		switch err.Error() {
		case "task not found":
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "server error"})
		}
		return
	}

	c.JSON(http.StatusOK, history)
}

