-- Adds numeric wiki version for FR-085 compatibility in existing environments.

ALTER TABLE rag_wiki_versions
    ADD COLUMN IF NOT EXISTS version INT;

WITH ranked AS (
    SELECT version_id,
           ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY generated_at ASC, version_id ASC) AS v
    FROM rag_wiki_versions
)
UPDATE rag_wiki_versions rw
SET version = ranked.v
FROM ranked
WHERE rw.version_id = ranked.version_id
  AND rw.version IS NULL;

ALTER TABLE rag_wiki_versions
    ALTER COLUMN version SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rag_wiki_versions_project_version
    ON rag_wiki_versions(project_id, version);
