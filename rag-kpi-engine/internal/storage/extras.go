package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"time"

	"rag-kpi-engine/internal/domain"

	"github.com/google/uuid"
)

func (r *PostgresRepository) GetCachedSearch(ctx context.Context, projectID, query string, topK int) ([]domain.SearchResult, bool, error) {
	var payload string
	err := r.db.QueryRowContext(ctx, `
		SELECT response_payload
		FROM rag_query_cache
		WHERE project_id = $1 AND query_text = $2 AND top_k = $3 AND expires_at > NOW()
	`, projectID, query, topK).Scan(&payload)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, false, nil
		}
		return nil, false, err
	}
	var out []domain.SearchResult
	if err := json.Unmarshal([]byte(payload), &out); err != nil {
		return nil, false, err
	}
	return out, true, nil
}

func (r *PostgresRepository) SetCachedSearch(ctx context.Context, projectID, query string, topK int, results []domain.SearchResult, ttl time.Duration) error {
	payload, err := json.Marshal(results)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO rag_query_cache (project_id, query_text, top_k, response_payload, created_at, expires_at)
		VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW() + ($5 || ' seconds')::interval)
		ON CONFLICT (project_id, query_text, top_k)
		DO UPDATE SET response_payload = EXCLUDED.response_payload, created_at = NOW(), expires_at = EXCLUDED.expires_at
	`, projectID, query, topK, string(payload), int(ttl.Seconds()))
	return err
}

func (r *PostgresRepository) InsertAuditLog(ctx context.Context, in domain.AuditLogInput) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO rag_audit_logs (log_id, actor_id, actor_role, action_type, project_id, source_id, details, created_at)
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''), NOW())
	`, uuid.NewString(), in.ActorID, in.ActorRole, in.ActionType, in.ProjectID, in.SourceID, in.Details)
	return err
}

func (r *PostgresRepository) SaveKPIReport(ctx context.Context, report domain.KPIReport) error {
	components, err := json.Marshal(report.Components)
	if err != nil {
		return err
	}
	insights, err := json.Marshal(report.Insights)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO kpi_reports (
			report_id, employee_id, project_id, score, category, components, insights, generated_by, generated_at
		) VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6::jsonb, $7::jsonb, $8, NOW())
	`, report.ReportID, report.EmployeeID, report.ProjectID, report.Score, report.Category, string(components), string(insights), report.GeneratedBy)
	return err
}

func (r *PostgresRepository) GetLatestKPIReport(ctx context.Context, employeeID string) (domain.KPIReport, error) {
	var report domain.KPIReport
	var componentsJSON string
	var insightsJSON string
	err := r.db.QueryRowContext(ctx, `
		SELECT report_id, employee_id, COALESCE(project_id, ''), score, category, components, insights, generated_by, generated_at
		FROM kpi_reports
		WHERE employee_id = $1
		ORDER BY generated_at DESC
		LIMIT 1
	`, employeeID).Scan(
		&report.ReportID,
		&report.EmployeeID,
		&report.ProjectID,
		&report.Score,
		&report.Category,
		&componentsJSON,
		&insightsJSON,
		&report.GeneratedBy,
		&report.GeneratedAt,
	)
	if err != nil {
		return domain.KPIReport{}, err
	}
	if err := json.Unmarshal([]byte(componentsJSON), &report.Components); err != nil {
		return domain.KPIReport{}, err
	}
	if insightsJSON != "" {
		_ = json.Unmarshal([]byte(insightsJSON), &report.Insights)
	}
	return report, nil
}

func (r *PostgresRepository) UpsertBackupHealth(ctx context.Context, health domain.BackupHealth) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO admin_backup_health (backup_date, status, storage_location, notes, updated_at)
		VALUES ($1::date, $2, $3, NULLIF($4, ''), NOW())
		ON CONFLICT (backup_date)
		DO UPDATE SET status = EXCLUDED.status, storage_location = EXCLUDED.storage_location, notes = EXCLUDED.notes, updated_at = NOW()
	`, health.BackupDate, health.Status, health.StorageLocation, health.Notes)
	return err
}

func (r *PostgresRepository) GetLatestBackupHealth(ctx context.Context) (domain.BackupHealth, error) {
	var out domain.BackupHealth
	err := r.db.QueryRowContext(ctx, `
		SELECT backup_date, status, storage_location, COALESCE(notes, ''), updated_at
		FROM admin_backup_health
		ORDER BY backup_date DESC
		LIMIT 1
	`).Scan(&out.BackupDate, &out.Status, &out.StorageLocation, &out.Notes, &out.UpdatedAt)
	if err != nil {
		return domain.BackupHealth{}, err
	}
	return out, nil
}
