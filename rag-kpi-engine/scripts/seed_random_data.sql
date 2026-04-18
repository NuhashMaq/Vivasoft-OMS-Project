-- OMS2 dev seed for OMS + RAG/KPI tables.
-- Safe to re-run: deterministic demo identities are upserted, and bulk rows are inserted idempotently.

BEGIN;

SELECT setseed(0.42042);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure RAG RBAC compatibility on OMS2 schema.
DO $$
BEGIN
    IF to_regclass('public.project_members') IS NULL THEN
        EXECUTE $view$
            CREATE VIEW public.project_members AS
            SELECT DISTINCT
                pr.project_id::text AS project_id,
                pr.user_id::text AS user_id,
                COALESCE(u.is_active, true) AS is_active
            FROM project_roles pr
            JOIN users u ON u.id = pr.user_id
            WHERE pr.deleted_at IS NULL
              AND u.deleted_at IS NULL
        $view$;
    END IF;
END $$;

-- Ensure deterministic demo users (password for all below: password).
INSERT INTO users (first_name, last_name, email, password, role, is_active, created_at, updated_at)
VALUES
    ('Super', 'Admin', 'superadmin@oms2.local', crypt('password', gen_salt('bf')), 'super_admin', true, NOW() - INTERVAL '10 days', NOW()),
    ('System', 'Admin', 'admin@oms2.local', crypt('password', gen_salt('bf')), 'admin', true, NOW() - INTERVAL '9 days', NOW()),
    ('Project', 'Manager', 'manager@oms2.local', crypt('password', gen_salt('bf')), 'manager', true, NOW() - INTERVAL '8 days', NOW()),
    ('Demo', 'Employee', 'employee@oms2.local', crypt('password', gen_salt('bf')), 'user', true, NOW() - INTERVAL '7 days', NOW())
ON CONFLICT (email)
DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = NOW();

-- 1) OMS base tables
INSERT INTO users (first_name, last_name, email, password, role, is_active, created_at, updated_at)
SELECT
    'Demo' || gs,
    'User' || gs,
    format('demo.user.%s+%s@oms2.local', gs, floor(random() * 100000)::int),
    crypt('password', gen_salt('bf')),
    CASE
        WHEN gs = 1 THEN 'super_admin'
        WHEN gs = 2 THEN 'admin'
        ELSE 'user'
    END,
    true,
    NOW() - make_interval(days => (10 - gs)),
    NOW()
FROM generate_series(1, 8) AS gs
WHERE NOT EXISTS (SELECT 1 FROM users);

INSERT INTO projects (name, short_description, start_date, end_date, status, type, created_at, updated_at)
SELECT
    format('Seed Project %s', gs),
    format('Auto-generated project %s for OMS2 integration and RAG/KPI testing.', gs),
    NOW() - make_interval(days => (gs * 20)),
    NOW() + make_interval(days => (gs * 40)),
    CASE WHEN gs % 3 = 0 THEN 'On Hold' ELSE 'Active' END,
    CASE
        WHEN gs % 3 = 1 THEN 'Client'
        WHEN gs % 3 = 2 THEN 'Internal'
        ELSE 'R&D'
    END,
    NOW() - make_interval(days => (gs * 20)),
    NOW()
FROM generate_series(1, 3) AS gs
WHERE NOT EXISTS (SELECT 1 FROM projects);

INSERT INTO employees (first_name, last_name, email, phone, designation, department, joining_date, status, created_at, updated_at)
SELECT
    'Employee' || gs,
    'Seed' || gs,
    format('employee.seed.%s@oms2.local', gs),
    format('+880170000%04s', gs),
    CASE
        WHEN gs % 4 = 0 THEN 'QA Engineer'
        WHEN gs % 4 = 1 THEN 'Software Engineer'
        WHEN gs % 4 = 2 THEN 'Product Analyst'
        ELSE 'DevOps Engineer'
    END,
    CASE
        WHEN gs % 3 = 0 THEN 'Engineering'
        WHEN gs % 3 = 1 THEN 'Operations'
        ELSE 'Product'
    END,
    NOW() - make_interval(days => (gs * 15)),
    CASE WHEN gs % 6 = 0 THEN 'inactive' ELSE 'active' END,
    NOW() - make_interval(days => (gs * 15)),
    NOW()
FROM generate_series(1, 12) AS gs
WHERE NOT EXISTS (SELECT 1 FROM employees);

