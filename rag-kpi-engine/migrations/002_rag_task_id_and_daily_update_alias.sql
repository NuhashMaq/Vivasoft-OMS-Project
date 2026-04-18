-- Backward-safe migration for environments that already ran 001.
-- Adds explicit task_id metadata columns required by FR-089 wording.

ALTER TABLE rag_sources
    ADD COLUMN IF NOT EXISTS task_id TEXT;

ALTER TABLE rag_chunks
    ADD COLUMN IF NOT EXISTS task_id TEXT;

-- Data compatibility note:
-- Existing rows with doc_type='UPDATE' remain valid.
-- Application layer normalizes UPDATE and DAILY_UPDATE into DAILY_UPDATE for new writes.
