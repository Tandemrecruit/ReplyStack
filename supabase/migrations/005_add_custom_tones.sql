-- Migration: Add custom_tones table for AI-generated custom tones
-- Allows users to create personalized tones based on quiz responses
--
-- UP MIGRATION: Create custom_tones table and update tone constraint

-- Pre-migration: Clean up any orphaned rows with NULL organization_id
-- This handles the case where the table might exist from a previous partial migration
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'custom_tones'
        AND table_schema = 'public'
    ) THEN
        DELETE FROM custom_tones WHERE organization_id IS NULL;
    END IF;
END $$;

-- Create custom_tones table
CREATE TABLE IF NOT EXISTS custom_tones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    enhanced_context TEXT, -- Additional context from quiz for AI prompts
    quiz_responses JSONB, -- Store quiz answers for reference/regeneration
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure organization_id is NOT NULL if table already existed
-- This handles the case where table was created before NOT NULL was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'custom_tones'
        AND column_name = 'organization_id'
        AND is_nullable = 'YES'
        AND table_schema = 'public'
    ) THEN
        -- Delete any remaining NULL values before adding constraint
        DELETE FROM custom_tones WHERE organization_id IS NULL;
        -- Add NOT NULL constraint
        ALTER TABLE custom_tones ALTER COLUMN organization_id SET NOT NULL;
    END IF;
END $$;

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_custom_tones_org ON custom_tones(organization_id);

-- Create trigger to auto-update updated_at on row modifications
-- Reuses update_updated_at_column() function from migration 002
DROP TRIGGER IF EXISTS update_custom_tones_updated_at ON custom_tones;
CREATE TRIGGER update_custom_tones_updated_at
    BEFORE UPDATE ON custom_tones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on custom_tones
ALTER TABLE custom_tones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for custom_tones
-- Users can view custom tones in their organization
CREATE POLICY "Users can view custom tones in their organization"
    ON custom_tones FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can insert custom tones in their organization
CREATE POLICY "Users can insert custom tones in their organization"
    ON custom_tones FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can update custom tones in their organization
CREATE POLICY "Users can update custom tones in their organization"
    ON custom_tones FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users can delete custom tones in their organization
CREATE POLICY "Users can delete custom tones in their organization"
    ON custom_tones FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Update tone constraint to allow custom tones
-- Drop the old constraint
ALTER TABLE voice_profiles DROP CONSTRAINT IF EXISTS voice_profiles_tone_check;

-- Add new constraint that allows standard tones OR custom tone format (custom:{uuid})
-- Validates that custom tones follow the format custom:{uuid} where {uuid} is a valid UUID
ALTER TABLE voice_profiles
ADD CONSTRAINT voice_profiles_tone_check
CHECK (
    tone IN ('warm', 'direct', 'professional', 'friendly', 'casual')
    OR (tone LIKE 'custom:%'
        AND length(tone) = 43
        AND substring(tone FROM 8) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
);

-- DOWN MIGRATION (for rollback):
-- DROP POLICY IF EXISTS "Users can delete custom tones in their organization" ON custom_tones;
-- DROP POLICY IF EXISTS "Users can update custom tones in their organization" ON custom_tones;
-- DROP POLICY IF EXISTS "Users can insert custom tones in their organization" ON custom_tones;
-- DROP POLICY IF EXISTS "Users can view custom tones in their organization" ON custom_tones;
-- ALTER TABLE custom_tones DISABLE ROW LEVEL SECURITY;
-- DROP INDEX IF EXISTS idx_custom_tones_org;
-- DROP TABLE IF EXISTS custom_tones;
-- ALTER TABLE voice_profiles DROP CONSTRAINT IF EXISTS voice_profiles_tone_check;
-- ALTER TABLE voice_profiles
-- ADD CONSTRAINT voice_profiles_tone_check
-- CHECK (tone IN ('warm', 'direct', 'professional', 'friendly', 'casual'));