WITH user_pool AS (
    SELECT id, row_number() OVER (ORDER BY id) AS rn
    FROM users
    ORDER BY id
    LIMIT 8
),
project_pool AS (
    SELECT id
    FROM projects
    ORDER BY id
    LIMIT 3
),
seed_map AS (
    SELECT
        p.id AS project_id,
        u.id AS user_id,
        CASE
            WHEN u.rn = 1 THEN 'owner'
            WHEN u.rn = 2 THEN 'editor'
            ELSE 'viewer'
        END AS role
    FROM project_pool p
    JOIN user_pool u ON u.rn <= 5
)
INSERT INTO project_roles (user_id, project_id, role, created_at, updated_at)
SELECT s.user_id, s.project_id, s.role, NOW(), NOW()
FROM seed_map s
WHERE NOT EXISTS (
    SELECT 1
    FROM project_roles pr
    WHERE pr.user_id = s.user_id
      AND pr.project_id = s.project_id
      AND pr.deleted_at IS NULL
);

WITH demo_users AS (
    SELECT id,
           CASE
               WHEN email = 'superadmin@oms2.local' THEN 'owner'
               WHEN email = 'admin@oms2.local' THEN 'editor'
               ELSE 'viewer'
           END AS role
    FROM users
    WHERE email IN ('superadmin@oms2.local', 'admin@oms2.local', 'manager@oms2.local', 'employee@oms2.local')
),
project_pool AS (
    SELECT id
    FROM projects
    ORDER BY id
    LIMIT 3
)
INSERT INTO project_roles (user_id, project_id, role, created_at, updated_at)
SELECT du.id, pp.id, du.role, NOW(), NOW()
FROM demo_users du
CROSS JOIN project_pool pp
WHERE NOT EXISTS (
    SELECT 1
    FROM project_roles pr
    WHERE pr.user_id = du.id
      AND pr.project_id = pp.id
      AND pr.deleted_at IS NULL
);

INSERT INTO tasks (project_id, title, description, deadline, status, assignee_id, created_at, updated_at, started_at, completed_at)
SELECT
    (SELECT id FROM projects ORDER BY random() LIMIT 1),
    format('Seed Task %s', gs),
    format('Generated task %s for dashboard, timeline, and workload testing.', gs),
    NOW() + make_interval(days => ((gs % 12) + 2)),
    CASE
        WHEN gs % 4 = 0 THEN 'Done'
        WHEN gs % 4 = 1 THEN 'In Progress'
        ELSE 'To Do'
    END,
    (
        SELECT id
        FROM users
        WHERE role IN ('user', 'admin')
        ORDER BY random()
        LIMIT 1
    ),
    NOW() - make_interval(days => ((gs % 15) + 1)),
    NOW() - make_interval(days => (gs % 3)),
    CASE
        WHEN gs % 4 IN (0, 1) THEN NOW() - make_interval(days => ((gs % 10) + 1))
        ELSE NULL
    END,
    CASE
        WHEN gs % 4 = 0 THEN NOW() - make_interval(days => (gs % 6))
        ELSE NULL
    END
FROM generate_series(1, 24) AS gs
WHERE NOT EXISTS (SELECT 1 FROM tasks);

-- 2) RAG indexing tables
WITH project_pool AS (
    SELECT id::text AS project_id
    FROM projects
    ORDER BY id
    LIMIT 3
),
doc_seed AS (
    SELECT
        p.project_id,
        gs AS seq,
        CASE
            WHEN gs % 3 = 1 THEN 'TASK'
            WHEN gs % 3 = 2 THEN 'DAILY_UPDATE'
            ELSE 'WIKI'
        END AS doc_type
    FROM project_pool p
    CROSS JOIN generate_series(1, 6) AS gs
)
INSERT INTO rag_sources (project_id, doc_type, task_id, source_id, title, content, updated_by, updated_at)
SELECT
    d.project_id,
    d.doc_type,
    CASE WHEN d.doc_type = 'TASK' THEN format('TASK-%s-%s', d.project_id, d.seq) ELSE NULL END,
    format('SRC-%s-%s', d.project_id, d.seq),
    format('%s Seed Document %s', d.doc_type, d.seq),
    format(
        'Project %s document %s generated for RAG testing. Includes sprint progress, blockers, dependencies, and stakeholder notes for retrieval quality checks.',
        d.project_id,
        d.seq
    ),
    COALESCE((SELECT id::text FROM users ORDER BY id LIMIT 1), '1'),
    NOW() - make_interval(days => ((d.seq + d.project_id::int) % 7))
FROM doc_seed d
WHERE NOT EXISTS (SELECT 1 FROM rag_sources);

