# OMS2: Office Management + RAG KPI Platform

OMS2 is a full-stack Project Management System demo workspace with:

- A Go backend API for auth, RBAC, employees, projects, tasks, and daily updates.
- A React + TypeScript frontend redesigned for a Jira-style workflow experience.
- A Go RAG/KPI engine for semantic retrieval, wiki lifecycle, KPI reporting, and governance logs.
- A single Docker Compose topology that runs everything end-to-end.

## Demo Highlights

- Jira-inspired UX shell with role-aware navigation.
- 20 demo employee users + employee directory records.
- 5 seeded showcase projects with assigned task boards.
- Daily update and compliance-compatible seed data.
- RAG-powered Wiki and KPI endpoints ready for supervisor-level walkthroughs.

## Quick Links

<div align="center">
   <a href="./docker-compose.yml"><img src="./docs/assets/btn-run-stack.svg" alt="Run Docker Stack" width="330" /></a>
   <a href="#system-architecture"><img src="./docs/assets/btn-architecture.svg" alt="View Architecture" width="330" /></a>
</div>

<div align="center">
   <a href="./backend/README.md"><img src="./docs/assets/btn-backend.svg" alt="Open Backend Readme" width="330" /></a>
   <a href="./frontend/README.md"><img src="./docs/assets/btn-frontend.svg" alt="Open Frontend Readme" width="330" /></a>
</div>

<div align="center">
   <a href="./rag-kpi-engine/README.md"><img src="./docs/assets/btn-rag.svg" alt="Open RAG Readme" width="330" /></a>
   <a href="./backend/scripts/seed_demo_srs.sql"><img src="./docs/assets/btn-seed.sql.svg" alt="Open Demo Seed SQL" width="330" /></a>
</div>

If your preview engine blocks SVG animation, the buttons remain fully clickable as regular links.

## Quick Start (Docker)

1. From repository root, build and start all services:

```bash
docker compose up --build
```

2. Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8081/health`
- RAG health: `http://localhost:8085/health`

3. Seed deterministic demo data (idempotent, safe to re-run):

```powershell
Get-Content -Raw .\backend\scripts\seed_demo_srs.sql | docker exec -i oms2-postgres psql -U postgres -d oms2
```

4. Login credentials (all use password `password`):

- `superadmin@oms2.local`
- `admin@oms2.local`
- `manager@oms2.local`
- `demo.employee.01@oms2.local`

## Production Deployment (Free Tier, Step by Step)

This runbook deploys the full OMS2 stack (frontend, backend, RAG, PostgreSQL) on one Oracle Cloud Always Free VM with HTTPS.

### 1. Provision Free Infrastructure

1. Create an Oracle Cloud account.
2. Create an Always Free compute instance:
    - Shape: `VM.Standard.A1.Flex`
    - OCPU and Memory: start with `2 OCPU / 12 GB RAM` (increase if available)
    - OS: Ubuntu 22.04 LTS
3. Reserve and attach a public IP to avoid IP changes.
4. In OCI network security rules, allow inbound:
    - `22` (SSH)
    - `80` (HTTP)
    - `443` (HTTPS)

### 2. Point Your Domain

1. In your DNS provider, create an `A` record:
    - Host: `oms2` (or root `@`)
    - Value: your VM public IP
2. Wait for DNS propagation.

### 3. SSH and Prepare Server

```bash
ssh ubuntu@<YOUR_VM_PUBLIC_IP>
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw
```

Configure firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

### 4. Install Docker Engine + Compose Plugin

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
   "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
   $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version
