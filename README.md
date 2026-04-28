# OMS2: Office Management + RAG KPI Platform

OMS2 is a full-stack demo workspace for project execution tracking, daily updates, and RAG-powered insights.

## Live URLs

- Frontend: https://attachment-project-vivasoft.onrender.com
- Backend health: https://vivasoft-oms-project-1.onrender.com/health
- RAG health: https://vivasoft-oms-project.onrender.com/health

## Quick Links

<div align="center">
  <a href="./docker-compose.yml"><img src="./docs/assets/btn-run-stack.svg" alt="Run Docker Stack" width="220" /></a>
  <a href="#system-architecture"><img src="./docs/assets/btn-architecture.svg" alt="View Architecture" width="220" /></a>
</div>

<div align="center">
  <a href="./backend/README.md"><img src="./docs/assets/btn-backend.svg" alt="Open Backend Readme" width="220" /></a>
  <a href="./frontend/README.md"><img src="./docs/assets/btn-frontend.svg" alt="Open Frontend Readme" width="220" /></a>
</div>

<div align="center">
  <a href="./rag-kpi-engine/README.md"><img src="./docs/assets/btn-rag.svg" alt="Open RAG Readme" width="220" /></a>
  <a href="./backend/scripts/seed_demo_srs.sql"><img src="./docs/assets/btn-seed.sql.svg" alt="Open Demo Seed SQL" width="220" /></a>
</div>

If your preview engine blocks SVG animation, the buttons remain fully clickable as regular links.

## Demo Snapshot

- Jira-inspired UX shell with role-aware navigation.
- Seeded projects, tasks, and employees for walkthroughs.
- Daily updates and compliance-ready data.
- RAG wiki + KPI endpoints wired into the product flow.

## Quick Start (Docker)

1. From repository root, build and start all services:

```bash
docker compose up --build
```

2. Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8081/health
- RAG health: http://localhost:8085/health

3. Seed deterministic demo data (idempotent, safe to re-run):

```powershell
Get-Content -Raw .\backend\scripts\seed_demo_srs.sql | docker exec -i oms2-postgres psql -U postgres -d oms2
```

4. Login credentials (all use password `password`):

- superadmin@oms2.local
- admin@oms2.local
- manager@oms2.local
- demo.employee.01@oms2.local

## System Architecture

```mermaid
graph LR
  U[Browser User] --> FE[Frontend React Vite Nginx]
  FE -->|API| BE[Backend API Gin GORM]
  FE -->|RAG API| RAG[RAG KPI Engine Go]
  BE --> DB[(PostgreSQL pgvector)]
  RAG --> DB
  BE -->|Task status events| RAG
```

### Request and Data Flow

```mermaid
sequenceDiagram
  participant User
  participant Frontend
  participant Backend
  participant DB
  participant RAG

  User->>Frontend: Open Tasks board
  Frontend->>Backend: Get project tasks by project id
  Backend->>DB: Query tasks + metadata
  DB-->>Backend: Task rows
  Backend-->>Frontend: JSON response
  Frontend-->>User: Render Kanban board

  User->>Frontend: Mark task as Done
  Frontend->>Backend: Update task status
  Backend->>DB: Update task + status log
  Backend->>RAG: Send task status changed event
  RAG->>DB: Mark wiki state stale
  Backend-->>Frontend: Updated task payload
```

### Backend Layered Design

```mermaid
graph TB
  H[Handler Layer] --> S[Service Layer]
  S --> R[Repository Layer]
  R --> M[(PostgreSQL)]
```

### Core Data Model

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