WITH source_pool AS (
    SELECT project_id, doc_type, task_id, source_id, title, content
    FROM rag_sources
    ORDER BY source_id
    LIMIT 30
),
chunk_seed AS (
    SELECT s.*, c.chunk_index
    FROM source_pool s
    CROSS JOIN (VALUES (0), (1)) AS c(chunk_index)
)
INSERT INTO rag_chunks (
    chunk_id,
    project_id,
    doc_type,
    task_id,
    source_id,
    title,
    content,
    chunk_index,
    embedding,
    created_at,
    updated_at
)
SELECT
    md5(cs.source_id || ':' || cs.chunk_index::text),
    cs.project_id,
    cs.doc_type,
    cs.task_id,
    cs.source_id,
    cs.title,
    format('Chunk %s for %s. %s', cs.chunk_index, cs.source_id, cs.content),
    cs.chunk_index,
    (
        '[' || array_to_string(
            ARRAY(
                SELECT to_char(random(), 'FM0.000000')
                FROM generate_series(1, 128)
            ),
            ','
        ) || ']'
    )::vector,
    NOW() - make_interval(hours => ((cs.chunk_index + length(cs.source_id)) % 48)),
    NOW() - make_interval(hours => ((cs.chunk_index + length(cs.source_id)) % 24))
FROM chunk_seed cs
WHERE NOT EXISTS (SELECT 1 FROM rag_chunks);

INSERT INTO rag_wiki_state (project_id, is_stale, stale_marked_at, last_generated_at)
SELECT
    p.id::text,
    false,
    NULL,
    NOW() - make_interval(days => ((p.id % 5)::int + 1))
FROM projects p
WHERE NOT EXISTS (SELECT 1 FROM rag_wiki_state);

WITH project_pool AS (
    SELECT id::text AS project_id
    FROM projects
    ORDER BY id
    LIMIT 3
)
INSERT INTO rag_wiki_versions (version_id, project_id, version, content, source_refs, generated_at)
SELECT
    format('wiki-%s-v1', p.project_id),
    p.project_id,
    1,
    format('Initial generated wiki summary for project %s. Captures ongoing priorities, risks, and milestone notes.', p.project_id),
    (
        SELECT COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'doc_type', rs.doc_type,
                    'source_id', rs.source_id
                )
            ),
            '[]'::jsonb
        )
        FROM (
            SELECT doc_type, source_id
            FROM rag_sources
            WHERE project_id = p.project_id
            ORDER BY updated_at DESC
            LIMIT 5
        ) rs
    ),
    NOW() - make_interval(days => 1)
FROM project_pool p
WHERE NOT EXISTS (SELECT 1 FROM rag_wiki_versions);

WITH source_pool AS (
    SELECT project_id, source_id, doc_type
    FROM rag_sources
    ORDER BY source_id
    LIMIT 20
)
INSERT INTO rag_index_jobs (job_id, job_type, project_id, source_id, status, error, attempts, created_at, updated_at)
SELECT
    format('job-%s-%s', sp.project_id, sp.source_id),
    CASE WHEN sp.doc_type = 'WIKI' THEN 'WIKI_GEN' ELSE 'REINDEX' END,
    sp.project_id,
    sp.source_id,
    'SUCCESS',
    NULL,
    1,
    NOW() - make_interval(hours => ((length(sp.source_id) % 48) + 1)),
    NOW() - make_interval(hours => (length(sp.source_id) % 24))
FROM source_pool sp
WHERE NOT EXISTS (SELECT 1 FROM rag_index_jobs);

-- 3) KPI + governance tables
WITH employee_pool AS (
    SELECT id::text AS employee_id, row_number() OVER (ORDER BY id) AS rn
    FROM users
    WHERE role IN ('user', 'admin', 'super_admin')
    ORDER BY id
),
project_pool AS (
    SELECT id::text AS project_id, row_number() OVER (ORDER BY id) AS rn
    FROM projects
    ORDER BY id
),
scored AS (
    SELECT
        ep.employee_id,
        ep.rn,
        round((55 + random() * 40)::numeric, 2) AS score,
        (
            SELECT pp.project_id
            FROM project_pool pp
            ORDER BY abs(pp.rn - ep.rn), pp.rn
            LIMIT 1
        ) AS project_id
    FROM employee_pool ep
)
INSERT INTO kpi_reports (
    report_id,
    employee_id,
    project_id,
    score,
    category,
    components,
    insights,
    generated_by,
    generated_at
)
SELECT
    format('kpi-%s-%s', s.employee_id, s.rn),
    s.employee_id,
    s.project_id,
    s.score,
    CASE
        WHEN s.score >= 80 THEN 'High'
        WHEN s.score >= 60 THEN 'Medium'
        ELSE 'Low'
    END,
    jsonb_build_object(
        'completion_rate', round((60 + random() * 35)::numeric, 2),
        'deadline_adherence', round((55 + random() * 40)::numeric, 2),
        'average_completion_time', round((45 + random() * 40)::numeric, 2),
        'task_complexity', round((50 + random() * 45)::numeric, 2),
        'task_volume', round((50 + random() * 45)::numeric, 2),
        'work_consistency', round((55 + random() * 40)::numeric, 2),
        'productivity_trend', round((55 + random() * 40)::numeric, 2)
    ),
    jsonb_build_array(
        'Auto-generated KPI sample for dashboard testing.',
        'Use this data for chart and report validation.'
    ),
    COALESCE((SELECT id::text FROM users WHERE role = 'super_admin' ORDER BY id LIMIT 1), 'system'),
    NOW() - make_interval(days => s.rn::int)
