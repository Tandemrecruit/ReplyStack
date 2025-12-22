-- Migration: Add custom_tones table for AI-generated custom tones
-- Allows users to create personalized tones based on quiz responses
--
-- UP MIGRATION: Create custom_tones table and update tone constraint

-- Create custom_tones table
CREATE TABLE IF NOT EXISTS custom_tones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    enhanced_context TEXT, -- Additional context from quiz for AI prompts
    quiz_responses JSONB, -- Store quiz answers for reference/regeneration
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_custom_tones_org ON custom_tones(organization_id);

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
ALTER TABLE voice_profiles
ADD CONSTRAINT voice_profiles_tone_check
CHECK (
    tone IN ('warm', 'direct', 'professional', 'friendly', 'casual')
    OR (tone LIKE 'custom:%' AND length(tone) > 7)
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
