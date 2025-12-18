-- WARNING: This will delete ALL data in these tables!
-- Only use this if you want to completely reset your database
-- Run this BEFORE rerunning 001_initial_schema.sql

-- Drop RLS policies explicitly before dropping tables
-- Organizations policies
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can update their own organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can delete their own organization" ON organizations;

-- Users policies
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update users in their organization" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;

-- Voice Profiles policies
DROP POLICY IF EXISTS "Users can view voice profiles in their organization" ON voice_profiles;
DROP POLICY IF EXISTS "Users can insert voice profiles in their organization" ON voice_profiles;
DROP POLICY IF EXISTS "Users can update voice profiles in their organization" ON voice_profiles;
DROP POLICY IF EXISTS "Users can delete voice profiles in their organization" ON voice_profiles;

-- Locations policies
DROP POLICY IF EXISTS "Users can view locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can insert locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can update locations in their organization" ON locations;
DROP POLICY IF EXISTS "Users can delete locations in their organization" ON locations;

-- Reviews policies
DROP POLICY IF EXISTS "Users can view reviews for their organization's locations" ON reviews;
DROP POLICY IF EXISTS "Users can insert reviews for their organization's locations" ON reviews;
DROP POLICY IF EXISTS "Users can update reviews for their organization's locations" ON reviews;

-- Responses policies
DROP POLICY IF EXISTS "Users can view responses for their organization's reviews" ON responses;
DROP POLICY IF EXISTS "Users can insert responses for their organization's reviews" ON responses;
DROP POLICY IF EXISTS "Users can update responses for their organization's reviews" ON responses;

-- Notification Preferences policies
DROP POLICY IF EXISTS "Users can view their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update their own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON notification_preferences;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS voice_profiles CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop indexes (intentional documentation - these are redundant since DROP TABLE CASCADE
-- removes dependent indexes, but explicitly listing them makes the cleanup process clear)
DROP INDEX IF EXISTS idx_reviews_location_status;
DROP INDEX IF EXISTS idx_reviews_location_date;
DROP INDEX IF EXISTS idx_responses_review;
DROP INDEX IF EXISTS idx_locations_org;
DROP INDEX IF EXISTS idx_users_org;
DROP INDEX IF EXISTS idx_users_email;

