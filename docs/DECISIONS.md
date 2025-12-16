# Architectural Decision Records

This document tracks key technical and product decisions for ReplyStack.

---

## ADR-001: Next.js 15 with App Router

**Status:** Accepted
**Date:** December 2024

### Context

We need to choose a frontend framework for ReplyStack. Options considered:
- Next.js 15 (App Router)
- Next.js 14 (Pages Router)
- Remix
- SvelteKit
- Plain React + Express

### Decision

Use **Next.js 15 with App Router**.

### Rationale

1. **Server Components:** Reduce client bundle size, faster initial loads
2. **Unified codebase:** Frontend and API routes in one repo
3. **Vercel integration:** Seamless deployment, edge functions, cron jobs
4. **Ecosystem:** Large community, good documentation, stable
5. **Future-proof:** App Router is the future of Next.js

### Consequences

- Team needs to understand Server vs Client components
- Some third-party libraries may not support RSC yet
- Learning curve for App Router patterns

---

## ADR-002: Supabase for Database and Auth

**Status:** Accepted
**Date:** December 2024

### Context

We need a database and authentication solution. Options considered:
- Supabase (Postgres + Auth)
- Firebase (Firestore + Auth)
- PlanetScale + NextAuth
- Self-hosted Postgres + Auth0

### Decision

Use **Supabase** for both database (PostgreSQL) and authentication.

### Rationale

1. **PostgreSQL:** Relational model fits review data well (foreign keys, joins)
2. **Built-in Auth:** Includes Google OAuth, which we need for GBP API
3. **Row Level Security:** Secure multi-tenant data access
4. **Realtime:** Future option for live updates
5. **Cost:** Generous free tier, predictable pricing
6. **Developer experience:** Great dashboard, good client libraries

### Consequences

- Vendor lock-in for auth (acceptable for MVP)
- Need to learn RLS policy syntax
- Some features require Pro plan ($25/mo)

### Alternatives Rejected

- **Firebase:** NoSQL doesn't fit relational review data
- **PlanetScale:** Would need separate auth solution
- **Self-hosted:** Too much operational overhead for MVP

---

## ADR-003: Claude API for Response Generation

**Status:** Accepted
**Date:** December 2024

### Context

We need an LLM for generating review responses. Options considered:
- Claude API (Anthropic)
- GPT-4 API (OpenAI)
- Gemini API (Google)
- Open-source models (Llama, Mistral)

### Decision

Use **Claude API** with the `claude-sonnet-4-20250514` model.

### Rationale

1. **Tone quality:** Claude produces more natural, human-sounding responses
2. **Instruction following:** Better at following voice profile rules
3. **Safety:** Less likely to generate inappropriate content
4. **Cost:** Sonnet is cost-effective for short responses (~$0.003/response)
5. **Speed:** Fast enough for interactive use (<2s response time)

### Consequences

- Single vendor dependency for AI
- Need to handle API rate limits and errors
- Costs scale linearly with usage

### Future Considerations

- May add GPT-4 as fallback
- Could fine-tune smaller model if costs become issue at scale
- Evaluate new models as released (Claude 4, GPT-5)

---

## ADR-004: Polling vs Webhooks for Review Fetching

**Status:** Accepted
**Date:** December 2024

### Context

We need to detect new Google reviews. Options considered:
- Polling (periodic API calls)
- Webhooks (push notifications)
- Pub/Sub (Google Cloud)

### Decision

Use **polling every 15 minutes** via Vercel Cron.

### Rationale

1. **No webhook available:** Google Business Profile API doesn't offer review webhooks
2. **Simplicity:** Polling is straightforward to implement
3. **Vercel Cron:** Built-in, free for reasonable frequency
4. **Acceptable latency:** 15-minute delay is fine for review responses

### Implementation

```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/cron/poll-reviews",
    "schedule": "*/15 * * * *"
  }]
}
```

### Consequences

- Max 15-minute delay for new reviews
- Need to handle cron execution limits (60s on Vercel)
- Must batch efficiently as user count grows

### Future Considerations

- If Google adds webhooks, migrate to push model
- May need queue system (Inngest) at scale
- Consider user-initiated refresh button

---

## ADR-005: Single Pricing Tier for MVP

**Status:** Accepted
**Date:** December 2024

### Context

