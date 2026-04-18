package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"rag-kpi-engine/internal/domain"

	"github.com/google/uuid"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// PostgresRepository provides persistence for indexing, retrieval, and wiki lifecycle.
type PostgresRepository struct {
	db *sql.DB
}

// SearchRow is an intermediate row representation used during retrieval merging.
type SearchRow struct {
	ChunkID    string
	ProjectID  string
	DocType    domain.DocumentType
	SourceID   string
	Title      string
	Content    string
	Similarity float64
}

// NewPostgresRepository creates a connection pool and verifies DB reachability.
func NewPostgresRepository(databaseURL string) (*PostgresRepository, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, err
	}
	db.SetConnMaxLifetime(30 * time.Minute)
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)
	if err = db.Ping(); err != nil {
		return nil, err
	}
	return &PostgresRepository{db: db}, nil
}

// Close releases all DB connections.
func (r *PostgresRepository) Close() error {
	return r.db.Close()
}

// CheckProjectAccess enforces project-level visibility by role/membership.
func (r *PostgresRepository) CheckProjectAccess(ctx context.Context, user domain.UserContext, projectID string) (bool, error) {
	if user.Role == "super_admin" || user.Role == "admin" {
		return true, nil
	}
	const q = `
		SELECT EXISTS(
			SELECT 1 FROM project_members
			WHERE project_id = $1 AND user_id = $2 AND is_active = true
		)
	`
	var ok bool
	err := r.db.QueryRowContext(ctx, q, projectID, user.UserID).Scan(&ok)
	return ok, err
}

// ReplaceSourceChunks incrementally reindexes a single source document.
// It deletes old chunks for the source, upserts source metadata, inserts new chunks,
// and records a REINDEX job event.
func (r *PostgresRepository) ReplaceSourceChunks(ctx context.Context, req domain.IndexRequest, chunks []domain.ChunkRecord) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err = tx.ExecContext(ctx, `
		DELETE FROM rag_chunks
		WHERE project_id = $1 AND doc_type = $2 AND source_id = $3
	`, req.ProjectID, string(req.DocType), req.SourceID); err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, `
		INSERT INTO rag_sources (project_id, doc_type, task_id, source_id, title, content, updated_by, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		ON CONFLICT (project_id, doc_type, source_id)
		DO UPDATE SET task_id = EXCLUDED.task_id, title = EXCLUDED.title, content = EXCLUDED.content, updated_by = EXCLUDED.updated_by, updated_at = NOW()
	`, req.ProjectID, string(req.DocType), req.TaskID, req.SourceID, req.Title, req.Content, req.UpdatedBy); err != nil {
		return err
	}

	for _, chunk := range chunks {
		if _, err = tx.ExecContext(ctx, `
			INSERT INTO rag_chunks (
				chunk_id, project_id, doc_type, task_id, source_id, title, content, chunk_index, embedding, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector, NOW(), NOW())
		`,
			chunk.ChunkID,
			chunk.ProjectID,
			string(chunk.DocType),
			chunk.TaskID,
			chunk.SourceID,
			chunk.Title,
			chunk.Content,
			chunk.ChunkIndex,
			toVectorLiteral(chunk.Embedding),
		); err != nil {
			return err
		}
	}

	if _, err = tx.ExecContext(ctx, `
		INSERT INTO rag_index_jobs (job_id, job_type, project_id, source_id, status, attempts, created_at, updated_at)
		VALUES ($1, 'REINDEX', $2, $3, 'SUCCESS', 1, NOW(), NOW())
	`, uuid.NewString(), req.ProjectID, req.SourceID); err != nil {
		return err
	}

	return tx.Commit()
}

// VectorSearch performs semantic retrieval using pgvector distance.
func (r *PostgresRepository) VectorSearch(ctx context.Context, projectID string, queryEmbedding []float32, topK int) ([]SearchRow, error) {
	q := `
		SELECT chunk_id, project_id, doc_type, source_id, title, content,
			(1 - (embedding <=> $2::vector)) AS similarity
		FROM rag_chunks
		WHERE project_id = $1
		ORDER BY embedding <=> $2::vector
		LIMIT $3
	`
	rows, err := r.db.QueryContext(ctx, q, projectID, toVectorLiteral(queryEmbedding), topK)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSearchRows(rows)
}

// KeywordSearch performs lexical retrieval using PostgreSQL full-text search.
func (r *PostgresRepository) KeywordSearch(ctx context.Context, projectID, query string, topK int) ([]SearchRow, error) {
	q := `
		SELECT chunk_id, project_id, doc_type, source_id, title, content,
			ts_rank_cd(search_vector, websearch_to_tsquery('english', $2)) AS similarity
		FROM rag_chunks
		WHERE project_id = $1
		  AND search_vector @@ websearch_to_tsquery('english', $2)
		ORDER BY similarity DESC
		LIMIT $3
	`
	rows, err := r.db.QueryContext(ctx, q, projectID, query, topK)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanSearchRows(rows)
}

