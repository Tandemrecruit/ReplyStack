-- Migration: Make generated_text nullable to distinguish AI-generated vs user-written responses
-- Direct publishes (user-written) will have null generated_text, while AI-generated responses will have it set
--
-- UP MIGRATION: Make generated_text nullable

-- Make generated_text nullable
ALTER TABLE responses
ALTER COLUMN generated_text DROP NOT NULL;

-- Update the upsert_response function to handle null generated_text for direct publishes
CREATE OR REPLACE FUNCTION upsert_response(
    p_review_id UUID,
    p_generated_text TEXT, -- Can be null for direct publishes
    p_final_text TEXT,
    p_status TEXT,
    p_published_at TIMESTAMPTZ
) RETURNS TABLE (
    id UUID,
    review_id UUID,
    generated_text TEXT, -- Now nullable
    edited_text TEXT,
    final_text TEXT,
    status TEXT,
    published_at TIMESTAMPTZ,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_new_generated_text TEXT;
    v_edited_text TEXT;
BEGIN
    -- Set values for insert case only
    -- For updates, ON CONFLICT block handles generated_text preservation and edited_text computation
    v_new_generated_text := p_generated_text; -- Can be null for direct publishes
    v_edited_text := NULL; -- Always NULL for inserts

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
        -- Handle case where existing generated_text might be null
        edited_text = CASE
            WHEN responses.generated_text IS NULL THEN NULL -- No generated_text means no edit comparison
            WHEN responses.generated_text <> p_final_text THEN p_final_text
            ELSE NULL
        END,
        final_text = EXCLUDED.final_text,
        status = EXCLUDED.status,
        published_at = EXCLUDED.published_at
    RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- DOWN MIGRATION (for rollback):
-- ALTER TABLE responses ALTER COLUMN generated_text SET NOT NULL;
-- (Note: This will fail if any rows have null generated_text - would need to clean up first)
