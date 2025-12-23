# Technical Architecture

## Stack Overview

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 16 (App Router, React 19) | Fast, good DX, unified codebase |
| Backend | Next.js API routes | Edge-ready, no separate server |
| Database | PostgreSQL via Supabase | Relational fits review data, auth included |
| Auth | Supabase Auth + Google OAuth | Need Google OAuth for Business Profile API |
| Payments | Stripe | Subscription-native |
| AI | Claude API (Sonnet) | Best natural tone for business communication |
| Styling | Tailwind CSS v4 | Modern utility-first styling |
| Deployment | Vercel | Natural Next.js fit |
| Email | Resend | Simple transactional email |

---

## Implementation Status (Dec 2025)

- **Implemented:** project setup, Supabase client/middleware, authentication flows, Google Business Profile integration (OAuth, location sync, review polling), Claude AI integration (response generation and custom tone generation), voice profile API, review management API, response publishing to Google, token encryption (AES-256-GCM), landing page, response editing modal (with review context, character/word counts, accessibility features), dashboard UI with data integration (reviews page with functional filters and generate response button), tone quiz with custom tone generation (10-question interactive quiz), custom tones API and UI integration, notification preferences API and UI, location management API.
- **Partially implemented:** Stripe integration (webhook stub exists, checkout/portal pending), email notifications (preferences API/UI done, sending pending), voice profile UI (example responses and words to use/avoid fields missing in UI, API supports them).
- **Not implemented:** Stripe checkout/portal, email sending (Resend integration), review management features (ignore, search, date filters), regenerate response button, optimistic UI updates.

---

## Database Schema

```sql
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
    tone TEXT DEFAULT 'warm',
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
    generated_text TEXT, -- Nullable: null for direct publishes, contains AI-generated text for AI responses
    edited_text TEXT,
    final_text TEXT, -- What was actually published
    status TEXT DEFAULT 'draft', -- draft, published, failed
    published_at TIMESTAMP,
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(review_id) -- One response per review
);

-- Custom Tones (AI-generated personalized tones from tone quiz)
CREATE TABLE custom_tones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    enhanced_context TEXT, -- Additional context from quiz for AI prompts
    quiz_responses JSONB, -- Store quiz answers for reference/regeneration
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Preferences (user-level email notification settings)
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cron Poll State (tracks last processed timestamp per tier for review polling)
CREATE TABLE cron_poll_state (
    tier TEXT PRIMARY KEY CHECK (tier IN ('starter', 'growth', 'agency')),
    last_processed_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_reviews_location_status ON reviews(location_id, status);
CREATE INDEX idx_reviews_location_date ON reviews(location_id, review_date DESC);
CREATE INDEX idx_responses_review ON responses(review_id);
CREATE INDEX idx_locations_org ON locations(organization_id);
CREATE INDEX idx_custom_tones_org ON custom_tones(organization_id);
```

---

## External Integrations

### Google Business Profile API

**Authentication:**
- OAuth 2.0 with `https://www.googleapis.com/auth/business.manage` scope
- Store refresh token encrypted at rest
- Token refresh handled automatically before API calls

**Endpoints Used:**

| Endpoint | Purpose |
|----------|---------|
| `accounts.list` | Get user's GBP accounts |
| `accounts.locations.list` | Get locations for an account |
| `accounts.locations.review.list` | Fetch reviews for a location |
| `accounts.locations.review.updateReply` | Publish response to a review |

**Polling Strategy:**
- No webhook available from Google for new reviews
- Poll every 15 minutes per active location
- Use Vercel Cron for scheduled polling
- Store `lastFetchedAt` per location to fetch only new reviews
- Rate limit: Max 60 requests/minute across all users

**Error Handling:**
- Retry with exponential backoff on 5xx errors
- Re-authenticate on 401 (token expired)
- Alert user on 403 (permissions revoked)

### Claude API

**Model:** `claude-haiku-4-5-20251001` (alias: `claude-haiku-4-5`)

**Cost Estimation:**
- Average response: ~100 tokens output
- With context: ~500 tokens input
- Cost per response: ~$0.001 (Haiku pricing: $1.00/M input, $5.00/M output)
- 1000 responses/month: ~$1

**Implementation:**
- See [PROMPTS.md](./PROMPTS.md) for prompt architecture
- Streaming disabled (responses are short)
- Timeout: 30 seconds
- Retry: 2 attempts on failure (exponential backoff)
- Error handling: 401/403/429 errors are not retried

### Stripe

**Products:**
- Single subscription product for MVP
- Price: $49/month
- 14-day free trial included

**Integration Points:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription, activate account |
| `customer.subscription.updated` | Update plan tier |
| `customer.subscription.deleted` | Downgrade to free/pause account |
| `invoice.payment_failed` | Send payment failure email |

