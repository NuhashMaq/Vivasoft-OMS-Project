package service

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"rag-kpi-engine/internal/app"
	"rag-kpi-engine/internal/domain"
	"rag-kpi-engine/internal/storage"

	"github.com/google/uuid"
)

// KPIService computes and stores KPI reports.
type KPIService struct {
	repo          *storage.PostgresRepository
	enableInsights bool
}

func NewKPIService(repo *storage.PostgresRepository, enableInsights bool) *KPIService {
	return &KPIService{repo: repo, enableInsights: enableInsights}
}

// ComputeAndSave calculates KPI score/category/components and persists a report.
func (k *KPIService) ComputeAndSave(ctx context.Context, in domain.KPIInput) (domain.KPIReport, error) {
	if strings.TrimSpace(in.EmployeeID) == "" {
		return domain.KPIReport{}, fmt.Errorf("employee_id is required")
	}

	components := domain.KPIComponentBreakdown{
		CompletionRate:        clamp100(in.CompletionRate),
		DeadlineAdherence:     clamp100(in.DeadlineAdherence),
		AverageCompletionTime: invertTimeToScore(in.AverageCompletionTime),
		TaskComplexity:        clamp100(in.TaskComplexity),
		TaskVolume:            clamp100(in.TaskVolume),
		WorkConsistency:       clamp100(in.WorkConsistency),
		ProductivityTrend:     clamp100(in.ProductivityTrend),
	}

	score := weightedScore(components)
	category := categorize(score)
	report := domain.KPIReport{
		ReportID:    uuid.NewString(),
		EmployeeID:  in.EmployeeID,
		ProjectID:   in.ProjectID,
		Score:       score,
		Category:    category,
		Components:  components,
		GeneratedAt: time.Now().UTC(),
		GeneratedBy: in.GeneratedBy,
	}
	if report.GeneratedBy == "" {
		report.GeneratedBy = "system"
	}
	if k.enableInsights {
		report.Insights = generateInsights(report)
	}

	if err := k.repo.SaveKPIReport(ctx, report); err != nil {
		return domain.KPIReport{}, err
	}
	_ = k.repo.InsertAuditLog(ctx, domain.AuditLogInput{
		ActorID:    report.GeneratedBy,
		ActorRole:  "super_admin",
		ActionType: "KPI_GENERATED",
		ProjectID:  report.ProjectID,
		SourceID:   report.EmployeeID,
		Details:    fmt.Sprintf("score=%.2f category=%s", report.Score, report.Category),
	})
	return report, nil
}

// GetLatestForViewer enforces FR-074 visibility control.
func (k *KPIService) GetLatestForViewer(ctx context.Context, viewer domain.UserContext, employeeID string) (domain.KPIReport, error) {
	if strings.ToLower(strings.TrimSpace(viewer.Role)) != "super_admin" {
		return domain.KPIReport{}, app.ErrKPIForbidden
	}
	return k.repo.GetLatestKPIReport(ctx, employeeID)
}

func clamp100(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 100 {
		return 100
	}
	return v
}

// invertTimeToScore converts average completion time into a 0-100 quality score.
func invertTimeToScore(hours float64) float64 {
	if hours <= 0 {
		return 100
	}
	// 0h => 100 score, 40h => 0 score, clamp outside range.
	score := 100 - ((hours / 40.0) * 100.0)
	return clamp100(score)
}

func weightedScore(c domain.KPIComponentBreakdown) float64 {
	score :=
		c.CompletionRate*0.22 +
			c.DeadlineAdherence*0.18 +
			c.AverageCompletionTime*0.12 +
			c.TaskComplexity*0.10 +
			c.TaskVolume*0.12 +
			c.WorkConsistency*0.13 +
			c.ProductivityTrend*0.13
	return math.Round(clamp100(score)*100) / 100
}

func categorize(score float64) string {
	if score >= 80 {
		return "High"
	}
	if score >= 60 {
		return "Medium"
	}
	return "Low"
}

func generateInsights(report domain.KPIReport) []string {
	insights := []string{}
	if report.Components.DeadlineAdherence < 60 {
		insights = append(insights, "Deadline adherence is below target; consider smaller planning slices.")
	}
	if report.Components.WorkConsistency < 60 {
		insights = append(insights, "Work consistency is unstable; recommend weekly workload balancing.")
	}
	if report.Components.ProductivityTrend < 60 {
		insights = append(insights, "Productivity trend is declining; review blockers and support needs.")
	}
	if len(insights) == 0 {
		insights = append(insights, "Performance trend is stable; continue current execution pattern.")
	}
	return insights
}
