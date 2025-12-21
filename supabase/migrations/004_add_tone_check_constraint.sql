-- Migration: Add CHECK constraint on voice_profiles.tone
-- Enforces valid tone values: 'warm', 'direct', 'professional', 'friendly', 'casual'
--
-- UP MIGRATION: Add constraint
ALTER TABLE voice_profiles
ADD CONSTRAINT voice_profiles_tone_check
CHECK (tone IN ('warm', 'direct', 'professional', 'friendly', 'casual'));

-- DOWN MIGRATION (for rollback):
-- ALTER TABLE voice_profiles DROP CONSTRAINT IF EXISTS voice_profiles_tone_check;