```

### 5. Clone Project on Server

```bash
git clone git@github.com:NuhashMaq/Vivasoft-OMS-Project.git
cd Vivasoft-OMS-Project
```

If SSH cloning is not configured:

```bash
git clone https://github.com/NuhashMaq/Vivasoft-OMS-Project.git
cd Vivasoft-OMS-Project
```

### 6. Create Production Override Files

Create a deploy folder:

```bash
mkdir -p deploy
```

Create `deploy/Caddyfile` (replace domain):

```bash
cat > deploy/Caddyfile << 'EOF'
oms2.example.com {
   encode gzip
   reverse_proxy frontend:80
}
EOF
```

Create `docker-compose.prod.yml`:

```bash
cat > docker-compose.prod.yml << 'EOF'
services:
   postgres:
      ports: []
      environment:
         POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

   backend:
      ports: []
      environment:
         ENV: production
         DB_PASSWORD: ${POSTGRES_PASSWORD}
         JWT_SECRET_KEY: ${JWT_SECRET_KEY}

   rag:
      ports: []
      environment:
         DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/oms2?sslmode=disable

   frontend:
      ports: []
      expose:
         - "80"

   caddy:
      image: caddy:2-alpine
      container_name: oms2-caddy
      restart: unless-stopped
      depends_on:
         - frontend
      ports:
         - "80:80"
         - "443:443"
      volumes:
         - ./deploy/Caddyfile:/etc/caddy/Caddyfile:ro
         - caddy_data:/data
         - caddy_config:/config

volumes:
   caddy_data:
   caddy_config:
EOF
```

### 7. Create Secret Environment File

Create `.env` in repository root:

```bash
cat > .env << 'EOF'
POSTGRES_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD
JWT_SECRET_KEY=CHANGE_THIS_TO_A_LONG_RANDOM_SECRET
HF_API_TOKEN=
EOF
```

Generate secure values quickly:

```bash
openssl rand -base64 36
```

### 8. Start Production Stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 9. Seed Demo Data

```bash
docker exec -i oms2-postgres psql -U postgres -d oms2 < backend/scripts/seed_demo_srs.sql
```

### 10. Validate Health and Access

1. Open your domain in browser: `https://oms2.example.com`
2. Validate backend through frontend proxy path:
    - `https://oms2.example.com/api/v1/auth/me` (expects auth behavior)
3. Validate RAG health through frontend proxy path:
    - `https://oms2.example.com/rag/health`
4. Login with demo account:
    - `superadmin@oms2.local` / `password`

### 11. Configure Daily Database Backup

Create backup script:

```bash
mkdir -p $HOME/scripts $HOME/backups/oms2
cat > $HOME/scripts/backup-oms2.sh << 'EOF'
#!/usr/bin/env bash
set -euo pipefail
ts=$(date +%F_%H-%M-%S)
docker exec oms2-postgres pg_dump -U postgres -d oms2 | gzip > "$HOME/backups/oms2/oms2_${ts}.sql.gz"
find "$HOME/backups/oms2" -type f -mtime +7 -delete
EOF
chmod +x $HOME/scripts/backup-oms2.sh
```

Add cron entry:

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * $HOME/scripts/backup-oms2.sh") | crontab -
crontab -l
```

### 12. Deploy Updates Safely

```bash
cd ~/Vivasoft-OMS-Project
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker image prune -f
```

### 13. Basic Troubleshooting

Check service state:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Check logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=150 frontend backend rag postgres caddy
```

Restart stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

## Animated UX Narrative

The frontend is tuned for a demo-ready feel with subtle, meaningful motion:

- Staggered KPI card reveals on page load.
- Soft gradient atmosphere and panel depth transitions.
- Task board cards with hover elevation and modal-driven detail workflows.
- Status chips and controls designed for fast visual scanning during live demos.

Suggested live walkthrough:

1. Login as `superadmin@oms2.local`.
2. Start from Dashboard and narrate KPI strip + portfolio snapshot.
3. Open Projects, then drill into Project Details.
4. Open Tasks and walk through Kanban + task history modal.
5. Open Daily Updates and Attendance for operational visibility.
6. Open AI Wiki and KPI pages to demonstrate RAG-backed insight surfaces.

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

## Backend Deep Dive (Go + Gin)

### Architectural Pattern

The backend follows a layered flow:

- `handler` -> HTTP parsing/validation/response shape
- `service` -> business rules and domain orchestration
- `repository` -> persistence operations (GORM)
- `model` -> schema and request/response primitives

