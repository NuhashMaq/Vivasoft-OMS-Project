# OMS2 RAG KPI Engine

Go service for semantic search, wiki lifecycle, KPI scoring, and governance logs.

## Live URL

- Health: https://vivasoft-oms-project.onrender.com/health

## Animated Buttons

<div align="center">
  <a href="../README.md#system-architecture"><img src="../docs/assets/btn-architecture.svg" alt="Root Architecture" width="220" /></a>
  <a href="../backend/scripts/seed_demo_srs.sql"><img src="../docs/assets/btn-seed.sql.svg" alt="Seed Demo Data" width="220" /></a>
</div>

## Architecture

```mermaid
graph LR
  BE[OMS2 Backend] --> RAG[RAG KPI Engine]
  RAG --> DB[(PostgreSQL + pgvector)]
```

## Core Endpoints

- Health: `GET /health`
- Search: `POST /v1/search`, `POST /v1/search/grounded-summary`
- Wiki: `POST /v1/wiki/mark-stale`, `POST /v1/wiki/generate`
- KPI: `POST /v1/kpi/compute`, `GET /v1/kpi/report?employee_id={id}`
- Governance: `POST /v1/admin/audit`, `POST /v1/admin/backup-health`, `GET /v1/admin/backup-health`

## Required Headers (Protected Routes)

- X-User-ID
- X-User-Role

## Local Development

1) Copy `.env.example` to `.env`
2) Run migrations in order:

- migrations/001_rag_engine_init.sql
- migrations/002_rag_task_id_and_daily_update_alias.sql
- migrations/003_rag_wiki_numeric_version.sql
- migrations/004_kpi_rag_governance.sql

3) Run:

```bash
go mod tidy
go run ./cmd/server
```

Default URL: http://localhost:8085

## Environment Variables

```
APP_PORT=8085
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/oms2?sslmode=disable
HF_MODEL_ID=sentence-transformers/all-MiniLM-L6-v2
HF_API_TOKEN=
HF_TIMEOUT_SECONDS=30
EMBEDDING_DIM=128
RAG_TOPK=10
RAG_CACHE_TTL_SECONDS=300
CHUNK_MIN_WORDS=80
CHUNK_MAX_WORDS=220
WIKI_REGEN_INTERVAL_SECONDS=30
ENABLE_RERANK=true
ENABLE_SEARCH_CACHE=true
ENABLE_KPI_INSIGHTS=true
```

## Reference Docs

- SRS PDF: [../docs/AI_PM_SRS_Final.pdf](../docs/AI_PM_SRS_Final.pdf)
- Team Guidelines: [../docs/Guidelines.md](../docs/Guidelines.md)
