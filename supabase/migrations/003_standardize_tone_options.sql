-- Migration: Standardize tone options
-- Updates existing tone values and default to match new 5-option system:
-- Warm, Direct, Professional, Friendly, Casual

-- Map existing 'formal' values to 'professional' (closest match)
UPDATE voice_profiles
SET tone = 'professional'
WHERE tone = 'formal';

-- Update default tone from 'friendly' to 'warm' for new voice profiles
-- Note: This only affects new rows, existing rows keep their current values
-- To change the default for new rows, we need to alter the table default
ALTER TABLE voice_profiles
ALTER COLUMN tone SET DEFAULT 'warm';