We need to decide on initial pricing structure. Options considered:
- Single tier ($49/mo)
- Freemium (free + paid tier)
- Multiple tiers from launch
- Usage-based pricing

### Decision

Launch with **single $49/month tier** with 14-day free trial.

### Rationale

1. **Simplicity:** One price, easy to communicate
2. **Validation:** Test willingness to pay at middle price point
3. **No free tier abuse:** Avoid support burden from non-paying users
4. **Data for pricing:** Learn usage patterns before tiering
5. **Trial conversion focus:** 14-day trial gives enough time to see value

### Consequences

- May lose price-sensitive customers
- May leave money on table from power users
- Need to add tiers in Phase 2

### Phase 2 Pricing (Planned)

| Tier | Price | Designed For |
|------|-------|--------------|
| Starter | $29/mo | Low-volume single location |
| Growth | $79/mo | Active single location |
| Agency | $199/mo | Multi-location / agencies |

---

## ADR-006: Voice Profile as Core Feature

**Status:** Accepted
**Date:** December 2024

### Context

How should we differentiate AI responses from generic ChatGPT output?

### Decision

Make **Voice Profile** a first-class feature with dedicated setup wizard.

### Voice Profile Components

1. **Tone:** friendly, professional, casual, formal
2. **Personality notes:** Free-form business description
3. **Example responses:** 3-5 samples of responses they like
4. **Sign-off style:** How to end responses
5. **Words to use:** Brand terms, values
6. **Words to avoid:** Competitors, sensitive terms
7. **Max length:** Word count limit

### Rationale

1. **Differentiation:** This is our moat—responses that sound like the business
2. **Stickiness:** Time invested in voice profile increases switching cost
3. **Quality:** Better inputs = better outputs
4. **Trust:** Users feel in control of their brand voice

### Consequences

- Longer onboarding (mitigated by wizard UX)
- Need to store and version voice profiles
- Prompts become more complex

---

## ADR-007: Optimistic UI for Response Publishing

**Status:** Accepted
**Date:** December 2024

### Context

Publishing a response to Google takes 2-5 seconds. How should we handle the UX?

### Decision

Use **optimistic UI updates** with background publishing.

### Flow

1. User clicks "Publish"
2. UI immediately shows "Published" state
3. Background request sent to Google API
4. If success: Done (already showing correct state)
5. If failure: Revert UI, show error toast, offer retry

### Rationale

1. **Perceived speed:** Feels instant to user
2. **High success rate:** Google API rarely fails
3. **Easy recovery:** Clear error state and retry option

### Implementation

```typescript
// Simplified example
async function publishResponse(responseId: string) {
  // Optimistic update
  setResponseStatus(responseId, 'published');

  try {
    await api.publishToGoogle(responseId);
  } catch (error) {
    // Revert on failure
    setResponseStatus(responseId, 'draft');
    toast.error('Failed to publish. Please try again.');
  }
}
```

### Consequences

- Need robust error handling
- Must track true publish status in database
- Could show false positive briefly on failure

---

## ADR-008: Token Encryption Strategy

**Status:** Accepted
**Date:** December 2024

### Context

We store Google OAuth refresh tokens. These are sensitive and must be protected.

### Decision

Encrypt tokens at rest using **Supabase Vault** (preferred) or **application-level encryption** (fallback).

### Option A: Supabase Vault (Preferred)

```sql
-- Store encrypted
INSERT INTO users (email, google_refresh_token)
VALUES ('user@example.com', vault.encrypt('refresh_token_value'));

-- Retrieve decrypted
SELECT vault.decrypt(google_refresh_token) FROM users WHERE id = ?;
```

### Option B: Application-Level Encryption

```typescript
import { createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY; // 32 bytes

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  // ... implementation
}
```

### Rationale

1. **Compliance:** Required for handling OAuth tokens responsibly
2. **Breach protection:** Encrypted tokens useless without key
3. **Best practice:** Industry standard for sensitive data

### Consequences

- Key management responsibility (store in env vars)
- Quarterly key rotation recommended
- Slightly more complex token operations

---

## Template for New Decisions

```markdown
## ADR-XXX: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded
**Date:** [Date]

### Context

[What is the issue that we're seeing that is motivating this decision?]

### Decision

[What is the change that we're proposing and/or doing?]

### Rationale

[Why is this the best choice? What alternatives were considered?]

### Consequences

[What are the positive and negative implications of this decision?]
```
