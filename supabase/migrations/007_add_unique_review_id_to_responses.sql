-- Migration: Add UNIQUE constraint on responses.review_id to prevent duplicate responses
-- Enforces one response per review at the database level
--
-- UP MIGRATION: Add UNIQUE constraint on review_id and create upsert function

-- WARNING: The following DELETE operation is DESTRUCTIVE and IRREVERSIBLE.
-- It permanently removes duplicate responses, keeping only the most recent per review.
-- Review this migration carefully in production before applying.

-- Create backup of rows to be deleted (timestamped for safety)
-- This backup contains all duplicate responses that will be removed
-- NOTE: Only responses with non-null review_id are considered for deduplication.
-- Orphaned responses (review_id IS NULL) are preserved and not included in backup.
DO $$
DECLARE
    backup_table_name TEXT;
BEGIN
    -- Generate timestamped backup table name
    backup_table_name := 'responses_duplicates_backup_' || to_char(now(), 'YYYY_MM_DD_HH24_MI_SS');

    -- Create backup table with rows that will be deleted
    -- Only includes duplicate responses with non-null review_id
    EXECUTE format('
        CREATE TABLE %I AS
        SELECT *
        FROM responses
        WHERE review_id IS NOT NULL
          AND id NOT IN (
            SELECT DISTINCT ON (review_id) id
            FROM responses
            WHERE review_id IS NOT NULL
            ORDER BY review_id, created_at DESC
          )', backup_table_name);

    -- Log backup creation (visible in migration logs)
    RAISE NOTICE 'Backup created: %. Review this table before dropping after migration verification.', backup_table_name;
END $$;

-- First, handle any existing duplicates by keeping only the most recent response per review
-- This is a safety measure in case duplicates already exist
-- NOTE: This DELETE is destructive. The backup above preserves deleted rows for recovery if needed.
-- NOTE: Only deletes duplicate responses with non-null review_id. Orphaned responses
-- (review_id IS NULL) are preserved and not affected by this migration.
DELETE FROM responses
WHERE review_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (review_id) id
    FROM responses
    WHERE review_id IS NOT NULL
    ORDER BY review_id, created_at DESC
  );

-- Add UNIQUE constraint on review_id
-- This will prevent concurrent inserts from creating duplicate responses
ALTER TABLE responses
ADD CONSTRAINT responses_review_id_unique UNIQUE (review_id);

-- Create a function to atomically upsert a response while preserving generated_text on update
-- This prevents race conditions when multiple publish requests arrive simultaneously
CREATE OR REPLACE FUNCTION upsert_response(
    p_review_id UUID,
    p_generated_text TEXT,
    p_final_text TEXT,
    p_status TEXT,
    p_published_at TIMESTAMPTZ
) RETURNS TABLE (
    id UUID,
    review_id UUID,
    generated_text TEXT,
    edited_text TEXT,
    final_text TEXT,
    status TEXT,
    published_at TIMESTAMPTZ,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_existing_generated_text TEXT;
    v_new_generated_text TEXT;
    v_edited_text TEXT;
BEGIN
    -- Get existing generated_text if response exists (for update case)
    SELECT generated_text INTO v_existing_generated_text
    FROM responses
    WHERE review_id = p_review_id;

    -- Determine generated_text: preserve existing or use new
    IF v_existing_generated_text IS NOT NULL THEN
        -- Update case: preserve existing generated_text
        v_new_generated_text := v_existing_generated_text;
        -- Determine if text was edited (only set edited_text if different from generated)
        IF p_final_text <> v_existing_generated_text THEN
            v_edited_text := p_final_text;
        ELSE
            v_edited_text := NULL;
        END IF;
    ELSE
        -- Insert case: use provided generated_text (NULL for direct publishes)
        -- For direct publishes (p_generated_text IS NULL), generated_text should be NULL
        v_new_generated_text := p_generated_text;
        v_edited_text := NULL;
    END IF;

    -- Upsert with ON CONFLICT to handle race conditions atomically
    INSERT INTO responses (
        review_id,
        generated_text,
        edited_text,
        final_text,
        status,
        published_at
    ) VALUES (
        p_review_id,
        v_new_generated_text,
        v_edited_text,
        p_final_text,
        p_status,
        p_published_at
    )
    ON CONFLICT (review_id) DO UPDATE SET
        -- Preserve generated_text from existing record (don't update it)
        -- Recalculate edited_text based on existing generated_text vs new final_text
        edited_text = CASE
            WHEN responses.generated_text <> p_final_text THEN p_final_text
            ELSE NULL
        END,
        final_text = EXCLUDED.final_text,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_response TO authenticated;

-- DOWN MIGRATION (for rollback):
-- DROP FUNCTION IF EXISTS upsert_response;
-- ALTER TABLE responses DROP CONSTRAINT IF EXISTS responses_review_id_unique;