**Webhooks:**
- Endpoint: `/api/webhooks/stripe`
- Verify webhook signature
- Idempotent handling (store processed event IDs)

### Resend (Email)

**Transactional Emails:**
- New review notification
- Daily review digest
- Trial ending reminder
- Payment failed notification
- Welcome email

---

## Key Technical Decisions

### 1. Server Components by Default

Use React Server Components for all pages and components except:
- Interactive forms (voice profile editor)
- Real-time elements (if any)
- Components needing browser APIs

Benefits: Smaller bundle, faster initial load, simpler data fetching.

### 2. Token Encryption

Google refresh tokens are encrypted at the application layer before database storage using AES-256-GCM:

**Implementation:** `lib/crypto/encryption.ts`

- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key:** 32-byte (256-bit) key from `TOKEN_ENCRYPTION_KEY` env var
- **IV:** 12 random bytes per encryption (GCM recommendation)
- **Auth Tag:** 16 bytes (128-bit) for integrity verification
- **Storage Format:** `base64(IV || ciphertext || authTag)`

**Key Management:**

- Generate key: `openssl rand -hex 32`
- Store in environment variable (never in code or logs)
- Rotate quarterly or upon suspected compromise

**Key Rotation Procedure:**

1. **Prepare:** Set new key in `TOKEN_ENCRYPTION_KEY`, old key in `TOKEN_ENCRYPTION_KEY_OLD`
2. **Deploy:** The `decryptToken()` function automatically tries primary key first, falls back to old key
3. **Re-encrypt:** Run `npx tsx scripts/reencrypt-tokens.ts` (use `--dry-run` first to verify)
4. **Cleanup:** Remove `TOKEN_ENCRYPTION_KEY_OLD` after all tokens are re-encrypted

**Error Handling:**

- Decryption failures (corrupted data, wrong key) throw `TokenDecryptionError`
- API routes catch this error, clear the corrupted token, and prompt user to re-authenticate
- Invalid key configuration throws `TokenEncryptionConfigError` at startup

### 3. Background Jobs via Vercel Cron

Review polling runs on schedule:
```
# vercel.json
{
  "crons": [{
    "path": "/api/cron/poll-reviews",
    "schedule": "*/15 * * * *"
  }]
}
```

Considerations:
- Max 60-second execution time on Vercel
- Batch locations if many users
- Use queue for scale (future: Inngest or similar)

### 4. Optimistic UI Updates

When publishing a response:
1. Immediately show "Published" state in UI
2. Send publish request to Google in background
3. If fails, revert UI and show error toast

Improves perceived performance significantly.

---

## Directory Structure

```
ReplyStack/
├── app/
│   ├── (auth)/{login,page.tsx; signup/page.tsx; callback/route.ts; layout.tsx}
│   ├── (dashboard)/{dashboard/page.tsx; reviews/page.tsx; settings/page.tsx; billing/page.tsx; layout.tsx}
│   ├── api/{reviews/route.ts; responses/route.ts; webhooks/stripe/route.ts; cron/poll-reviews/route.ts; auth/}
│   ├── pricing-faq/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/{landing/live-demo.tsx; reviews/review-card.tsx; voice-profile/voice-editor.tsx; ui/button.tsx}
├── lib/{supabase/*; google/client.ts; claude/client.ts; stripe/client.ts; utils/format.ts}
├── docs/
│   └── templates/ (Code templates for common patterns)
├── tests/ (Vitest, mirrors app/lib/components)
├── public/
└── middleware.ts
```

---

## Development Workflow

### Code Templates

The project includes a template system (`docs/templates/`) to standardize code patterns and reduce token usage when building repetitive parts of the system.

**Usage:**
1. Check `docs/templates/INDEX.md` to find relevant templates
2. Read only the specific template file needed (e.g., `docs/templates/api-routes.md`)
3. Navigate to the specific template section using anchor links
4. Adapt the template for your use case

**Available Categories:**
- **API Routes**: GET, POST, PATCH, DELETE, cron job patterns
- **Components**: Form components, display components
- **Server Components**: Pages with data fetching
- **Database**: Query patterns, joins, upserts
- **Patterns**: Error handling, authentication, constants, types

**Benefits:**
- Reduced context usage (load only needed templates)
- Consistent patterns across the codebase
- Faster development with proven patterns
- Better maintainability

See [docs/templates/INDEX.md](./templates/INDEX.md) for the full template catalog.

---

## Security Considerations

| Risk | Mitigation |
|------|------------|
| Token theft | Encrypt at rest, never log tokens |
| XSS | Next.js sanitizes by default, CSP headers |
| CSRF | Supabase handles with secure cookies |
| SQL injection | Parameterized queries via Supabase client |
| Rate limiting | Implement per-user rate limits on AI generation |
| Data access | Row-level security (RLS) policies in Supabase |
