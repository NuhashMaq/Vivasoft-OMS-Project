package handler

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/industrial-attachment/office-management-backend/internal/model"
	"gorm.io/gorm"
)

type KpiHandler struct {
	db *gorm.DB
}

type KpiComponents struct {
	CompletionRate        float64 `json:"completion_rate"`
	DeadlineAdherence     float64 `json:"deadline_adherence"`
	AverageCompletionTime float64 `json:"average_completion_time"`
	TaskComplexity        float64 `json:"task_complexity"`
	TaskVolume            float64 `json:"task_volume"`
	WorkConsistency       float64 `json:"work_consistency"`
	ProductivityTrend     float64 `json:"productivity_trend"`
}

type KpiReport struct {
	ReportID   string        `json:"report_id"`
	EmployeeID string        `json:"employee_id"`
	ProjectID  string        `json:"project_id"`
	Score      float64       `json:"score"`
	Category   string        `json:"category"`
	Components KpiComponents `json:"components"`
}

func NewKpiHandler(db *gorm.DB) *KpiHandler {
	return &KpiHandler{db: db}
}

// GetReport builds a KPI report based on employee tasks and activity.
// GET /api/v1/kpi/report
func (h *KpiHandler) GetReport(c *gin.Context) {
	employeeID, err := h.resolveEmployeeID(c)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	components := h.computeComponents(employeeID)
	score := weightedScore(components)
	category := scoreCategory(score)

	report := KpiReport{
		ReportID:   "kpi-" + strconv.FormatInt(time.Now().UnixNano(), 10),
		EmployeeID: strconv.FormatUint(uint64(employeeID), 10),
		ProjectID:  "",
		Score:      score,
		Category:   category,
		Components: components,
	}

	c.JSON(http.StatusOK, report)
}

func (h *KpiHandler) resolveEmployeeID(c *gin.Context) (uint, error) {
	if raw := strings.TrimSpace(c.Query("employee_id")); raw != "" {
		id, err := strconv.ParseUint(raw, 10, 64)
		if err == nil && id > 0 {
			return uint(id), nil
		}
	}

	email := ""
	if v, ok := c.Get("email"); ok {
		email = strings.TrimSpace(fmt.Sprint(v))
	}
	if email == "" {
		return 0, gorm.ErrRecordNotFound
	}

	var employee model.Employee
	if err := h.db.Where("email = ?", email).First(&employee).Error; err != nil {
		return 0, err
	}
	return employee.ID, nil
}

func (h *KpiHandler) computeComponents(employeeID uint) KpiComponents {
	var total int64
	var done int64
	var doneOnTime int64
	var avgDescLen float64
	var avgCompletionSeconds float64

	_ = h.db.Model(&model.Task{}).Where("assignee_id = ?", employeeID).Count(&total).Error
	_ = h.db.Model(&model.Task{}).Where("assignee_id = ? AND status = ?", employeeID, model.TaskDone).Count(&done).Error
	_ = h.db.Model(&model.Task{}).Where("assignee_id = ? AND status = ? AND deadline IS NOT NULL AND completed_at IS NOT NULL AND completed_at <= deadline", employeeID, model.TaskDone).Count(&doneOnTime).Error
	_ = h.db.Model(&model.Task{}).Select("AVG(LENGTH(description))").Where("assignee_id = ?", employeeID).Scan(&avgDescLen).Error
	_ = h.db.Raw("SELECT COALESCE(AVG(EXTRACT(EPOCH FROM completed_at - started_at)), 0) FROM tasks WHERE assignee_id = ? AND completed_at IS NOT NULL AND started_at IS NOT NULL", employeeID).Scan(&avgCompletionSeconds).Error

	cutoff7 := time.Now().AddDate(0, 0, -7)
	cutoff14 := time.Now().AddDate(0, 0, -14)
	var doneRecent int64
	var donePrev int64
	_ = h.db.Model(&model.Task{}).Where("assignee_id = ? AND status = ? AND completed_at >= ?", employeeID, model.TaskDone, cutoff7).Count(&doneRecent).Error
	_ = h.db.Model(&model.Task{}).Where("assignee_id = ? AND status = ? AND completed_at >= ? AND completed_at < ?", employeeID, model.TaskDone, cutoff14, cutoff7).Count(&donePrev).Error

	completionRate := percent(done, total)
	deadlineAdherence := percent(doneOnTime, maxInt64(done, 1))
	avgHours := avgCompletionSeconds / 3600
	taskComplexity := clamp(30+(avgDescLen/4), 0, 100)
	taskVolume := clamp(float64(total)*8, 0, 100)
	workConsistency := percent(doneRecent, maxInt64(total, 1))
	trendDelta := float64(doneRecent - donePrev)
	productivityTrend := clamp(50+(trendDelta*10), 0, 100)

	return KpiComponents{
		CompletionRate:        completionRate,
		DeadlineAdherence:     deadlineAdherence,
		AverageCompletionTime: math.Round(avgHours*10) / 10,
		TaskComplexity:        taskComplexity,
		TaskVolume:            taskVolume,
		WorkConsistency:       workConsistency,
		ProductivityTrend:     productivityTrend,
	}
}

func percent(num, den int64) float64 {
	if den <= 0 {
		return 0
	}
	return math.Round((float64(num)/float64(den))*1000) / 10
}

func clamp(v, min, max float64) float64 {
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

func weightedScore(c KpiComponents) float64 {
	score :=
		c.CompletionRate*0.22 +
			c.DeadlineAdherence*0.18 +
			c.AverageCompletionTime*0.12 +
			c.TaskComplexity*0.10 +
			c.TaskVolume*0.12 +
			c.WorkConsistency*0.13 +
			c.ProductivityTrend*0.13
	return math.Round(clamp(score, 0, 100)*100) / 100
}

func scoreCategory(score float64) string {
	if score >= 80 {
		return "High"
	}
	if score >= 60 {
		return "Medium"
	}
	return "Low"
}

func maxInt64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}
