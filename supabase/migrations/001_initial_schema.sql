-- ReplyStack Initial Database Schema
-- Run this migration in your Supabase SQL Editor to set up the database

-- Organizations (accounts/tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    plan_tier TEXT DEFAULT 'starter',
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'owner',
    google_refresh_token TEXT, -- Encrypted at rest via Supabase Vault
    created_at TIMESTAMP DEFAULT now()
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
    created_at TIMESTAMP DEFAULT now()
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
    created_at TIMESTAMP DEFAULT now(),
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
    review_date TIMESTAMP,
    has_response BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- pending, responded, ignored
    sentiment TEXT, -- positive, neutral, negative
    created_at TIMESTAMP DEFAULT now()
);

-- Responses (AI-generated and published responses)
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    generated_text TEXT NOT NULL,
    edited_text TEXT,
    final_text TEXT, -- What was actually published
    status TEXT DEFAULT 'draft', -- draft, published, failed
    published_at TIMESTAMP,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_reviews_location_status ON reviews(location_id, status);
CREATE INDEX idx_reviews_location_date ON reviews(location_id, review_date DESC);
CREATE INDEX idx_responses_review ON responses(review_id);
CREATE INDEX idx_locations_org ON locations(organization_id);
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only access their own organization
CREATE POLICY "Users can view their own organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own organization"
    ON organizations FOR UPDATE
    USING (
        id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Users: Users can view/update users in their organization
CREATE POLICY "Users can view users in their organization"
    ON users FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update users in their organization"
    ON users FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Voice Profiles: Users can manage voice profiles in their organization
CREATE POLICY "Users can view voice profiles in their organization"
    ON voice_profiles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert voice profiles in their organization"
    ON voice_profiles FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update voice profiles in their organization"
    ON voice_profiles FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete voice profiles in their organization"
    ON voice_profiles FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Locations: Users can manage locations in their organization
CREATE POLICY "Users can view locations in their organization"
    ON locations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert locations in their organization"
    ON locations FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update locations in their organization"
    ON locations FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can delete locations in their organization"
    ON locations FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Reviews: Users can view/manage reviews for their organization's locations
CREATE POLICY "Users can view reviews for their organization's locations"
    ON reviews FOR SELECT
    USING (
        location_id IN (
            SELECT l.id FROM locations l
            JOIN users u ON l.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reviews for their organization's locations"
    ON reviews FOR INSERT
    WITH CHECK (
        location_id IN (
            SELECT l.id FROM locations l
            JOIN users u ON l.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update reviews for their organization's locations"
    ON reviews FOR UPDATE
    USING (
        location_id IN (
            SELECT l.id FROM locations l
            JOIN users u ON l.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

-- Responses: Users can manage responses for their organization's reviews
CREATE POLICY "Users can view responses for their organization's reviews"
    ON responses FOR SELECT
    USING (
        review_id IN (
            SELECT r.id FROM reviews r
            JOIN locations l ON r.location_id = l.id
            JOIN users u ON l.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can insert responses for their organization's reviews"
    ON responses FOR INSERT
    WITH CHECK (
        review_id IN (
            SELECT r.id FROM reviews r
            JOIN locations l ON r.location_id = l.id
            JOIN users u ON l.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

CREATE POLICY "Users can update responses for their organization's reviews"
    ON responses FOR UPDATE
    USING (
        review_id IN (
            SELECT r.id FROM reviews r
            JOIN locations l ON r.location_id = l.id
            JOIN users u ON l.organization_id = u.organization_id
            WHERE u.id = auth.uid()
        )
    );