```mermaid
graph TB
   H[Handler Layer] --> S[Service Layer]
   S --> R[Repository Layer]
   R --> M[(PostgreSQL)]
```

### Domain Modules

- Authentication and sessions: login, logout, session validation.
- RBAC and project roles: system roles + project-level ownership/editor/viewer mapping.
- Employees: directory, status control, assignment-readiness.
- Projects: portfolio-level CRUD and membership exposure.
- Tasks: task CRUD, status transitions, and status-history tracking.
- Daily Updates: per-user daily submissions + compliance reporting views.

### Core Data Model Relationships

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

### API Surface (Main Functional Areas)

- Auth: `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`
- Users and roles: `/api/v1/users`, `/api/v1/roles/*`
- Employees: `/api/v1/employees`
- Projects and members: `/api/v1/projects`, `/api/v1/projects/:project_id/roles`
- Tasks and lifecycle: `/api/v1/projects/:project_id/tasks`, `/api/v1/tasks/:id/status`, `/api/v1/tasks/:id/history`
- Daily updates: `/api/v1/daily-updates`, `/api/v1/daily-updates/compliance`

## RAG KPI Engine Deep Dive

The RAG service is responsible for contextual retrieval, generated summaries, wiki lifecycle operations, KPI reporting, and governance evidence.

### RAG Retrieval Pipeline

```mermaid
flowchart TD
   Q[User Query] --> V[Embedding]
   V --> C1[Vector Search in rag_chunks]
   V --> C2[Text Search in rag_sources]
   C1 --> Merge[Hybrid Merge + Rank]
   C2 --> Merge
   Merge --> G[Grounded Summary]
   G --> Out[Answer + Source References]
```

### Wiki Lifecycle

```mermaid
flowchart LR
   T[Task Done Event] --> S[Mark Wiki Stale]
   S --> J[Wiki Generation Job]
   J --> V[New Version in rag_wiki_versions]
   V --> FE[Frontend Wiki View]
```

### KPI Flow

```mermaid
flowchart LR
   Inputs[Task and Update Signals] --> Compute[KPI Compute]
   Compute --> Reports[kpi_reports]
   Reports --> Dashboard[Leadership KPI Dashboard]
```

### Governance Endpoints

- Audit event capture: `/v1/admin/audit`
- Backup health write/read: `/v1/admin/backup-health`
- Operational health: `/health`

## Demo Data Strategy

`backend/scripts/seed_demo_srs.sql` seeds:

- 20 deterministic demo employee users (`demo.employee.01` -> `demo.employee.20`).
- 20 deterministic employee directory records.
- 5 showcase projects with varied status and type.
- 30 project tasks assigned across employees with mixed statuses.
- Task status history logs for lifecycle timeline visuals.
- Daily updates and daily update items for compliance narratives.

The script is idempotent and can be run repeatedly during demos.

## Repository Layout

```text
OMS2/
├── backend/                 # Gin API + business logic + SQL seed
│   ├── cmd/server/
│   ├── internal/
│   └── scripts/seed_demo_srs.sql
├── frontend/                # React TypeScript Jira-like PMS UI
├── rag-kpi-engine/          # Retrieval, wiki, KPI, governance engine
├── docker/postgres-init/    # DB initialization extensions
└── docker-compose.yml       # Full local topology
```

## Local Development (Without Docker)

### Backend

```bash
cd backend
go run ./cmd/server
```

### RAG Engine

```bash
cd rag-kpi-engine
go run ./cmd/server
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

- If login fails after reseeding, rerun the seed script to refresh bcrypt hashes.
- If frontend data looks stale, hard refresh the browser after reseed.
- If RAG pages show no insight, confirm `rag` service health on `http://localhost:8085/health`.
- If Docker rebuilds are needed, use `docker compose down` then `docker compose up --build`.

## Notes

- This workspace is integration-focused and self-contained under OMS2.
- Existing sibling folders outside OMS2 are not modified by this stack.
