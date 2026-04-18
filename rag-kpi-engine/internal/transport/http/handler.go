package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"rag-kpi-engine/internal/app"
	"rag-kpi-engine/internal/domain"
	"rag-kpi-engine/internal/service"
	"rag-kpi-engine/internal/storage"
)

const (
	hdrUID  = "X-User-ID"
	hdrRole = "X-User-Role"
)

type taskDoneReq struct {
	ProjectID string `json:"project_id"`
	TaskID    string `json:"task_id"`
	Status    string `json:"status"`
}

type wikiReq struct {
	ProjectID string `json:"project_id"`
}

type wikiGenReq struct {
	ProjectID string `json:"project_id"`
	Actor     string `json:"actor"`
}

// Handler exposes HTTP endpoints for RAG + KPI features.
type Handler struct {
	indexer *service.Indexer
	search  *service.SearchService
	wiki    *service.WikiService
	kpi     *service.KPIService
	repo    *storage.PostgresRepository
}

// NewHandler creates an HTTP handler with all required services.
func NewHandler(indexer *service.Indexer, search *service.SearchService, wiki *service.WikiService, kpi *service.KPIService, repo *storage.PostgresRepository) *Handler {
	return &Handler{indexer: indexer, search: search, wiki: wiki, kpi: kpi, repo: repo}
}

func (h *Handler) Health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"status": "ok"})
}

func (h *Handler) IndexTask(w http.ResponseWriter, r *http.Request) {
	var req domain.IndexRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.DocType == "" {
		req.DocType = domain.DocTypeTask
	}
	req.DocType = domain.NormalizeDocType(req.DocType)
	if err := h.indexer.Index(r.Context(), req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"status": "indexed"})
}

