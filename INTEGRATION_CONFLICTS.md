# OMS2 Integration Conflict Matrix

## 1) API prefix mismatch
- **Conflict:** frontend axios client used `/api` while backend routes are under `/api/v1`.
- **Impact:** frequent 404 on authenticated routes.
- **Fix in OMS2:** frontend `src/auth/api.ts` now defaults to `/api/v1` and login uses `/api/v1/auth/login`.

## 2) Token key inconsistency
- **Conflict:** interceptor cleared `token` while app stores `auth_token`.
- **Impact:** stale auth state after 401.
- **Fix in OMS2:** interceptor now clears `auth_token` and `auth_user`.

## 3) Backend compile-time wiring drift
- **Conflict:** `taskHandler` used in routes but not initialized in `cmd/server/main.go`.
- **Impact:** backend build failure.
- **Fix in OMS2:** task repository/service/handler are fully wired.

## 4) Mixed Go module import paths
- **Conflict:** subset of files imported old module namespace (`FahadHossainBabor/...`).
- **Impact:** unresolved imports and broken builds.
- **Fix in OMS2:** imports normalized to `github.com/industrial-attachment/office-management-backend`.

## 5) Frontend-to-RAG route mismatch
- **Conflict:** wiki/kpi services called `/api/wiki/search` and `/api/kpi`, but RAG exposes `/v1/search` and `/v1/kpi/report`.
- **Impact:** no real RAG data in UI.
- **Fix in OMS2:** added `src/services/ragClient.ts`; `wikiService.ts` and `kpiService.ts` now use RAG endpoints.

## 6) Missing RAG headers from browser
- **Conflict:** RAG protected endpoints need `X-User-ID` and `X-User-Role`.
- **Impact:** unauthorized RAG responses.
- **Fix in OMS2:** `ragClient` injects both headers from `auth_user`.

## 7) Event propagation gap (Task Done -> Wiki stale)
- **Conflict:** backend and RAG were not reliably connected for lifecycle events.
- **Impact:** wiki not marked stale when tasks move to Done.
- **Fix in OMS2:** backend task status handler sends best-effort call to `RAG_ENGINE_URL/v1/tasks/status-changed` on Done transitions.

## 8) Run-time networking/CORS drift
- **Conflict:** services developed on different ports without unified proxy.
- **Impact:** CORS risk and inconsistent URLs.
- **Fix in OMS2:** frontend nginx and Vite proxy unify calls via `/api/*` and `/rag/*`.

## 9) Migration ordering for pgvector
- **Conflict:** manual setup risked missing extensions/migrations.
- **Impact:** runtime query/index failures.
- **Fix in OMS2:** Dockerized Postgres initializes extensions; RAG container runs SQL migrations before startup.
