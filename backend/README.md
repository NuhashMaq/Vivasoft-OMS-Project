# OMS2 Backend API

Go + Gin API powering auth, RBAC, employees, projects, tasks, and daily updates.

## Live URL

- Health: https://vivasoft-oms-project-1.onrender.com/health

## Stack

- Go + Gin
- GORM + PostgreSQL
- JWT auth

## Local Development

```bash
go mod tidy
go run cmd/server/main.go
```

Default URL: http://localhost:8081

## Environment Variables

```
ENV=development
SERVER_HOST=0.0.0.0
SERVER_PORT=8081
DB_HOST=localhost
DB_PORT=5432
DB_NAME=oms2
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSLMODE=disable
JWT_SECRET_KEY=change_me
JWT_EXPIRY_HOURS=24
RAG_ENGINE_URL=http://localhost:8085
```

## Seed Demo Data

From repository root:

```bash
docker exec -i oms2-postgres psql -U postgres -d oms2 < backend/scripts/seed_demo_srs.sql
```

## Core Routes

- Auth: `/api/v1/auth/login`, `/api/v1/auth/me`, `/api/v1/auth/logout`
- Users/Roles: `/api/v1/users`, `/api/v1/roles`
- Employees: `/api/v1/employees`
- Projects: `/api/v1/projects`, `/api/v1/projects/:project_id/roles`
- Tasks: `/api/v1/projects/:project_id/tasks`, `/api/v1/tasks/:id/status`, `/api/v1/tasks/:id/history`
- Daily updates: `/api/v1/daily-updates`, `/api/v1/daily-updates/compliance`
