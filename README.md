# OMS2 Unified Stack

`OMS2` is an isolated integration workspace containing:
- `backend` (OMS API)
- `frontend` (React UI)
- `rag-kpi-engine` (RAG + KPI service)
- a single Docker Compose stack for local end-to-end run

## Quick Start (Docker)

1. Open terminal in `OMS2`.
2. Create env file:
   - copy `.env.example` to `.env`
   - set `HF_API_TOKEN` if you want higher Hugging Face rate limits
3. Start all services:
   - `docker compose up --build`
4. Open:
   - Frontend: `http://localhost:3000`
   - Backend health: `http://localhost:8081/health`
   - RAG health: `http://localhost:8085/health`

## Service Topology

- Browser -> Frontend container (`3000`)
- Frontend nginx proxy:
  - `/api/*` -> `backend:8081`
  - `/rag/*` -> `rag:8085`
- Backend -> Postgres (`postgres:5432`)
- Backend -> RAG event callback (`RAG_ENGINE_URL`)
- RAG -> Postgres (`postgres:5432`)

## Local Dev (without Docker)

### Backend
- `cd backend`
- copy `.env.example` to `.env`
- run `go run ./cmd/server`

### RAG
- `cd rag-kpi-engine`
- copy `.env.example` to `.env`
- set `DATABASE_URL` to your postgres
- run migrations under `migrations/` in order
- run `go run ./cmd/server`

### Frontend
- `cd frontend`
- copy `.env.example` to `.env`
- run `npm install`
- run `npm run dev`

## Notes

- Existing `Backend` and `Frontend` folders outside `OMS2` are untouched.
- This workspace applies integration fixes only inside `OMS2`.

## Demo Credentials

Use these seeded users (password for all: `password`):

- `superadmin@oms2.local`
- `admin@oms2.local`
- `employee@oms2.local`

## RAG Demo Flow (Supervisor)

1. Login at `http://localhost:3000` with `superadmin@oms2.local` / `password`
2. Open **Tasks** and select a project (stores active project)
3. Open **AI Wiki** and search `project overview`
4. Open **KPI** to view RAG/KPI report for the logged-in super admin
