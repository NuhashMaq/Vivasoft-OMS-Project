# OMS2 Project Guidelines

This document captures practical conventions for working on OMS2 across frontend, backend, and RAG services.

## Repository Hygiene

- Keep commits small and focused on one logical change.
- Add or update relevant README sections when behavior changes.
- Use clear, human-readable commit titles.

## Branch and Review

- Use short-lived feature branches for non-trivial work.
- Prefer PRs with concise summaries and screenshots for UI changes.
- Verify backend and RAG health endpoints after deployments.

## Frontend Workflow

- Keep API base URLs relative (`/api/v1`, `/rag/v1`) for proxy compatibility.
- Use role-aware UI gating for admin or super_admin routes.
- Keep loading, empty, and error states consistent and friendly.

## Backend Workflow

- Run migrations and seed scripts on the same database used by the backend.
- Keep RBAC decisions in services and middleware, not handlers.
- Document any new env vars in the backend README.

## RAG Engine Workflow

- Keep the RAG engine isolated from frontend; backend should proxy calls.
- Always include `X-User-ID` and `X-User-Role` for protected routes.
- Verify `/health` before enabling AI surfaces in the UI.

## Release Checklist

- Frontend renders with no console errors.
- Backend `/health` returns healthy.
- RAG `/health` returns ok.
- Login with `superadmin@oms2.local` succeeds.
- Seed data verified for demo walkthrough.
