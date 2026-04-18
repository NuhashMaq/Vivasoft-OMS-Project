-- Compatibility layer for OMS2 where membership is stored in project_roles + users.
-- RAG checks project_members(project_id, user_id, is_active) for non-admin access.

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
