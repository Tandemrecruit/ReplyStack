-- WARNING: This will delete ALL data in these tables!
-- Only use this if you want to completely reset your database
-- Run this BEFORE rerunning 001_initial_schema.sql

-- Drop in reverse dependency order
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS voice_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop indexes (they'll be recreated by the migration)
DROP INDEX IF EXISTS idx_reviews_location_status;
DROP INDEX IF EXISTS idx_reviews_location_date;
DROP INDEX IF EXISTS idx_responses_review;
DROP INDEX IF EXISTS idx_locations_org;
DROP INDEX IF EXISTS idx_users_org;
DROP INDEX IF EXISTS idx_users_email;

