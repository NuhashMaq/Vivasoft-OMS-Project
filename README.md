# OMS2 Project Hub

OMS2 is an SRS-aligned workspace for execution tracking, daily updates, KPI reporting, and RAG-assisted knowledge retrieval.

## Live URLs

- Frontend: https://attachment-project-vivasoft.onrender.com
- Backend health: https://vivasoft-oms-project-1.onrender.com/health
- RAG health: https://vivasoft-oms-project.onrender.com/health

## Animated Buttons

<div align="center">
  <a href="./docker-compose.yml"><img src="./docs/assets/btn-run-stack.svg" alt="Run Docker Stack" width="230" /></a>
  <a href="#system-architecture"><img src="./docs/assets/btn-architecture.svg" alt="View Architecture" width="230" /></a>
</div>

<div align="center">
  <a href="./frontend/README.md"><img src="./docs/assets/btn-frontend.svg" alt="Open Frontend Readme" width="230" /></a>
  <a href="./backend/README.md"><img src="./docs/assets/btn-backend.svg" alt="Open Backend Readme" width="230" /></a>
</div>

<div align="center">
  <a href="./rag-kpi-engine/README.md"><img src="./docs/assets/btn-rag.svg" alt="Open RAG Readme" width="230" /></a>
  <a href="./backend/scripts/seed_demo_srs.sql"><img src="./docs/assets/btn-seed.sql.svg" alt="Open Demo Seed SQL" width="230" /></a>
</div>

If your preview engine blocks SVG animation, the buttons remain fully clickable as regular links.

## Product Snapshot

- Role-aware project management with RBAC and system roles.
- Task lifecycle tracking with status history and daily updates.
- KPI intelligence computed from RAG signals and operational data.
- AI Wiki with semantic search across tasks, updates, and generated knowledge.
- Demo seed data for walkthrough-ready dashboards.

## Reference Docs

- SRS PDF: [docs/AI_PM_SRS_Final.pdf](docs/AI_PM_SRS_Final.pdf)
- Team Guidelines: [docs/Guidelines.md](docs/Guidelines.md)

## Quick Start (Docker)

```bash
docker compose up --build
```

Open:

- http://localhost:3000
- http://localhost:8081/health
- http://localhost:8085/health

Seed demo data (idempotent):

```powershell
Get-Content -Raw .\backend\scripts\seed_demo_srs.sql | docker exec -i oms2-postgres psql -U postgres -d oms2
```

Demo credentials (password: `password`):

- superadmin@oms2.local
- admin@oms2.local
- manager@oms2.local
- demo.employee.01@oms2.local

## System Architecture

```mermaid
graph LR
  U[Browser User] --> FE[Frontend React Vite Nginx]
  FE -->|/api| BE[Backend API Gin GORM]
  FE -->|/rag| RAG[RAG KPI Engine Go]
  BE --> DB[(PostgreSQL pgvector)]
  RAG --> DB
  BE -->|Task status events| RAG
```

## Request and Data Flow

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend
  participant DB
  participant RAG

  User->>Frontend: Open Tasks board
  Frontend->>Backend: GET project tasks
  Backend->>DB: Query tasks + metadata
  DB-->>Backend: Task rows
  Backend-->>Frontend: JSON response

  User->>Frontend: Mark task as Done
  Frontend->>Backend: Update task status
  Backend->>DB: Update task + status log
  Backend->>RAG: POST /v1/tasks/status-changed
  RAG->>DB: Mark wiki stale
  Backend-->>Frontend: Updated task payload
```

## Domain Map

```mermaid
erDiagram
  USERS ||--o{ SESSIONS : owns
  USERS ||--o{ PROJECT_ROLES : assigned
  PROJECTS ||--o{ PROJECT_ROLES : has
  PROJECTS ||--o{ TASKS : contains
  EMPLOYEES ||--o{ TASKS : assignee
  TASKS ||--o{ TASK_STATUS_LOGS : history
  USERS ||--o{ DAILY_UPDATES : submits
  DAILY_UPDATES ||--o{ DAILY_UPDATE_ITEMS : includes
```

## Walkthrough Flow

1. Sign in as `superadmin@oms2.local`.
2. Review Dashboard KPI strip and project snapshot.
3. Open Projects -> Project Details -> Tasks board.
4. Update a task status to trigger RAG wiki stale mark.
5. Visit AI Wiki and search across project knowledge.
6. Check KPI screen after computation is available.