func (h *Handler) IndexUpdate(w http.ResponseWriter, r *http.Request) {
	var req domain.IndexRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.DocType == "" {
		req.DocType = domain.DocTypeDailyUpdate
	}
	req.DocType = domain.NormalizeDocType(req.DocType)
	if err := h.indexer.Index(r.Context(), req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"status": "indexed"})
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	var req domain.SearchRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, ok := mustUser(w, r)
	if !ok {
		return
	}
	resp, err := h.search.Search(r.Context(), user, req)
	if err != nil {
		if errors.Is(err, app.ErrUnauthorized) {
			writeError(w, http.StatusForbidden, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) GroundedSummary(w http.ResponseWriter, r *http.Request) {
	var req domain.GroundedSummaryRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	user, ok := mustUser(w, r)
	if !ok {
		return
	}

	resp, err := h.search.GroundedSummary(r.Context(), user, req)
	if err != nil {
		if errors.Is(err, app.ErrUnauthorized) {
			writeError(w, http.StatusForbidden, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	_ = h.repo.InsertAuditLog(r.Context(), domain.AuditLogInput{
		ActorID:    user.UserID,
		ActorRole:  user.Role,
		ActionType: "GROUNDED_SUMMARY",
		ProjectID:  req.ProjectID,
		Details:    req.Query,
	})

	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) MarkWikiStale(w http.ResponseWriter, r *http.Request) {
	var req wikiReq
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.wiki.MarkStale(r.Context(), req.ProjectID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	u := userFromReq(r)
	_ = h.repo.InsertAuditLog(r.Context(), domain.AuditLogInput{
		ActorID:    u.UserID,
		ActorRole:  u.Role,
		ActionType: "WIKI_MARK_STALE",
		ProjectID:  req.ProjectID,
	})
	writeJSON(w, http.StatusAccepted, map[string]any{"status": "stale_marked"})
}

func (h *Handler) GenerateWiki(w http.ResponseWriter, r *http.Request) {
	var req wikiGenReq
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if req.Actor == "" {
		req.Actor = "system"
	}

	versionID, err := h.wiki.Regenerate(r.Context(), req.ProjectID, req.Actor)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	_ = h.repo.InsertAuditLog(r.Context(), domain.AuditLogInput{
		ActorID:    req.Actor,
		ActorRole:  "system",
		ActionType: "WIKI_GENERATED",
		ProjectID:  req.ProjectID,
		SourceID:   versionID,
	})

	writeJSON(w, http.StatusOK, map[string]any{"status": "generated", "version_id": versionID})
}

func (h *Handler) TaskStatusChanged(w http.ResponseWriter, r *http.Request) {
	var req taskDoneReq
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(req.ProjectID) == "" || strings.TrimSpace(req.TaskID) == "" {
		writeError(w, http.StatusBadRequest, "project_id and task_id are required")
		return
	}
	if !strings.EqualFold(strings.TrimSpace(req.Status), "Done") {
		writeJSON(w, http.StatusOK, map[string]any{"status": "ignored", "reason": "status is not Done"})
		return
	}
	if err := h.wiki.MarkStale(r.Context(), req.ProjectID); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	u := userFromReq(r)
	_ = h.repo.InsertAuditLog(r.Context(), domain.AuditLogInput{
		ActorID:    u.UserID,
		ActorRole:  u.Role,
		ActionType: "TASK_STATUS_DONE",
		ProjectID:  req.ProjectID,
		SourceID:   req.TaskID,
		Details:    "Task moved to Done",
	})
	writeJSON(w, http.StatusAccepted, map[string]any{"status": "stale_marked", "project_id": req.ProjectID, "task_id": req.TaskID})
}

func (h *Handler) ComputeKPI(w http.ResponseWriter, r *http.Request) {
	u, ok := mustUser(w, r)
	if !ok {
		return
	}
	if u.Role != "super_admin" {
		writeError(w, http.StatusForbidden, app.ErrKPIForbidden.Error())
		return
	}

	var in domain.KPIInput
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	in.GeneratedBy = u.UserID

	report, err := h.kpi.ComputeAndSave(r.Context(), in)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, report)
}

func (h *Handler) GetKPI(w http.ResponseWriter, r *http.Request) {
	employeeID := strings.TrimSpace(r.URL.Query().Get("employee_id"))
	if employeeID == "" {
		writeError(w, http.StatusBadRequest, "employee_id is required")
		return
	}

	viewer := domain.UserContext{
		UserID: strings.TrimSpace(r.Header.Get(hdrUID)),
		Role:   strings.ToLower(strings.TrimSpace(r.Header.Get(hdrRole))),
	}
	if viewer.UserID == "" {
		writeError(w, http.StatusUnauthorized, "missing "+hdrUID)
		return
	}

	report, err := h.kpi.GetLatestForViewer(r.Context(), viewer, employeeID)
	if err != nil {
		if errors.Is(err, app.ErrKPIForbidden) {
			writeError(w, http.StatusForbidden, err.Error())
			return
		}
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, report)
}

func (h *Handler) AuditLog(w http.ResponseWriter, r *http.Request) {
	var input domain.AuditLogInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if strings.TrimSpace(input.ActionType) == "" {
		writeError(w, http.StatusBadRequest, "action_type is required")
		return
	}
	u := userFromReq(r)
	if strings.TrimSpace(input.ActorID) == "" {
		input.ActorID = u.UserID
	}
	if strings.TrimSpace(input.ActorRole) == "" {
		input.ActorRole = u.Role
	}
	if err := h.repo.InsertAuditLog(r.Context(), input); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"status": "logged"})
}

func (h *Handler) UpdateBackupHealth(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(userFromReq(r).Role) {
		writeError(w, http.StatusForbidden, "admin or super_admin required")
		return
	}

	req := struct {
		BackupDate      string `json:"backup_date"`
		Status          string `json:"status"`
		StorageLocation string `json:"storage_location"`
		Notes           string `json:"notes"`
	}{}
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	backupDate, err := time.Parse("2006-01-02", req.BackupDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, "backup_date must be YYYY-MM-DD")
		return
	}

	health := domain.BackupHealth{
		BackupDate:      backupDate,
		Status:          req.Status,
		StorageLocation: req.StorageLocation,
		Notes:           req.Notes,
	}
	if err := h.repo.UpsertBackupHealth(r.Context(), health); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"status": "updated"})
}

func (h *Handler) GetBackupHealth(w http.ResponseWriter, r *http.Request) {
	if !isAdmin(userFromReq(r).Role) {
		writeError(w, http.StatusForbidden, "admin or super_admin required")
		return
	}
	health, err := h.repo.GetLatestBackupHealth(r.Context())
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, health)
}

func decodeJSON(r *http.Request, out any) error {
	return json.NewDecoder(r.Body).Decode(out)
}

func userFromReq(r *http.Request) domain.UserContext {
	return domain.UserContext{
		UserID: strings.TrimSpace(r.Header.Get(hdrUID)),
		Role:   strings.ToLower(strings.TrimSpace(r.Header.Get(hdrRole))),
	}
}

func mustUser(w http.ResponseWriter, r *http.Request) (domain.UserContext, bool) {
	u := userFromReq(r)
	if u.UserID == "" {
		writeError(w, http.StatusUnauthorized, "missing "+hdrUID)
		return domain.UserContext{}, false
	}
	return u, true
}

func isAdmin(role string) bool {
	return role == "admin" || role == "super_admin"
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
