# Frontend Integration Guide (Simple)

This guide is written for frontend developers who want to use the RAG KPI Engine without backend complexity.

## What you will get in UI

- AI search inside one project
- Grounded summary (answer + source list)
- Wiki regenerate controls (admin screens)
- KPI screens (super admin only)
- Backup health and audit screens (admin/super admin)

## Important rule (must understand first)

Frontend should call OMS backend APIs.
Do not call RAG engine directly from browser in production.

Flow:

- Frontend -> OMS Backend -> RAG KPI ENGINE

Why:

- Keeps tokens/secrets safe
- Keeps role checks centralized
- Keeps architecture clean

## Required identity headers (backend passes these)

For protected endpoints, requests must include:

- X-User-ID
- X-User-Role

Roles used:

- employee
- admin
- super_admin

---

## Sequential steps for frontend team

### 1) Service status check

When app opens, call health status endpoint through backend.

- Endpoint: GET /health
- If not healthy: show "AI service unavailable" in UI and disable AI actions.

### 2) Normal task/update flow (automatic indexing)

Frontend does normal create/update operations.
Backend will send indexing events to RAG engine.

- Task create/update -> POST /v1/index/task
- Daily update/comment save -> POST /v1/index/update

Frontend does not need a manual "index now" button.

### 3) Task done event (wiki stale)

When user changes task status to Done, backend should notify RAG engine:

- POST /v1/tasks/status-changed

Result:

- Project wiki becomes stale and waits for regeneration.

### 4) Search page

Create a simple form:

- project selector
- query input
- optional top_k

On submit, backend calls:

- POST /v1/search

Render list items with:

- title
- snippet
- source_id
- link_ref

### 5) Grounded summary button

Add a button like "Summarize with sources".

Backend calls:

- POST /v1/search/grounded-summary

Render:

- summary text
- sources_used list
- result evidence below summary

### 6) Wiki controls (admin / super admin pages)

Add 2 simple actions:

- Mark stale -> POST /v1/wiki/mark-stale
- Regenerate now -> POST /v1/wiki/generate

Use these as admin tools, not everyday employee actions.

### 7) KPI screens (super admin only)

For super admin:

- Compute report -> POST /v1/kpi/compute
- Load latest report -> GET /v1/kpi/report?employee_id={id}

UI rules:

- Hide KPI screens for non-super_admin.

### 8) Governance screens (admin / super admin)

- Log important admin actions -> POST /v1/admin/audit
- Show latest backup health -> GET /v1/admin/backup-health
- Update backup status -> POST /v1/admin/backup-health

---

## Minimum UI checklist

- Search input + result list
- Grounded summary panel
- Source chips/links
- Loading state
- Empty state
- Error state (service unavailable / forbidden / bad request)
- Role-based visibility for admin/KPI pages

## Common errors and what to show

- 401: "User identity missing. Please sign in again."
- 403: "You do not have permission for this action."
- 400: "Request is invalid. Please check input."
- 500: "Server error. Please try again."

## Quick endpoint list for frontend planning

Core:

- GET /health
- POST /v1/search
- POST /v1/search/grounded-summary

Lifecycle:

- POST /v1/tasks/status-changed
- POST /v1/wiki/mark-stale
- POST /v1/wiki/generate

KPI:

- POST /v1/kpi/compute
- GET /v1/kpi/report?employee_id={id}

Governance:

- POST /v1/admin/audit
- GET /v1/admin/backup-health
- POST /v1/admin/backup-health

## Detailed frontend API contract table

Use this as the implementation checklist for each screen/action.

