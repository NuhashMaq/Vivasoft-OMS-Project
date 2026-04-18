-- KPI, optional retrieval, and governance schema.

CREATE TABLE IF NOT EXISTS kpi_reports (
    report_id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    project_id TEXT,
    score NUMERIC(5,2) NOT NULL,
    category TEXT NOT NULL,
    components JSONB NOT NULL,
    insights JSONB,
    generated_by TEXT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_reports_employee_time
    ON kpi_reports(employee_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS rag_query_cache (
    project_id TEXT NOT NULL,
    query_text TEXT NOT NULL,
    top_k INT NOT NULL,
    response_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (project_id, query_text, top_k)
);

CREATE INDEX IF NOT EXISTS idx_rag_query_cache_expiry
    ON rag_query_cache(expires_at);

CREATE TABLE IF NOT EXISTS rag_audit_logs (
    log_id TEXT PRIMARY KEY,
    actor_id TEXT,
    actor_role TEXT,
    action_type TEXT NOT NULL,
    project_id TEXT,
    source_id TEXT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_audit_logs_time
    ON rag_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_backup_health (
    backup_date DATE PRIMARY KEY,
    status TEXT NOT NULL,
    storage_location TEXT NOT NULL,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
