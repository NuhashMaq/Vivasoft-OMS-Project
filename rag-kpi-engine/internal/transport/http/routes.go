package http

import "net/http"

const corsHeaders = "Content-Type, X-User-ID, X-User-Role"

// NewRouter wires all API routes for the RAG engine.
func NewRouter(h *Handler) http.Handler {
	mux := http.NewServeMux()

	// Health + indexing routes.
	mux.HandleFunc("GET /health", h.Health)
	mux.HandleFunc("POST /v1/index/task", h.IndexTask)
	mux.HandleFunc("POST /v1/index/update", h.IndexUpdate)

	// Task-event + retrieval routes.
	mux.HandleFunc("POST /v1/tasks/status-changed", h.TaskStatusChanged)
	mux.HandleFunc("POST /v1/search", h.Search)
	mux.HandleFunc("POST /v1/search/grounded-summary", h.GroundedSummary)

	// KPI routes.
	mux.HandleFunc("POST /v1/kpi/compute", h.ComputeKPI)
	mux.HandleFunc("GET /v1/kpi/report", h.GetKPI)

	// Wiki lifecycle routes.
	mux.HandleFunc("POST /v1/wiki/mark-stale", h.MarkWikiStale)
	mux.HandleFunc("POST /v1/wiki/generate", h.GenerateWiki)

	// Governance routes.
	mux.HandleFunc("POST /v1/admin/audit", h.AuditLog)
	mux.HandleFunc("POST /v1/admin/backup-health", h.UpdateBackupHealth)
	mux.HandleFunc("GET /v1/admin/backup-health", h.GetBackupHealth)
	return cors(mux)
}

// cors applies minimal CORS policy for browser clients.
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", corsHeaders)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