| UI Feature | OMS Backend Route (Frontend calls this) | RAG Engine Route (Backend calls this) | Method | Minimum Request Data | Success Response (important fields) | Who can use |
|---|---|---|---|---|---|---|
| Engine health badge | `/api/ai/health` | `/health` | GET | None | `status` | everyone |
| Project search | `/api/ai/search` | `/v1/search` | POST | `project_id`, `query`, `top_k` | `results[]` (`title`, `snippet`, `source_id`, `link_ref`) | employee/admin/super_admin |
| Grounded summary | `/api/ai/search/summary` | `/v1/search/grounded-summary` | POST | `project_id`, `query`, `top_k` | `summary`, `sources_used[]`, `results[]` | employee/admin/super_admin |
| Task create/update indexing (auto) | existing task API | `/v1/index/task` | POST | `project_id`, `source_id`, `title`, `content` (+ optional `task_id`) | `status=indexed` | backend system flow |
| Daily update indexing (auto) | existing update API | `/v1/index/update` | POST | `project_id`, `source_id`, `content` (+ optional `task_id`) | `status=indexed` | backend system flow |
| Task moved to Done (auto) | existing task status API | `/v1/tasks/status-changed` | POST | `project_id`, `task_id`, `status=Done` | `status=stale_marked` | backend system flow |
| Mark wiki stale (manual admin action) | `/api/ai/wiki/stale` | `/v1/wiki/mark-stale` | POST | `project_id` | `status=stale_marked` | admin/super_admin |
| Regenerate wiki now | `/api/ai/wiki/generate` | `/v1/wiki/generate` | POST | `project_id`, `actor` | `status=generated`, `version_id` | admin/super_admin |
| Compute KPI | `/api/ai/kpi/compute` | `/v1/kpi/compute` | POST | `employee_id` + KPI metrics | `score`, `category`, `components` | super_admin |
| Get latest KPI | `/api/ai/kpi/report?employee_id={id}` | `/v1/kpi/report?employee_id={id}` | GET | `employee_id` query | KPI report object | super_admin |
| Write audit log | `/api/admin/audit` | `/v1/admin/audit` | POST | `action_type` (+ optional project/source/details) | `status=logged` | admin/super_admin |
| Read backup health | `/api/admin/backup-health` | `/v1/admin/backup-health` | GET | None | `backup_date`, `status`, `storage_location` | admin/super_admin |
| Update backup health | `/api/admin/backup-health` | `/v1/admin/backup-health` | POST | `backup_date`, `status`, `storage_location`, `notes` | `status=updated` | admin/super_admin |

Notes:

- The OMS backend route names above are suggested. Your backend team may keep different naming.
- Frontend should not call RAG routes directly in production.
- Backend must pass identity headers to RAG: `X-User-ID`, `X-User-Role`.

## How to connect OMS backend to RAG engine

Frontend team should coordinate these 4 backend settings with the backend team:

1) Add base URL in OMS backend environment

- `RAG_ENGINE_BASE_URL=http://localhost:8085`

2) Backend proxy pattern

- Frontend calls OMS backend route (example: `/api/ai/search`)
- OMS backend forwards request to RAG endpoint (example: `/v1/search`)

3) Forward user identity from OMS session to RAG headers

- `X-User-ID: {currentUserId}`
- `X-User-Role: {currentUserRole}`

4) Keep secrets only in backend

- Never expose HF token, DB URL, or internal service URLs in frontend code.

## How frontend team runs this locally (step-by-step)

These are the exact steps for local development with frontend + OMS backend + RAG engine.

### A) Start database (once)

- Run PostgreSQL with pgvector enabled.
- Ensure a local DB exists for RAG engine.

### B) Run RAG engine

1. Open terminal in `Office-Management-Backend/RAG KPI ENGINE`
2. Create env file: copy `.env.example` -> `.env`
3. Set at least:
	- `DATABASE_URL`
	- `HF_MODEL_ID` (default is fine)
	- `HF_API_TOKEN` (optional, recommended)
4. Run migrations in order:
	- `migrations/001_rag_engine_init.sql`
	- `migrations/002_rag_task_id_and_daily_update_alias.sql`
	- `migrations/003_rag_wiki_numeric_version.sql`
	- `migrations/004_kpi_rag_governance.sql`
5. Start service:
	- `go mod tidy`
	- `go run ./cmd/server`
6. Verify:
	- Open `http://localhost:8085/health`
	- Expect: `{"status":"ok"}`

### C) Run OMS backend

1. Set OMS backend env to connect RAG:
	- `RAG_ENGINE_BASE_URL=http://localhost:8085`
2. Start OMS backend as usual.
3. Confirm OMS backend can hit RAG health route.

### D) Run frontend

1. Start frontend app as usual.
2. Make frontend call OMS backend routes only.
3. Test in order:
	- health badge
	- search
	- grounded summary
	- task done event
	- wiki regenerate (admin)
	- KPI page (super_admin)

### E) Local troubleshooting checklist

- If health fails: check RAG service is running on correct port.
- If 401/403: check backend passes user ID/role headers correctly.
- If empty search: ensure indexing APIs are being called after task/update actions.
- If DB errors: re-check migration order and DB URL.
- If slow/failed embeddings: add HF token and confirm internet access.

## Final note for frontend team

If you follow the 8 steps above in order, the integration will work smoothly.
Keep frontend simple, and let backend own indexing/events/security.