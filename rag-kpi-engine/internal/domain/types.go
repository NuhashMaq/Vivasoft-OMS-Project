package domain

import (
	"strings"
	"time"
)

type DocumentType string

const (
	// DocTypeTask stores knowledge extracted from task title/description.
	DocTypeTask        DocumentType = "TASK"
	// DocTypeDailyUpdate stores daily update comments/logs.
	DocTypeDailyUpdate DocumentType = "DAILY_UPDATE"
	// DocTypeUpdate is a backward-compatible alias accepted by the API.
	DocTypeUpdate      DocumentType = "UPDATE"
	// DocTypeWiki stores generated project wiki content.
	DocTypeWiki        DocumentType = "WIKI"
)

// NormalizeDocType maps incoming values into canonical document types.
func NormalizeDocType(docType DocumentType) DocumentType {
	normalized := strings.ToUpper(strings.TrimSpace(string(docType)))
	switch normalized {
	case "TASK":
		return DocTypeTask
	case "UPDATE", "DAILY_UPDATE":
		return DocTypeDailyUpdate
	case "WIKI":
		return DocTypeWiki
	default:
		return DocumentType(normalized)
	}
}

type SourceRef struct {
	DocType  DocumentType `json:"doc_type"`
	SourceID string       `json:"source_id"`
}

// IndexRequest represents incoming content that should be chunked and indexed.
type IndexRequest struct {
	ProjectID string       `json:"project_id"`
	DocType   DocumentType `json:"doc_type"`
	TaskID    string       `json:"task_id,omitempty"`
	SourceID  string       `json:"source_id"`
	Title     string       `json:"title"`
	Content   string       `json:"content"`
	UpdatedBy string       `json:"updated_by"`
}

// ChunkRecord is the normalized unit stored for retrieval.
type ChunkRecord struct {
	ChunkID    string
	ProjectID  string
	DocType    DocumentType
	TaskID     string
	SourceID   string
	Title      string
	Content    string
	ChunkIndex int
	Embedding  []float32
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// SearchRequest is a project-scoped natural-language retrieval request.
type SearchRequest struct {
	ProjectID string `json:"project_id"`
	Query     string `json:"query"`
	TopK      int    `json:"top_k"`
}

// SearchResult is the evidence package returned to callers.
type SearchResult struct {
	DocType    DocumentType `json:"doc_type"`
	SourceID   string       `json:"source_id"`
	Title      string       `json:"title"`
	Snippet    string       `json:"snippet"`
	RankScore  float64      `json:"rank_score"`
	LinkRef    string       `json:"link_ref"`
	ChunkID    string       `json:"chunk_id"`
	ProjectID  string       `json:"project_id"`
	Similarity float64      `json:"similarity"`
}

// SearchResponse wraps ranked results for a project-scoped query.
type SearchResponse struct {
	ProjectID string         `json:"project_id"`
	Query     string         `json:"query"`
	Results   []SearchResult `json:"results"`
}

// GroundedSummaryRequest asks for a concise summary generated from retrieved evidence only.
type GroundedSummaryRequest struct {
	ProjectID string `json:"project_id"`
	Query     string `json:"query"`
	TopK      int    `json:"top_k"`
}

// GroundedSummaryResponse returns summary text with explicit source evidence list.
type GroundedSummaryResponse struct {
	ProjectID   string       `json:"project_id"`
	Query       string       `json:"query"`
	Summary     string       `json:"summary"`
	SourcesUsed []SourceRef  `json:"sources_used"`
	Results     []SearchResult `json:"results"`
}

// KPIInput contains normalized KPI component signals for a single employee.
type KPIInput struct {
	EmployeeID            string  `json:"employee_id"`
	ProjectID             string  `json:"project_id"`
	CompletionRate        float64 `json:"completion_rate"`
	DeadlineAdherence     float64 `json:"deadline_adherence"`
	AverageCompletionTime float64 `json:"average_completion_time"`
	TaskComplexity        float64 `json:"task_complexity"`
	TaskVolume            float64 `json:"task_volume"`
	WorkConsistency       float64 `json:"work_consistency"`
	ProductivityTrend     float64 `json:"productivity_trend"`
	GeneratedBy           string  `json:"generated_by"`
}

// KPIComponentBreakdown stores the final scored component values used for reproducibility.
type KPIComponentBreakdown struct {
	CompletionRate        float64 `json:"completion_rate"`
	DeadlineAdherence     float64 `json:"deadline_adherence"`
	AverageCompletionTime float64 `json:"average_completion_time"`
	TaskComplexity        float64 `json:"task_complexity"`
	TaskVolume            float64 `json:"task_volume"`
	WorkConsistency       float64 `json:"work_consistency"`
	ProductivityTrend     float64 `json:"productivity_trend"`
}

// KPIReport contains the persisted KPI outcome for an employee.
type KPIReport struct {
	ReportID     string                `json:"report_id"`
	EmployeeID   string                `json:"employee_id"`
	ProjectID    string                `json:"project_id"`
	Score        float64               `json:"score"`
	Category     string                `json:"category"`
	Components   KPIComponentBreakdown `json:"components"`
	Insights     []string              `json:"insights,omitempty"`
	GeneratedAt  time.Time             `json:"generated_at"`
	GeneratedBy  string                `json:"generated_by"`
}

// BackupHealth represents admin-visible backup execution health.
type BackupHealth struct {
	BackupDate      time.Time `json:"backup_date"`
	Status          string    `json:"status"`
	StorageLocation string    `json:"storage_location"`
	Notes           string    `json:"notes,omitempty"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// AuditLogInput is used to store key governance actions.
type AuditLogInput struct {
	ActorID    string `json:"actor_id"`
	ActorRole  string `json:"actor_role"`
	ActionType string `json:"action_type"`
	ProjectID  string `json:"project_id,omitempty"`
	SourceID   string `json:"source_id,omitempty"`
	Details    string `json:"details,omitempty"`
}

// UserContext contains caller identity and role used by RBAC checks.
type UserContext struct {
	UserID string
	Role   string
}
