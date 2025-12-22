-- Migration: Add cron_poll_state table for resilient tier-based scheduling
-- Tracks last processed timestamp per tier to prevent duplicate runs and handle timing variations
--
-- UP MIGRATION: Create cron_poll_state table

-- Create cron_poll_state table to track last processed timestamp per tier
CREATE TABLE IF NOT EXISTS cron_poll_state (
    tier TEXT PRIMARY KEY, -- 'agency', 'growth', 'starter', or null (for starter/default)
    last_processed_at TIMESTAMPTZ NOT NULL DEFAULT '1970-01-01 00:00:00+00'::timestamptz,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial state for each tier (if not exists)
INSERT INTO cron_poll_state (tier, last_processed_at)
VALUES
    ('agency', '1970-01-01 00:00:00+00'::timestamptz),
    ('growth', '1970-01-01 00:00:00+00'::timestamptz),
    ('starter', '1970-01-01 00:00:00+00'::timestamptz)
ON CONFLICT (tier) DO NOTHING;

-- Note: No RLS needed - this table is only accessed by service role/admin client
-- The cron job uses createAdminSupabaseClient() which bypasses RLS

-- DOWN MIGRATION (for rollback):
-- DROP TABLE IF EXISTS cron_poll_state;
