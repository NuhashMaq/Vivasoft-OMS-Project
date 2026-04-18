# RAG KPI ENGINE

Production-ready Go service for project-scoped RAG retrieval, wiki lifecycle automation, KPI scoring, and governance logs.

## What this engine provides

- RAG indexing from task, daily update, and wiki sources
- Hybrid search (vector + PostgreSQL full-text)
- Grounded summary response with source references
- Project-level RBAC check before retrieval
- Wiki stale-marking and regeneration workflow
- KPI computation and KPI visibility rules
- Audit logging and backup health endpoints

## Frontend team start here

If you want a simple step-by-step handoff document, read:

- FRONTEND_INTEGRATION_GUIDE.md

## Prerequisites

- Go 1.22+
- PostgreSQL 14+ with pgvector extension enabled
- Hugging Face model access (recommended model: sentence-transformers/all-MiniLM-L6-v2)

## Quick start

1) Create environment file

- Copy .env.example to .env

2) Configure minimum required values

- DATABASE_URL
- HF_MODEL_ID (keep default unless you have another embedding model)
- HF_API_TOKEN (optional, recommended for better rate limits)

3) Run migrations in order

- migrations/001_rag_engine_init.sql
- migrations/002_rag_task_id_and_daily_update_alias.sql
- migrations/003_rag_wiki_numeric_version.sql
- migrations/004_kpi_rag_governance.sql

4) Run service

- go mod tidy
- go run ./cmd/server

5) Health check

- GET /health

Expected response:

- {"status":"ok"}

## Seed random dev data

To generate random sample records for OMS + RAG/KPI tables in the `oms2` database:

- from project root: `docker exec -i oms2-postgres psql -U postgres -d oms2 < rag-kpi-engine/scripts/seed_random_data.sql`

Notes:

- seed script is idempotent and only inserts into tables that are currently empty
- includes a `project_members` compatibility view (for OMS2 `project_roles` schema)

## Environment variables

- APP_PORT (default: 8085)
- DATABASE_URL (required)
- HF_MODEL_ID (default: sentence-transformers/all-MiniLM-L6-v2)
- HF_API_TOKEN (optional)
- HF_TIMEOUT_SECONDS (default: 30)
- EMBEDDING_DIM (default: 128)
- RAG_TOPK (default: 10)
- RAG_CACHE_TTL_SECONDS (default: 300)
- CHUNK_MIN_WORDS (default: 80)
- CHUNK_MAX_WORDS (default: 220)
- WIKI_REGEN_INTERVAL_SECONDS (default: 30)
- ENABLE_RERANK (default: true)
- ENABLE_SEARCH_CACHE (default: true)
- ENABLE_KPI_INSIGHTS (default: true)

## API map

Core RAG

- GET /health
- POST /v1/index/task
- POST /v1/index/update
- POST /v1/tasks/status-changed
- POST /v1/search
- POST /v1/search/grounded-summary

Wiki lifecycle

- POST /v1/wiki/mark-stale
- POST /v1/wiki/generate

KPI

- POST /v1/kpi/compute (super_admin)
- GET /v1/kpi/report?employee_id={id} (super_admin)

Governance

- POST /v1/admin/audit
- POST /v1/admin/backup-health
- GET /v1/admin/backup-health

## Required request headers

For protected endpoints, pass:

- X-User-ID
- X-User-Role

Supported roles currently used by service rules:

- employee
- admin
- super_admin

## Frontend sequential flow (what frontend should do)

Use this sequence when integrating UI with OMS + RAG engine.

For beginner-friendly wording and UI-focused details, follow FRONTEND_INTEGRATION_GUIDE.md.

### Step 1: Show engine readiness

- On app load (or admin diagnostics screen), call GET /health.
- If status is not ok, disable AI features and show service unavailable message.

### Step 2: Send indexing events after user actions

- When a task is created or updated, backend should call POST /v1/index/task.
- When a daily update/comment is saved, backend should call POST /v1/index/update.
- Frontend does not need manual indexing buttons for normal flow.

### Step 3: Trigger wiki stale state on task completion

- When task status changes to Done, backend should call POST /v1/tasks/status-changed.
- This marks wiki stale for that project automatically.

### Step 4: Build the search UI

- User enters project-scoped query.
- Call POST /v1/search with project_id, query, top_k.
- Show ranked snippets, title, source id, and link_ref in result list.

### Step 5: Build grounded answer UI

- For “summarize this” action, call POST /v1/search/grounded-summary.
- Show summary text and list of sources_used.
- Keep the source chips clickable to original task/update/wiki views.

### Step 6: Wiki controls (admin/super admin screens)

- Manual stale mark: POST /v1/wiki/mark-stale.
- Manual regeneration: POST /v1/wiki/generate.
- Use this for support/debug scenarios, not normal daily flow.

### Step 7: KPI screen (super_admin only)

- Compute KPI by calling POST /v1/kpi/compute.
- Read latest KPI by calling GET /v1/kpi/report?employee_id={id}.
- Hide KPI routes/components for non-super_admin users.

### Step 8: Governance screens (admin/super_admin)

- Send governance events to POST /v1/admin/audit.
- Show latest backup status from GET /v1/admin/backup-health.
- Allow backup status update through POST /v1/admin/backup-health.

## Recommended integration pattern

- Frontend -> OMS backend API
- OMS backend -> RAG KPI ENGINE

This keeps secrets and role checks server-side and avoids exposing infrastructure details in browser code.

## Access control note

Retrieval depends on project membership presence in:

- project_members(project_id, user_id, is_active)

If your OMS uses a different membership table, map it through a DB view or adjust repository query.

## Current branch status note

This engine is currently complete on branch RAG_Engine and synced with latest main history.