FROM scored s
WHERE NOT EXISTS (
    SELECT 1
    FROM kpi_reports kr
    WHERE kr.employee_id = s.employee_id
);

WITH project_pool AS (
    SELECT DISTINCT project_id
    FROM rag_chunks
    ORDER BY project_id
),
payloads AS (
    SELECT
        p.project_id,
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'doc_type', rc.doc_type,
                        'source_id', rc.source_id,
                        'title', rc.title,
                        'snippet', left(rc.content, 220),
                        'rank_score', 0.5,
                        'link_ref', '/source/' || rc.doc_type || '/' || rc.source_id,
                        'chunk_id', rc.chunk_id,
                        'project_id', rc.project_id,
                        'similarity', 0.5
                    )
                )
                FROM (
                    SELECT *
                    FROM rag_chunks
                    WHERE project_id = p.project_id
                    ORDER BY created_at DESC
                    LIMIT 5
                ) rc
            ),
            '[]'::jsonb
        ) AS payload
    FROM project_pool p
)
INSERT INTO rag_query_cache (project_id, query_text, top_k, response_payload, created_at, expires_at)
SELECT
    pl.project_id,
    'project overview',
    5,
    pl.payload,
    NOW(),
    NOW() + make_interval(hours => 12)
FROM payloads pl
WHERE NOT EXISTS (SELECT 1 FROM rag_query_cache);

INSERT INTO rag_audit_logs (log_id, actor_id, actor_role, action_type, project_id, source_id, details, created_at)
SELECT
    format('audit-%s', gs),
    COALESCE((SELECT id::text FROM users ORDER BY random() LIMIT 1), 'system'),
    COALESCE((SELECT role FROM users ORDER BY random() LIMIT 1), 'system'),
    CASE
        WHEN gs % 3 = 0 THEN 'KPI_GENERATED'
        WHEN gs % 3 = 1 THEN 'WIKI_GENERATED'
        ELSE 'SEARCH_QUERY'
    END,
    (SELECT id::text FROM projects ORDER BY random() LIMIT 1),
    NULL,
    format('Generated audit event %s for governance timeline testing.', gs),
    NOW() - make_interval(hours => gs)
FROM generate_series(1, 10) AS gs
WHERE NOT EXISTS (SELECT 1 FROM rag_audit_logs);

INSERT INTO admin_backup_health (backup_date, status, storage_location, notes, updated_at)
SELECT
    (CURRENT_DATE - gs)::date,
    CASE WHEN gs = 2 THEN 'DEGRADED' ELSE 'OK' END,
    format('s3://oms2-backups/%s', to_char(CURRENT_DATE - gs, 'YYYY/MM/DD')),
    CASE WHEN gs = 2 THEN 'Seeded warning: checksum mismatch on one artifact.' ELSE 'Automated daily backup completed.' END,
    NOW() - make_interval(days => gs)
FROM generate_series(0, 6) AS gs
WHERE NOT EXISTS (SELECT 1 FROM admin_backup_health);

COMMIT;

-- Quick summary after seed.
SELECT 'users' AS table_name, COUNT(*)::bigint AS row_count FROM users
UNION ALL
SELECT 'projects', COUNT(*)::bigint FROM projects
UNION ALL
SELECT 'employees', COUNT(*)::bigint FROM employees
UNION ALL
SELECT 'project_roles', COUNT(*)::bigint FROM project_roles
UNION ALL
SELECT 'tasks', COUNT(*)::bigint FROM tasks
UNION ALL
SELECT 'rag_sources', COUNT(*)::bigint FROM rag_sources
UNION ALL
SELECT 'rag_chunks', COUNT(*)::bigint FROM rag_chunks
UNION ALL
SELECT 'rag_wiki_versions', COUNT(*)::bigint FROM rag_wiki_versions
UNION ALL
SELECT 'rag_wiki_state', COUNT(*)::bigint FROM rag_wiki_state
UNION ALL
SELECT 'rag_index_jobs', COUNT(*)::bigint FROM rag_index_jobs
UNION ALL
SELECT 'kpi_reports', COUNT(*)::bigint FROM kpi_reports
UNION ALL
SELECT 'rag_query_cache', COUNT(*)::bigint FROM rag_query_cache
UNION ALL
SELECT 'rag_audit_logs', COUNT(*)::bigint FROM rag_audit_logs
UNION ALL
SELECT 'admin_backup_health', COUNT(*)::bigint FROM admin_backup_health
ORDER BY table_name;
