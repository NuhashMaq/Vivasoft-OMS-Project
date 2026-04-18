CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_sources (
    project_id TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    task_id TEXT,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, doc_type, source_id)
);

CREATE TABLE IF NOT EXISTS rag_chunks (
    chunk_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    task_id TEXT,
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INT NOT NULL,
    embedding vector(128) NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_chunks_source_unique
    ON rag_chunks(project_id, doc_type, source_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_project
    ON rag_chunks(project_id);

CREATE INDEX IF NOT EXISTS idx_rag_chunks_search_vector
    ON rag_chunks USING GIN (search_vector);

-- Optional but highly recommended once production data grows.
-- For IVFFLAT to be effective, run ANALYZE after loading vectors.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding_ivfflat
    ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

CREATE TABLE IF NOT EXISTS rag_wiki_versions (
    version_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version INT NOT NULL,
    content TEXT NOT NULL,
    source_refs JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_wiki_versions_project_time
    ON rag_wiki_versions(project_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS rag_wiki_state (
    project_id TEXT PRIMARY KEY,
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    stale_marked_at TIMESTAMPTZ,
    last_generated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rag_index_jobs (
    job_id TEXT PRIMARY KEY,
    job_type TEXT NOT NULL,
    project_id TEXT NOT NULL,
    source_id TEXT,
    status TEXT NOT NULL,
    error TEXT,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rag_index_jobs_project_status
    ON rag_index_jobs(project_id, status, created_at DESC);
