-- Migration: Add waitlist table for early access signups
-- This table stores public waitlist signups (no auth required)

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  review_volume TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure email format is valid
  CONSTRAINT waitlist_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

  -- Ensure review_volume is one of the allowed values
  CONSTRAINT waitlist_review_volume_check CHECK (review_volume IN ('less_than_10', '10_to_50', '50_to_100', '100_plus'))
);

-- Add unique constraint on email (allows graceful handling of duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_email_unique ON waitlist (LOWER(email));

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert into waitlist (public signup)
CREATE POLICY "Allow public waitlist signup"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Prevent anonymous users from reading/updating/deleting waitlist entries
-- (Only authenticated admin users should access this data via service role)
