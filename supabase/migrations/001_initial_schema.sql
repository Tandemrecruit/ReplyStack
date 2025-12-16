-- ReplyStack Initial Database Schema
-- Run this migration to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations (accounts/tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_tier TEXT DEFAULT 'starter',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'owner',
    google_refresh_token TEXT, -- Encrypted at rest via Supabase Vault
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice Profiles (AI personality configuration)
CREATE TABLE voice_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT DEFAULT 'Default',
    tone TEXT DEFAULT 'friendly',
    personality_notes TEXT,
    example_responses TEXT[],
    sign_off_style TEXT,
    words_to_use TEXT[],
    words_to_avoid TEXT[],
    max_length INTEGER DEFAULT 150,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Locations (Google Business Profile locations)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    google_account_id TEXT NOT NULL,
    google_location_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    voice_profile_id UUID REFERENCES voice_profiles(id) ON DELETE SET NULL,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(google_account_id, google_location_id)
);

-- Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    platform TEXT DEFAULT 'google',
    external_review_id TEXT UNIQUE NOT NULL,
    reviewer_name TEXT,
    reviewer_photo_url TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_date TIMESTAMP WITH TIME ZONE,
    has_response BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- pending, responded, ignored
    sentiment TEXT, -- positive, neutral, negative
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Responses (AI-generated and published responses)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    generated_text TEXT NOT NULL,
    edited_text TEXT,
    final_text TEXT, -- What was actually published
    status TEXT DEFAULT 'draft', -- draft, published, failed
    published_at TIMESTAMP WITH TIME ZONE,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_voice_profiles_org ON voice_profiles(organization_id);
CREATE INDEX idx_locations_org ON locations(organization_id);
CREATE INDEX idx_reviews_location_status ON reviews(location_id, status);
CREATE INDEX idx_reviews_location_date ON reviews(location_id, review_date DESC);
CREATE INDEX idx_reviews_external_id ON reviews(external_review_id);
CREATE INDEX idx_responses_review ON responses(review_id);
CREATE INDEX idx_responses_status ON responses(status);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view own organization"
    ON organizations FOR SELECT
    USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own organization"
    ON organizations FOR UPDATE
    USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Users: Users can only see users in their organization
CREATE POLICY "Users can view organization members"
    ON users FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Voice Profiles: Users can manage voice profiles for their organization
CREATE POLICY "Users can view org voice profiles"
    ON voice_profiles FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert org voice profiles"
    ON voice_profiles FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update org voice profiles"
    ON voice_profiles FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete org voice profiles"
    ON voice_profiles FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Locations: Users can manage locations for their organization
CREATE POLICY "Users can view org locations"
    ON locations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert org locations"
    ON locations FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update org locations"
    ON locations FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete org locations"
    ON locations FOR DELETE
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Reviews: Users can view reviews for their organization's locations
CREATE POLICY "Users can view org reviews"
    ON reviews FOR SELECT
    USING (location_id IN (
        SELECT l.id FROM locations l
        JOIN users u ON u.organization_id = l.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can update org reviews"
    ON reviews FOR UPDATE
    USING (location_id IN (
        SELECT l.id FROM locations l
        JOIN users u ON u.organization_id = l.organization_id
        WHERE u.id = auth.uid()
    ));

-- Responses: Users can manage responses for their organization's reviews
CREATE POLICY "Users can view org responses"
    ON responses FOR SELECT
    USING (review_id IN (
        SELECT r.id FROM reviews r
        JOIN locations l ON l.id = r.location_id
        JOIN users u ON u.organization_id = l.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can insert org responses"
    ON responses FOR INSERT
    WITH CHECK (review_id IN (
        SELECT r.id FROM reviews r
        JOIN locations l ON l.id = r.location_id
        JOIN users u ON u.organization_id = l.organization_id
        WHERE u.id = auth.uid()
    ));

CREATE POLICY "Users can update org responses"
    ON responses FOR UPDATE
    USING (review_id IN (
        SELECT r.id FROM reviews r
        JOIN locations l ON l.id = r.location_id
        JOIN users u ON u.organization_id = l.organization_id
        WHERE u.id = auth.uid()
    ));