// MarkWikiStale flips stale state and records a pending wiki-generation job.
func (r *PostgresRepository) MarkWikiStale(ctx context.Context, projectID string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO rag_wiki_state(project_id, is_stale, stale_marked_at, last_generated_at)
		VALUES ($1, true, NOW(), NULL)
		ON CONFLICT (project_id)
		DO UPDATE SET is_stale = true, stale_marked_at = NOW()
	`, projectID)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO rag_index_jobs (job_id, job_type, project_id, status, attempts, created_at, updated_at)
		VALUES ($1, 'WIKI_GEN', $2, 'PENDING', 0, NOW(), NOW())
	`, uuid.NewString(), projectID)
	return err
}

// ListStaleProjects returns oldest stale projects first for fair background processing.
func (r *PostgresRepository) ListStaleProjects(ctx context.Context, limit int) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT project_id
		FROM rag_wiki_state
		WHERE is_stale = true
		ORDER BY stale_marked_at ASC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []string
	for rows.Next() {
		var projectID string
		if err := rows.Scan(&projectID); err != nil {
			return nil, err
		}
		out = append(out, projectID)
	}
	return out, rows.Err()
}

// BuildProjectKnowledge composes a wiki-ready text body and source reference list.
func (r *PostgresRepository) BuildProjectKnowledge(ctx context.Context, projectID string) (string, []domain.SourceRef, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT doc_type, source_id, title, content
		FROM rag_sources
		WHERE project_id = $1
		ORDER BY updated_at DESC
		LIMIT 250
	`, projectID)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()

	var builder strings.Builder
	refs := make([]domain.SourceRef, 0, 250)
	for rows.Next() {
		var docType string
		var sourceID, title, content string
		if err := rows.Scan(&docType, &sourceID, &title, &content); err != nil {
			return "", nil, err
		}
		builder.WriteString("## ")
		builder.WriteString(title)
		builder.WriteString("\n")
		builder.WriteString(content)
		builder.WriteString("\n\n")
		refs = append(refs, domain.SourceRef{DocType: domain.DocumentType(docType), SourceID: sourceID})
	}
	return strings.TrimSpace(builder.String()), refs, rows.Err()
}

// CreateWikiVersion stores a new numeric wiki version for the project.
func (r *PostgresRepository) CreateWikiVersion(ctx context.Context, projectID string, content string, refs []domain.SourceRef) (string, error) {
	versionID := uuid.NewString()
	refsJSON, err := json.Marshal(refs)
	if err != nil {
		return "", err
	}
	_, err = r.db.ExecContext(ctx, `
		INSERT INTO rag_wiki_versions (version_id, project_id, version, content, source_refs, generated_at)
		SELECT $1, $2, COALESCE(MAX(version), 0) + 1, $3, $4::jsonb, NOW()
		FROM rag_wiki_versions
		WHERE project_id = $2
	`, versionID, projectID, content, string(refsJSON))
	if err != nil {
		return "", err
	}

	_, err = r.db.ExecContext(ctx, `
		UPDATE rag_wiki_state
		SET is_stale = false, last_generated_at = NOW()
		WHERE project_id = $1
	`, projectID)
	if err != nil {
		return "", err
	}
	return versionID, nil
}

// FetchLatestWikiVersion returns the latest version_id + content for a project.
func (r *PostgresRepository) FetchLatestWikiVersion(ctx context.Context, projectID string) (string, string, error) {
	var versionID, content string
	err := r.db.QueryRowContext(ctx, `
		SELECT version_id, content
		FROM rag_wiki_versions
		WHERE project_id = $1
		ORDER BY version DESC
		LIMIT 1
	`, projectID).Scan(&versionID, &content)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", "", nil
		}
		return "", "", err
	}
	return versionID, content, nil
}

func scanSearchRows(rows *sql.Rows) ([]SearchRow, error) {
	var results []SearchRow
	for rows.Next() {
		var row SearchRow
		if err := rows.Scan(&row.ChunkID, &row.ProjectID, &row.DocType, &row.SourceID, &row.Title, &row.Content, &row.Similarity); err != nil {
			return nil, err
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

// toVectorLiteral converts a float vector into pgvector literal format.
func toVectorLiteral(vector []float32) string {
	if len(vector) == 0 {
		return "[]"
	}
	parts := make([]string, 0, len(vector))
	for _, v := range vector {
		parts = append(parts, fmt.Sprintf("%f", v))
	}
	return fmt.Sprintf("[%s]", strings.Join(parts, ","))
}
