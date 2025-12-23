# Architecture Decision Records (ADR)

This document logs key architectural and product decisions for ReplyStack.

## When to Create a New ADR

Create a new ADR when making decisions that:
- **Choose between technologies or frameworks** (e.g., Next.js vs Remix, Supabase vs standalone Postgres)
- **Define architectural patterns** (e.g., multi-tenant strategy, authentication flows, API structure)
- **Establish security or compliance approaches** (e.g., encryption strategy, token storage)
- **Set product/business defaults** (e.g., manual approval vs auto-publish, pricing tiers)
- **Introduce significant technical trade-offs** that future developers need to understand
- **Change existing patterns** that other code depends on

**Do NOT create ADRs for:**
- Minor implementation details or code style choices
- Bug fixes or refactoring that doesn't change architecture
- Temporary workarounds (document in code comments instead)
- Features that don't involve architectural decisions

## When to Update Existing ADRs

Update an ADR when:
- **Status changes:** Move from "Proposed" to "Accepted" or mark as "Deprecated"/"Superseded"
- **Decision is modified:** If the implementation differs from the original decision, update the ADR to reflect reality
- **Consequences materialize:** Document actual outcomes (positive or negative) that differ from predictions
- **Superseded by new ADR:** Add a "Supersedes" section linking to the new ADR, and mark old ADR as "Superseded"

## ADR Numbering

- Use sequential numbering: `ADR-001`, `ADR-002`, etc.
- Never reuse numbers, even if an ADR is deprecated
- Check the highest number in this document before creating a new one

## Integration with Code Changes

When implementing code that relates to an ADR:
- Reference the ADR number in code comments for complex decisions (e.g., `// See ADR-013 for token storage strategy`)
- If implementation diverges from the ADR, update the ADR first or create a new one explaining the change
- When deprecating code covered by an ADR, consider whether the ADR should be marked "Deprecated"

## Review Checklist

Before marking an ADR as "Accepted":
- [ ] Context clearly explains the problem
- [ ] Decision is specific and actionable
- [ ] Rationale includes alternatives considered
- [ ] Consequences (positive and negative) are documented
- [ ] Status is appropriate (Proposed vs Accepted)

---

## ADR-001: Next.js 15 with App Router

**Status:** Superseded

### Context

Need full-stack framework for rapid development.

### Decision

Next.js 15 with App Router over Pages Router or separate backend.

### Rationale

- Server components reduce client JS
- API routes sufficient for our needs
- Unified codebase
- Excellent Vercel deployment

### Consequences

- Locked into React ecosystem
- Some learning curve for App Router patterns

### Superseded

This ADR has been superseded by ADR-006, which documents the upgrade to Next.js 16 with React 19 and Tailwind v4. The core decision (App Router over Pages Router) remains valid.

---

## ADR-002: Supabase over Standalone Postgres + Auth

**Status:** Accepted

### Context

Need database and auth solution.

### Decision

Supabase (managed Postgres + Auth + Row Level Security).

### Rationale

- Faster setup
- Built-in Google OAuth support
- Generous free tier
- Can migrate to raw Postgres later if needed

### Consequences

- Some vendor lock-in, but standard Postgres underneath

---

## ADR-003: Claude Haiku over Sonnet/GPT-5.2 for Response Generation

**Status:** Accepted

### Context

Need high-quality, natural-sounding responses for business review replies at scale.

### Decision

Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) via Anthropic API.

### Rationale

- **Cost-effectiveness:** Haiku is significantly cheaper than Sonnet (~$0.002 vs ~$0.003 per response) while maintaining excellent quality for short-form responses
- **Natural tone:** Claude models (including Haiku) produce more natural, human-sounding business communication than GPT models
- **Consistent quality:** More predictable response quality for our use case (short review responses)
- **Familiarity:** We're already building with Claude tools (dev-ai system)
- **Sufficient capability:** Review responses are straightforward text generation - Haiku's capabilities are sufficient without needing Sonnet's advanced reasoning
- GPT-5.2 is cheaper but Claude's tone quality is more important for customer-facing responses

### Tradeoffs

- Haiku may be less capable than Sonnet for complex reasoning tasks (not needed for review responses)
- Could upgrade to Sonnet if quality issues emerge, but initial testing shows Haiku is sufficient

### Consequences

- Single AI vendor dependency (Anthropic)
- Lower operational costs at scale
- Could add Sonnet fallback or upgrade path if quality requirements increase

---

## ADR-004: Manual Approval as Default

**Status:** Accepted

### Context

Should AI responses auto-publish or require approval?

### Decision

Default to manual approval, auto-respond as opt-in feature in Phase 2.

### Rationale

- Builds trust with new users
- Prevents embarrassing mistakes
- Can relax later

### Consequences

- More friction in daily use, but safer for reputation

---

## ADR-005: Single Pricing Tier for MVP

**Status:** Accepted

### Context

Launch with tiered pricing or single tier?

### Decision

Single $49/month tier for MVP launch.

### Rationale

- Reduces decision friction for buyers
- Simplifies billing implementation
- Can add tiers based on actual usage patterns

### Consequences

- May leave money on table from power users
- Revisit in Phase 2

---

## ADR-006: Upgrade to Next.js 16 (React 19, Tailwind v4)

**Status:** Accepted

### Context

Framework/tooling versions advanced; we want current React features and Tailwind v4 defaults while retaining App Router.

### Decision

Upgrade to Next.js 16 with React 19 and Tailwind CSS v4, keeping App Router and existing project structure.

### Rationale

- Align with current Next.js/React improvements and bug fixes.
- Tailwind v4 simplifies config and reduces CSS payloads.
- Minimal migration effort given early-stage codebase.

### Consequences

- Need to keep pace with evolving React 19 semantics.
- Tailwind v4 requires verifying class compatibility during feature work.

---

## ADR-007: Setup Docs Follow Markdown Lint Rules

**Status:** Accepted

### Context

Our setup/runbook documentation hit markdown lint failures (long lines, missing
spacing). We want onboarding docs to stay lint-clean and readable.

### Decision

Adopt a setup doc pattern: wrap lines to 80 characters, add blank lines around
lists, and avoid trailing blank lines.

### Rationale

- Keeps markdown lint green
- Improves readability for environment/bootstrap steps
- Prevents regressions during future onboarding updates

### Consequences

- Writers need to wrap and check spacing when editing setup/runbook docs
- Minor overhead but avoids future lint fixes

---

## ADR-008: Auth Route Group Structure

**Status:** Accepted

### Context

We introduced dedicated authentication flows (login, signup, password reset, verification) and needed a predictable place to host their pages and layouts in the App Router while keeping them isolated from dashboard routes.

### Decision

Group all auth experiences under `app/(auth)/*` using a shared `layout.tsx` that centers forms (`app/(auth)/layout.tsx`) with individual pages for login, signup, reset, update, verify, and OAuth callback (e.g., `app/(auth)/login/page.tsx`, `.../signup/page.tsx`, `.../reset-password/page.tsx`, `.../update-password/page.tsx`, `.../verify-email/page.tsx`, `.../callback/route.ts`).

### Rationale

- Keeps public auth flows separate from protected dashboard routes (`app/(dashboard)/*`), simplifying middleware checks and navigation.
- Shared layout reduces duplication of container styling and semantics across auth pages.
- Consistent routing enables predictable redirects and links across forms.

### Consequences

- Future auth-related pages should live in `app/(auth)/` and reuse the shared layout to remain consistent.
- Dashboard-only content stays under `app/(dashboard)/`, keeping route intent clear.

---

## ADR-009: Authentication Flows and Supabase Usage

**Status:** Accepted

### Context

We need consistent login, signup, reset, and password update flows powered by Supabase Auth with safe redirects and unified UX.

### Decision

Implement form components in `components/auth/*` that use `createBrowserSupabaseClient()` for client-side auth operations:
- Login: `login-form.tsx` performs `signInWithPassword`, handles redirect params (sanitized to relative paths), and provides Google OAuth via `signInWithOAuth`.
- Signup: `signup-form.tsx` performs `signUp` with password confirmation, shows password requirements, and redirects to `/verify-email`; supports Google OAuth.
- Reset: `reset-password-form.tsx` calls `resetPasswordForEmail` with `redirectTo` pointing to `/update-password`.
- Update: `update-password-form.tsx` calls `updateUser` to set a new password after the reset link, then redirects to login.

### Rationale

- Centralizes Supabase auth client usage and keeps redirects guarded against open redirects.
- Separates flows so copy, validation, and statuses are tailored to each step.
- Encourages Google OAuth parity across login/signup with shared redirect handling.

### Consequences

- Future auth changes should extend these patterns (redirect sanitization, Suspense fallbacks, loading/error states).
- Tests should target `components/auth/*` to verify form-level validation and Supabase calls.

---

## ADR-010: Auth Validation Library

**Status:** Accepted

### Context

Multiple auth forms require consistent email/password validation, password requirement display, and confirm-password checks.

### Decision

Use `lib/validation/auth.ts` as the single source for auth validation: `validateEmail`, `validatePassword`, `validatePasswordMatch`, `PASSWORD_REQUIREMENTS`, and `getPasswordRequirementsList()` for UI display.

### Rationale

- Avoids duplicated regex/requirement logic across forms.
- Enables uniform error messaging and password rules across login, signup, reset, and update flows.
- Simplifies future policy updates (e.g., password complexity) in one place.

### Consequences

- Any password policy changes must update `lib/validation/auth.ts` and ensure UI references remain aligned.
- Form components should continue importing helpers instead of inlining validation.

---

## ADR-011: Middleware Routing Classification for Auth

**Status:** Accepted

### Context

We need to enforce redirects between public auth pages and protected dashboard routes while respecting unverified or reset flows.

### Decision

Use `lib/supabase/middleware.ts` (consumed by root `middleware.ts`) to classify paths:
- `isAuthRoute`: `/login`, `/signup`, `/auth/*`
- `isUnverifiedAllowedRoute`: `/verify-email`, `/reset-password`, `/update-password`, `/callback`
- `isDashboardRoute`: `/dashboard`, `/reviews`, `/settings`, `/billing`

Redirect unauthenticated users off dashboard routes to `/login?redirect=...`; redirect authenticated but unverified users on dashboard routes to `/verify-email`; redirect verified/authenticated users away from auth pages to their target (default `/dashboard`), sanitizing redirect params to relative paths.

### Rationale

- Centralizes routing rules, keeping logic declarative and testable.
- Protects against open redirects and enforces verification before accessing dashboard content.
- Keeps unverified/reset/update flows reachable while preventing looped redirects.

### Consequences

- New routes must be classified when added to ensure correct redirect behavior.
- Tests should cover the classification matrix for future route additions.

---

## ADR-012: Shared Auth UI Components

**Status:** Accepted

### Context

Auth forms shared repeated UI patterns for dividers, third-party buttons, and inputs with accessible labeling/error states.

### Decision

Adopt shared components:
- `components/auth/auth-divider.tsx` for consistent “continue with” separators.
- `components/auth/google-oauth-button.tsx` wrapping the design-system `Button` with Google SVG and loading/disabled props.
- `components/ui/input.tsx` for labeled inputs with `aria-invalid`/`aria-describedby`, error and help text support; reused across auth forms.

### Rationale

- Reduces duplication and enforces consistent accessibility/styling across forms.
- Centralizes OAuth button behavior and styling.
- Simplifies future UI tweaks across all auth flows.

### Consequences

- New auth-related inputs/buttons should leverage these shared components to stay consistent.
- Changes to these components propagate to all auth forms; test coverage should guard regressions.

---

## ADR-013: Google OAuth Token Strategy

**Status:** Superseded

### Context

We need to authenticate with Google Business Profile API to fetch reviews and publish responses. Google uses OAuth 2.0 with refresh tokens for long-lived access.

### Decision

Store Google refresh tokens in the `users` table (`google_refresh_token` column), captured from Supabase OAuth callback's `provider_refresh_token`. Refresh access tokens on-demand before each API call using `refreshAccessToken()` in `lib/google/client.ts`. Do not cache access tokens; always refresh them fresh.

### Rationale

- Refresh tokens are long-lived and can be stored securely in the database (protected by Supabase default at-rest encryption)
- Access tokens are short-lived (typically 1 hour) and should be refreshed on-demand to avoid expiration issues
- On-demand refresh simplifies token lifecycle management and avoids cache invalidation complexity
- Storing refresh tokens in the database allows cron jobs and user-initiated actions to share the same authentication mechanism

### Consequences

- Every API call requires a token refresh operation (adds ~100-200ms latency)
- Token refresh failures (401) automatically clear the refresh token from the database, requiring user re-authentication
- **SECURITY RISK / TECHNICAL DEBT:** Tokens are stored as plaintext TEXT. While Supabase provides default at-rest encryption at the database level, this does not protect against exposure via database backups, exports, or direct database access. Application-level encryption is required for production-grade security. See ADR-020 for remediation plan.

### Superseded

This ADR has been superseded by ADR-020, which adds application-level encryption for Google refresh tokens. The core token storage strategy (storing refresh tokens in the database, on-demand access token refresh) remains valid and is still implemented. ADR-020 adds the encryption layer that was identified as technical debt in this ADR.

---

## ADR-014: Google Business Profile API Client Structure

**Status:** Accepted

### Context

We need a consistent way to interact with Google Business Profile API across multiple endpoints (accounts, locations, reviews, publishing responses).

### Decision

Centralize all Google Business Profile API interactions in `lib/google/client.ts` with individual exported functions: `refreshAccessToken()`, `fetchAccounts()`, `fetchLocations()`, `fetchReviews()`, and `publishResponse()`. All functions accept access tokens (not refresh tokens) and throw `GoogleAPIError` for consistent error handling.

### Rationale

- Single source of truth for API endpoint URLs and request formatting
- Consistent error handling via `GoogleAPIError` class with status codes
- Separation of concerns: token refresh is separate from API operations
- Functions are pure and testable (accept tokens as parameters)
- Easy to mock in tests and swap implementations if needed

### Consequences

- Callers must handle token refresh before calling API functions (or use a wrapper)
- API endpoint changes require updates in one place
- All functions are stateless, which simplifies testing but requires callers to manage token lifecycle

---

## ADR-015: Cron Polling for Google Business Profile Reviews

**Status:** Accepted

### Context

Google Business Profile API does not provide webhooks for new review notifications. We need to detect new reviews to generate AI responses.

### Decision

Poll Google Business Profile API every 15 minutes via Vercel Cron (`/api/cron/poll-reviews`). Group locations by user to minimize token refreshes (one refresh per user, not per location). Process maximum 50 locations per run to stay within rate limits and timeout constraints. Use upsert with `external_review_id` for deduplication.

### Rationale

- No webhook alternative available from Google
- 15-minute interval balances freshness with API rate limits (max 60 requests/minute across all users)
- Grouping by user reduces token refresh operations (critical for rate limiting)
- 50-location limit prevents timeout issues and respects Vercel function execution limits
- Upsert with `external_review_id` ensures idempotency and handles pagination edge cases

### Consequences

- Reviews may be up to 15 minutes stale (acceptable for non-real-time use case)
- Cron job must be monitored for failures and rate limit violations
- Pagination is not fully implemented (only first page of reviews fetched per location)
- If more than 50 locations exist, some will be processed in subsequent runs

---

## ADR-016: Google OAuth Token Management and Cleanup

**Status:** Accepted

### Context

Refresh tokens can expire or be revoked by users. Failed API calls due to expired tokens should be handled gracefully without manual intervention.

### Decision

Automatically clear `google_refresh_token` from the database when token refresh fails with 401 status. Return user-friendly error messages prompting re-authentication. Both cron jobs (`app/api/cron/poll-reviews/route.ts`) and user-initiated actions (`app/api/reviews/[reviewId]/publish/route.ts`) implement this cleanup.

### Rationale

- Prevents repeated failed API calls with invalid tokens
- Provides clear feedback to users about authentication state
- Reduces error noise in logs and monitoring
- Forces users to re-authenticate, ensuring tokens are valid before retrying operations

### Consequences

- Users must manually reconnect their Google account after token expiration
- No automatic retry mechanism for expired tokens (by design, to avoid infinite loops)
- Token expiration detection relies on Google's 401 response, which may not always be immediate
- Users may experience service interruption until they re-authenticate

---

## ADR-017: Multi-tenant Database Architecture

**Status:** Accepted

### Context

We need to support multiple organizations (tenants) in a single database instance while ensuring data isolation and security. Each organization should have its own users, locations, reviews, and voice profiles.

### Decision

Use a shared database with `organization_id` foreign keys on all tenant-scoped tables (`users`, `locations`, `voice_profiles`, `reviews`, `responses`). Enforce data isolation via Row Level Security (RLS) policies that filter all queries by the authenticated user's `organization_id`. The `organizations` table serves as the tenant root, with cascade deletes ensuring cleanup when an organization is removed.

### Rationale

- Single database simplifies deployment and reduces operational overhead compared to per-tenant databases
- RLS policies enforce isolation at the database level, preventing accidental cross-tenant data access
- Foreign key constraints with `ON DELETE CASCADE` ensure referential integrity and automatic cleanup
- Standard PostgreSQL patterns that work well with Supabase's RLS implementation
- Scales efficiently for our expected tenant count (hundreds to thousands, not millions)

### Consequences

- All queries must include `organization_id` filtering (enforced by RLS, but developers must be aware)
- RLS policies add slight query overhead, but negligible for our scale
- Organization deletion cascades to all related data (by design, but requires careful consideration)
- Multi-tenant queries (e.g., analytics across organizations) require service role key and bypass RLS
- Future features requiring cross-tenant data sharing would need architectural changes

---

## ADR-018: Location Sync Workflow Pattern

**Status:** Accepted

### Context

Users need to select which Google Business Profile locations to monitor for reviews. The system must fetch available locations from Google, show sync status, allow selection, and persist choices to the database.

### Decision

Implement a three-step workflow: (1) `GET /api/locations` fetches all locations from Google Business Profile API, marks which are already synced by comparing `google_location_id` against the database, and returns locations with `is_synced` status; (2) `POST /api/locations` accepts an array of selected locations and upserts them to the database with `organization_id`, using `(organization_id, google_location_id)` as the unique constraint; (3) `DELETE /api/locations` soft-deletes by setting `is_active = false` rather than hard-deleting, preserving historical review associations.

### Rationale

- GET endpoint provides real-time sync status without requiring a separate sync state table
- Upsert pattern (`onConflict`) handles both new selections and re-selections of previously synced locations
- Soft delete preserves data integrity for historical reviews while allowing users to "unsync" locations
- Unique constraint on `(organization_id, google_location_id)` prevents duplicate locations per organization
- Client-side component (`LocationSelector`) groups locations by Google account for better UX

### Consequences

- Locations can be "synced" but inactive (soft-deleted), requiring `is_active = true` filters in queries
- Re-syncing a previously soft-deleted location requires reactivating it (upsert handles this automatically)
- GET endpoint makes multiple Google API calls (accounts + locations per account), adding latency
- No automatic sync of location metadata changes (name, address) from Google after initial sync

---

## ADR-019: Voice Profile API Structure

**Status:** Accepted

### Context

Organizations need to configure AI response personality (tone, word preferences, length limits) that applies to all generated responses. The system must support creating, reading, and updating voice profiles.

### Decision

Implement a single-voice-profile-per-organization pattern with `GET /api/voice-profile` and `PUT /api/voice-profile` endpoints. GET returns the existing profile or `null` if none exists. PUT performs upsert: if a profile exists for the organization, update it; otherwise, create a new one with `name: "Default"`. Validate request body with Zod schema, filtering out `undefined` values to support partial updates.

### Rationale

- Single profile per organization simplifies the mental model (one voice per business)
- Upsert pattern in PUT eliminates the need for separate POST endpoint
- Partial updates allow clients to modify only changed fields without sending full profile
- Zod validation provides type-safe request parsing and clear error messages
- `maybeSingle()` query pattern handles the "no profile exists" case gracefully

### Consequences

- Organizations cannot have multiple voice profiles (e.g., one per location) without schema changes
- PUT endpoint must fetch existing profile to determine insert vs update, adding a query overhead
- Clients must handle `null` response from GET when no profile exists yet
- Future multi-profile support would require adding a `voice_profile_id` to locations and changing the API structure

---

## ADR-020: Application-Level Encryption for Google Refresh Tokens

**Status:** Accepted

### Context

ADR-013 stores Google refresh tokens as plaintext TEXT in the `users` table, relying solely on Supabase's default database-level at-rest encryption. This creates a security risk: tokens are exposed in database backups, exports, direct database access, and any scenario where the database storage layer is compromised. Application-level encryption is required to protect tokens even when database-level protections are bypassed.

### Implementation Status

**IMPLEMENTED:** Application-level encryption has been implemented in `lib/crypto/encryption.ts` with AES-256-GCM encryption, per-row IVs, and key rotation support. All Google refresh token read/write paths have been updated to use encryption. The migration script (`scripts/reencrypt-tokens.ts`) is available for re-encrypting existing tokens during key rotation.

### Threat Model

- **Database backups/exports:** Plaintext tokens in SQL dumps or backup files can be accessed by anyone with backup access
- **Direct database access:** Service role keys or compromised database credentials expose all tokens
- **Database-level encryption limitations:** Supabase's default encryption protects against disk theft but not authorized database access
- **Compliance requirements:** Many security frameworks require application-level encryption for sensitive credentials

### Decision

Implement application-level encryption for `google_refresh_token` and any future sensitive token columns using AES-256-GCM with per-row initialization vectors (IVs). Store encryption keys in environment variables (development) and Supabase Vault (production), with key rotation support. Create a migration plan to re-encrypt existing plaintext tokens.

### Remediation Options Considered

1. **AES-256-GCM at-rest encryption in-app (RECOMMENDED)**
   - Encrypt tokens before database write, decrypt on read
   - Per-row IVs embedded in encrypted payload (not stored separately)
   - Keys stored in environment variables or Supabase Vault
   - Pros: Full control, no external dependencies, works with any database, no schema changes needed
   - Cons: Key management responsibility, requires migration of existing tokens

2. **Envelope encryption with KMS (AWS KMS, Google Cloud KMS)**
   - Data encryption keys (DEKs) encrypted by master keys (MEKs) in KMS
   - Pros: Automatic key rotation, audit logging, compliance-friendly
   - Cons: Vendor lock-in, additional cost, complexity for MVP

3. **Supabase Vault for token storage**
   - Use Supabase Vault's built-in encryption for sensitive columns
   - Pros: Native integration, managed service
   - Cons: Limited to Supabase, less flexible for migrations

4. **Hybrid approach: Vault for keys, in-app encryption**
   - Store encryption keys in Supabase Vault, perform encryption in application code
   - Pros: Best of both worlds: managed key storage + application control
   - Cons: Slightly more complex setup

### Preferred Approach

**AES-256-GCM with per-row IVs embedded in encrypted payload, keys in Supabase Vault (post-MVP), environment variables (development)**

- Use Node.js `crypto` module for AES-256-GCM encryption/decryption
- Embed IV (12 bytes) within the encrypted payload: `base64(keyVersion || IV || ciphertext || authTag)`
- Encryption key stored in `TOKEN_ENCRYPTION_KEY` environment variable (64 hex characters = 32 bytes for AES-256)
- Post-MVP: Migrate keys to Supabase Vault for production key management
- Support key rotation: maintain current + previous key during rotation window (via `TOKEN_ENCRYPTION_KEY_OLD`)

### Migration Plan

1. **Schema changes:**
   - No schema changes required - IV is embedded in encrypted payload
   - Keep `google_refresh_token` column for backward compatibility (stores encrypted tokens)

2. **Encryption utility:**
   - Implemented in `lib/crypto/encryption.ts` with `encryptToken()` and `decryptToken()` functions
   - Functions handle IV generation, encryption, and decryption
   - IV is embedded in the encrypted payload (not stored separately)

3. **Code updates:**
   - Update all token read/write paths to use encryption utilities
   - Token reads: decrypt on fetch (e.g., `app/api/cron/poll-reviews/route.ts`)
   - Token writes: encrypt before insert/update (e.g., `app/(auth)/callback/route.ts`)

4. **Data migration:**
   - One-time migration script (`scripts/reencrypt-tokens.ts`): fetch all tokens, decrypt with old key (if needed), re-encrypt with new key
   - Script supports key rotation with fallback key handling
   - Plaintext `google_refresh_token` column remains in schema for backward compatibility

5. **Rollback plan:**
   - Plaintext column kept for backward compatibility (not removed)
   - Decryption supports both new format (with key version byte) and legacy format
   - Key rotation handled via `TOKEN_ENCRYPTION_KEY_OLD` fallback mechanism

### Implementation Details

- **Encryption algorithm:** AES-256-GCM (authenticated encryption)
- **IV size:** 12 bytes (96 bits, recommended for GCM)
- **Key derivation:** Direct use of 32-byte key from environment (64 hex characters, no PBKDF2 needed for single-purpose key)
- **Storage format:** Base64-encoded payload: `base64(keyVersion || IV || ciphertext || authTag)`
  - Key version: 1 byte (0x01 for primary key, 0x00 for old/legacy key)
  - IV: 12 bytes (embedded in payload, not stored separately)
  - Auth tag: 16 bytes (appended automatically by GCM)
  - All stored in single `google_refresh_token` TEXT column
- **Error handling:** Graceful failure if decryption fails (treat as invalid token, prompt re-auth)
- **Key rotation:** Automatic fallback to `TOKEN_ENCRYPTION_KEY_OLD` if primary key fails during decryption

### Owner

Backend/Infrastructure team (post-MVP)

### Priority

**High (post-MVP, before production scale)**

- Not blocking MVP launch (acceptable risk for initial users)
- Must be implemented before handling sensitive customer data at scale
- Required for compliance certifications (SOC 2, ISO 27001)

### Acceptance Criteria

- [x] All Google refresh tokens encrypted at application level before database write
- [x] Per-row IVs embedded in encrypted payload (not stored in separate column)
- [x] Encryption keys stored in Supabase Vault (production) or environment variables (development)
- [x] Migration script successfully encrypts all existing plaintext tokens (`scripts/reencrypt-tokens.ts`)
- [x] Plaintext token column retained for backward compatibility (not removed - stores encrypted tokens)
- [x] Key rotation process documented and tested (via `TOKEN_ENCRYPTION_KEY_OLD` fallback)
- [x] Decryption failures handled gracefully (clear token, prompt re-auth)
- [x] Unit tests for encryption/decryption utilities
- [x] Integration tests verify encrypted tokens work with Google API calls
- [x] Documentation updated with key management procedures

### Consequences

- **Positive:**
  - Tokens protected even if database backups/exports are compromised
  - Meets security best practices and compliance requirements
  - Foundation for encrypting other sensitive data (Stripe tokens, API keys)

- **Negative:**
  - Adds ~1-2ms overhead per token read/write (encryption/decryption)
  - Key management complexity (rotation, secure storage)
  - Migration requires careful coordination to avoid service interruption
  - Debugging encrypted data is more difficult (requires decryption utilities)

### Supersedes

This ADR supersedes the encryption aspect of ADR-013. ADR-013's token storage strategy remains valid; this ADR adds the application-level encryption layer that was identified as technical debt.

---

## ADR-021: Vitest for Testing Framework

**Status:** Accepted

### Context

Need a testing framework for unit and integration tests that works well with Next.js, TypeScript, and React Server Components.

### Decision

Use Vitest as the primary testing framework over Jest, Mocha, or other alternatives.

### Rationale

- **Native ESM support:** Vitest has first-class ESM support, which aligns with Next.js 16's ESM-first approach
- **Faster execution:** Vitest uses Vite's fast HMR and is generally faster than Jest for most test suites
- **Jest-compatible API:** Vitest uses Jest's API, making migration from Jest straightforward and allowing use of Jest ecosystem tools (e.g., `@testing-library/jest-dom`)
- **TypeScript-first:** Built-in TypeScript support without additional configuration
- **Better Next.js integration:** Works seamlessly with Next.js App Router and React Server Components
- **Modern tooling:** Active development, good TypeScript support, and excellent DX

### Alternatives Considered

1. **Jest**
   - Pros: Mature, large ecosystem, widely used
   - Cons: Slower execution, requires more configuration for ESM/TypeScript, larger bundle size

2. **Mocha + Chai**
   - Pros: Flexible, plugin-based architecture
   - Cons: More setup required, less React-specific tooling, older ecosystem

3. **Tape/Ava**
   - Pros: Minimal, fast
   - Cons: Smaller ecosystem, less React testing library integration

### Consequences

- **Positive:**
  - Faster test execution improves developer feedback loop
  - Native ESM support reduces configuration complexity
  - Jest-compatible API allows reuse of existing testing patterns and libraries
  - Good integration with `@testing-library/react` and `jsdom` for component testing

- **Negative:**
  - Smaller ecosystem compared to Jest (though growing)
  - Some Jest plugins may not work directly (though most are compatible)
  - Team members familiar with Jest may need minor adjustments (API is compatible)

---

## ADR-022: Stripe for Payment Processing

**Status:** Accepted

### Context

Need a payment provider to handle subscription billing for the MVP ($49/month tier). Must support recurring subscriptions, webhooks, customer portal, and trial periods.

### Decision

Use Stripe as the payment processing provider for all subscription billing.

### Rationale

- **Subscription-native:** Stripe is built for subscription billing with excellent support for recurring payments, trials, and plan changes
- **Developer-friendly API:** Well-documented REST API with TypeScript types and excellent error handling
- **Webhook reliability:** Robust webhook system with signature verification and idempotency support
- **Customer portal:** Built-in hosted customer portal for subscription management (billing page, cancel subscriptions)
- **Trial support:** Native support for trial periods without custom logic
- **Wide adoption:** Large ecosystem, extensive documentation, and community support
- **Compliance:** Handles PCI compliance, tax calculations, and international payments
- **Free tier:** Generous free tier for development and testing

### Alternatives Considered

1. **Paddle**
   - Pros: Handles tax/VAT automatically, merchant of record model
   - Cons: Less flexible, smaller ecosystem, more expensive at scale

2. **PayPal Subscriptions**
   - Pros: Wide user base, familiar to many customers
   - Cons: Less developer-friendly API, weaker webhook system, limited subscription management features

3. **Braintree**
   - Pros: Good API, supports multiple payment methods
   - Cons: More complex setup, less subscription-focused than Stripe

4. **Self-hosted payment processing**
   - Pros: Full control, no per-transaction fees
   - Cons: PCI compliance burden, significant development effort, security risks

### Consequences

- **Positive:**
  - Fast implementation with minimal custom code
  - Reliable webhook delivery for subscription lifecycle events
  - Built-in customer portal reduces development effort
  - Excellent documentation and developer experience
  - Scales well as business grows

- **Negative:**
  - Transaction fees (2.9% + $0.30 per transaction) reduce margins
  - Vendor lock-in (though migration is possible with effort)
  - Requires webhook signature verification and idempotency handling (standard practice)
  - International payment support may require additional configuration

---

## ADR-023: Resend for Transactional Email

**Status:** Accepted

### Context

Need a transactional email service to send notifications (new reviews, trial ending, payment failures, welcome emails) to users. Must be reliable, developer-friendly, and cost-effective for MVP scale.

### Decision

Use Resend as the transactional email provider for all user-facing emails.

### Rationale

- **Simple API:** Clean, RESTful API with TypeScript support and minimal configuration
- **Developer experience:** Excellent documentation, fast setup, good error messages
- **React Email support:** Native support for React Email templates, allowing component-based email design
- **Free tier:** Generous free tier (3,000 emails/month) sufficient for MVP and early growth
- **Reliability:** Built on modern infrastructure with good deliverability rates
- **Pricing:** Transparent, usage-based pricing that scales predictably
- **Domain verification:** Straightforward domain verification and DNS setup
- **Webhooks:** Support for webhook events (delivery, bounces, opens) for monitoring

### Alternatives Considered

1. **SendGrid**
   - Pros: Mature, large scale, extensive features
   - Cons: More complex API, higher pricing, overkill for MVP needs

2. **Mailgun**
   - Pros: Reliable, good API, good deliverability
   - Cons: More expensive free tier, less modern developer experience

3. **Amazon SES**
   - Pros: Very cheap at scale, highly reliable
   - Cons: More complex setup, requires AWS account, less developer-friendly

4. **Postmark**
   - Pros: Excellent deliverability, simple API
   - Cons: More expensive, less flexible pricing model

5. **Supabase Edge Functions + SMTP**
   - Pros: No additional service, full control
   - Cons: Requires SMTP server setup, deliverability concerns, maintenance burden

### Consequences

- **Positive:**
  - Fast implementation with minimal boilerplate
  - React Email integration allows reusable email components
  - Free tier covers MVP needs without cost concerns
  - Good developer experience speeds up email feature development
  - Webhook support enables email delivery monitoring

- **Negative:**
  - Newer service (less battle-tested than SendGrid/Mailgun)
  - May need to migrate if requirements exceed Resend's capabilities
  - Limited advanced features compared to enterprise email services
  - Vendor lock-in (though emails can be migrated to other providers)

---

## ADR-024: Claude API Integration Pattern

**Status:** Accepted

### Context

We need a reliable, production-ready integration with Anthropic's Claude API for generating review responses. The integration must handle network failures, rate limits, timeouts, and provide consistent error handling while tracking token usage for cost monitoring.

### Decision

Implement Claude API integration in `lib/claude/client.ts` with the following pattern:

- **Timeout handling:** All API requests use a 30-second timeout via `fetchWithTimeout()` with `AbortController`
- **Retry logic:** Exponential backoff retry (1s, 2s delays) with maximum 2 total attempts (1 initial + 1 retry)
- **Error handling:** Custom `ClaudeAPIError` class with HTTP status codes; no retry on 401 (auth), 403 (forbidden), or 429 (rate limit) errors
- **Token tracking:** Track and return `tokensUsed` (input + output tokens) for cost monitoring
- **Input validation:** Truncate review text to 10,000 characters to avoid token limit issues
- **Prompt building:** Separate functions for system prompt (from voice profile) and user prompt (from review data)
- **API configuration:** Use Claude Haiku 4.5 model (`claude-haiku-4-5-20251001`), max 500 output tokens, Anthropic API version `2023-06-01`

### Rationale

- **Timeout protection:** Prevents hanging requests from blocking the application; 30 seconds balances user experience with API response times
- **Retry with backoff:** Handles transient network failures without overwhelming the API; exponential backoff reduces contention
- **No retry on auth/rate limit:** These errors require manual intervention (key rotation, rate limit handling), not automatic retries
- **Token tracking:** Essential for cost monitoring and usage analytics; enables per-organization billing in the future
- **Input truncation:** Prevents API errors from extremely long reviews while preserving most content
- **Separate prompt functions:** Maintainable, testable code that aligns with prompt templates documented in `docs/PROMPTS.md`
- **Custom error class:** Enables API route handlers to map Claude errors to appropriate HTTP status codes (408 → 504, 429 → 429, etc.)

### Alternatives Considered

1. **No timeout handling**
   - Pros: Simpler code
   - Cons: Risk of hanging requests, poor user experience

2. **Fixed retry delay**
   - Pros: Simpler logic
   - Cons: Less efficient under high load, may exacerbate rate limits

3. **Retry all errors**
   - Pros: More resilient to transient issues
   - Cons: Wastes API calls on auth/rate limit errors that won't resolve automatically

4. **No token tracking**
   - Pros: Simpler implementation
   - Cons: No cost visibility, can't implement usage-based billing

### Consequences

- **Positive:**
  - Reliable API integration with graceful failure handling
  - Cost visibility through token tracking
  - Clear error messages for debugging and user feedback
  - Maintainable code structure that matches prompt documentation

- **Negative:**
  - Additional complexity in error handling and retry logic
  - 30-second timeout may be too long for some use cases (can be adjusted)
  - Token tracking adds minimal overhead but requires storage in database
  - Input truncation may lose context for extremely long reviews (rare edge case)

---

## ADR-025: Voice Profile Resolution Fallback Hierarchy

**Status:** Accepted

### Context

When generating AI responses to reviews, the system needs to determine which voice profile (personality, tone, word preferences) to use. Organizations may have multiple locations, each potentially with its own voice profile, or a single organization-wide profile. The system must gracefully handle cases where profiles are missing or fail to load.

### Decision

Implement a three-tier fallback hierarchy for voice profile resolution in `app/api/responses/route.ts`:

1. **Location-specific voice profile** (highest priority): If `location.voice_profile_id` exists, fetch and use that profile. If fetch fails, log warning and fall back to next tier.
2. **Organization voice profile** (fallback): If no location profile exists or fetch failed, fetch the organization's voice profile (first profile where `organization_id` matches). If fetch fails, log warning and fall back to next tier.
3. **Default voice profile** (final fallback): If no organization profile exists or fetch failed, use `DEFAULT_VOICE_PROFILE` exported from `lib/claude/client.ts` (tone: "warm", max_length: 150, etc.).

All database fetch errors are logged with `console.warn()` but do not prevent response generation; the system always falls back to the default profile if needed.

### Rationale

- **Location-specific profiles:** Enables multi-location businesses to have different voices per location (e.g., formal for corporate office, casual for retail store)
- **Organization-wide profiles:** Provides a sensible default for single-location businesses or when location profiles aren't configured
- **Default fallback:** Ensures the system always has a valid voice profile, preventing API errors and providing a consistent user experience
- **Graceful error handling:** Database fetch failures (network issues, RLS policy changes) don't break response generation; warnings enable debugging without blocking users
- **Explicit hierarchy:** Clear, predictable resolution order that matches user expectations (location-specific overrides organization-wide)

### Alternatives Considered

1. **Organization-only profiles**
   - Pros: Simpler logic, fewer database queries
   - Cons: No support for location-specific voices, less flexible for multi-location businesses

2. **Fail hard on profile fetch errors**
   - Pros: Forces resolution of database issues immediately
   - Cons: Breaks response generation for transient errors, poor user experience

3. **Cache profiles in memory**
   - Pros: Faster resolution, fewer database queries
   - Cons: Cache invalidation complexity, stale data risk, not needed for current scale

4. **User-level voice profiles**
   - Pros: Personalization per user
   - Cons: Overkill for current use case (business voice, not personal), adds complexity

### Consequences

- **Positive:**
  - Flexible voice configuration supporting both single and multi-location businesses
  - Resilient to database errors and missing configuration
  - Clear, maintainable resolution logic
  - Always generates responses even when profiles are misconfigured

- **Negative:**
  - Multiple database queries in worst case (location profile fetch + org profile fetch)
  - Silent fallback to default profile may mask configuration issues (mitigated by warning logs)
  - Location-specific profiles require additional schema support (`voice_profile_id` on `locations` table)
  - Developers must understand the hierarchy when debugging voice-related issues

---

## ADR-026: Stryker Mutation Testing Workflow

**Status:** Accepted

### Context

Code coverage metrics alone don't guarantee test quality. A test suite can have 100% coverage but still miss bugs if assertions are weak or edge cases aren't properly validated. We need a systematic way to verify that our tests actually catch bugs, not just execute code paths.

### Decision

Adopt Stryker mutation testing as a quality assurance workflow with the following configuration:

- **Test runner:** Vitest (via `@stryker-mutator/vitest-runner`)
- **Coverage analysis:** Per-test coverage (`coverageAnalysis: "perTest"`) to identify which tests catch which mutations
- **Mutation scope:** Mutate source files in `lib/`, `app/`, `components/`, and `middleware.ts`; exclude test files, config files, scripts, and generated code
- **Reporting:** HTML reports in `reports/mutation/` directory, clear-text console output, and progress indicators
- **Workflow:** Run `npx stryker run` manually during development and code review; not required in CI (too slow for every commit)

### Rationale

- **Mutation testing validates test quality:** Introduces realistic bugs (e.g., `!=` → `==`, `+` → `-`, removing null checks) and verifies tests catch them
- **Vitest integration:** Aligns with our existing test framework (ADR-021), no need for separate test runner
- **Per-test coverage:** Identifies which specific tests catch which mutations, enabling targeted test improvements
- **Focused mutation scope:** Only mutates production code, not tests or config files, reducing noise and execution time
- **HTML reports:** Visual mutation score dashboard helps identify weak test areas
- **Manual workflow:** Mutation testing is computationally expensive; running on-demand during development/review is more practical than blocking CI

### Alternatives Considered

1. **No mutation testing**
   - Pros: Simpler workflow, no additional tooling
   - Cons: No systematic way to verify test quality beyond coverage metrics

2. **Jest mutation testing (Stryker with Jest runner)**
   - Pros: Familiar if team uses Jest
   - Cons: We use Vitest (ADR-021), would require dual test runners

3. **CI-blocking mutation tests**
   - Pros: Ensures all code meets mutation score threshold
   - Cons: Too slow for every commit, would slow down development velocity

4. **Manual bug injection**
   - Pros: No tooling overhead
   - Cons: Inconsistent, time-consuming, easy to miss important mutations

### Implementation Details

- **Configuration file:** `stryker.config.json` with mutation patterns, test runner, and reporting settings
- **Excluded patterns:** Test files (`**/*.test.{ts,tsx}`, `**/*.spec.{ts,tsx}`), config files (`vitest.config.ts`, `next.config.ts`, `tsconfig*.json`), scripts directory, and generated reports
- **Mutation score interpretation:**
  - > 80%: Excellent test quality
  - 60-80%: Good, but some gaps
  - < 60%: Tests need improvement
- **Workflow integration:** Documented in `docs/TEST_QUALITY.md` with setup steps and interpretation guidelines

### Consequences

- **Positive:**
  - Systematic validation of test quality beyond coverage metrics
  - Identifies weak tests that need strengthening
  - Catches test smells (trivial assertions, missing edge cases)
  - Improves confidence in test suite's ability to catch bugs
  - Visual reports make it easy to identify problem areas

- **Negative:**
  - Additional tooling and dependency (`@stryker-mutator/core`, `@stryker-mutator/vitest-runner`)
  - Computationally expensive (runs full test suite for each mutation)
  - Requires manual execution (not automated in CI)
  - Learning curve for interpreting mutation scores and reports
  - May generate false positives (mutations that don't represent real bugs)

---

## ADR-027: Native Dialog Element for Modals

**Status:** Accepted

### Context

We need modal dialogs for user interactions (e.g., editing AI-generated responses before publishing). The choice of modal implementation affects accessibility, bundle size, maintenance burden, and consistency across the application.

### Decision

Use the native HTML `<dialog>` element for all modal dialogs instead of third-party modal libraries (Radix UI Dialog, Headless UI, React Modal, etc.).

### Rationale

- **Native browser support:** `<dialog>` is supported in all modern browsers (Chrome 37+, Firefox 98+, Safari 15.4+, Edge 79+) with built-in accessibility features
- **Zero dependencies:** No additional JavaScript bundle size, reducing initial load time
- **Built-in accessibility:** Native `<dialog>` provides automatic focus trapping, ARIA attributes, and ESC key handling
- **Simpler implementation:** Less code to maintain, no library updates or breaking changes
- **Performance:** Native implementation is faster than JavaScript-based solutions
- **Backdrop styling:** Native `::backdrop` pseudo-element provides backdrop styling without additional DOM elements
- **Focus management:** Native focus trapping works automatically, though we still implement custom focus restoration for better UX

### Alternatives Considered

1. **Radix UI Dialog**
   - Pros: Excellent accessibility, well-maintained, React-optimized
   - Cons: Additional bundle size (~15KB), dependency to maintain, overkill for simple modals

2. **Headless UI Dialog**
   - Pros: Unstyled, accessible, Tailwind-friendly
   - Cons: Additional bundle size, dependency to maintain, requires more setup

3. **React Modal**
   - Pros: Simple API, widely used
   - Cons: Less accessible by default, requires more manual accessibility work, additional dependency

4. **Custom modal implementation**
   - Pros: Full control, no dependencies
   - Cons: Significant development effort to implement accessibility features (focus trapping, ARIA attributes, ESC handling), maintenance burden

### Implementation Pattern

All modals should follow this pattern (established in `components/reviews/response-edit-modal.tsx`):

- Use `<dialog>` element with `ref` for imperative control
- Call `dialog.showModal()` to open, `dialog.close()` to close
- Store trigger element before opening for focus restoration
- Focus primary interactive element (e.g., textarea) after opening using `requestAnimationFrame`
- Restore focus to trigger element on close
- Handle `cancel` event (ESC key) and backdrop clicks
- Use `aria-labelledby` for dialog title association
- Conditionally render content based on `isOpen` prop to avoid duplicate DOM nodes

### Consequences

- **Positive:**
  - Smaller bundle size (no modal library dependencies)
  - Better performance (native implementation)
  - Built-in accessibility features reduce implementation errors
  - Less maintenance burden (no library updates)
  - Consistent modal behavior across the application

- **Negative:**
  - Limited browser support for older browsers (IE11, Safari < 15.4) - not a concern for modern web apps
  - Less flexibility than library solutions (though sufficient for our use cases)
  - Manual focus management still required for optimal UX (though native dialog handles basic trapping)
  - Styling requires understanding of `::backdrop` pseudo-element and dialog positioning quirks

### Future Considerations

- If we need more advanced modal features (animations, complex positioning, nested modals), we may need to reconsider this decision
- For now, native `<dialog>` meets all current requirements and aligns with our goal of minimal dependencies

---

## ADR-028: Response Data Model - Preserving Generated Text

**Status:** Accepted

### Context

When users edit AI-generated responses before publishing, we need to track both the original AI-generated text and the user's edited version. This data model affects how we display response history, analyze edit patterns, and potentially regenerate responses in the future.

### Decision

Store three separate text fields in the `responses` table:
- `generated_text`: The original AI-generated response (nullable: null for direct publishes, contains AI text for AI-generated responses, never overwritten once set)
- `edited_text`: The user's edited version (only set if user made changes, null otherwise)
- `final_text`: The text that was actually published to Google (always set on publish)

When publishing a response:
- If a response record already exists: preserve `generated_text` (never overwrite), set `edited_text` only if the published text differs from `generated_text`, set `final_text` to the published content
- If no response record exists (new publish):
  - If response was AI-generated: set `generated_text` to the AI text, set `final_text` to published content
  - If response was direct publish (no AI): set `generated_text` to null, set `final_text` to published content

### Rationale

- **Audit trail:** Preserving `generated_text` allows us to see what the AI originally suggested, enabling analysis of edit patterns and AI quality
- **Edit detection:** Comparing `final_text` to `generated_text` determines if edits were made (if different, set `edited_text`)
- **Data integrity:** Never overwriting `generated_text` prevents data loss if a user publishes, then wants to see the original AI suggestion
- **Future features:** Enables potential features like "revert to original AI response" or "show what changed" diff views
- **Analytics:** Can analyze how often users edit AI responses and what types of changes they make
- **Regeneration support:** If we add "regenerate response" feature, we can compare new generations to the original

### Alternatives Considered

1. **Single text field with edit flag**
   - Store only `response_text` and a boolean `was_edited` flag
   - Pros: Simpler schema, less storage
   - Cons: Loses original AI text, can't show "revert to original" or diff views

2. **Version history table**
   - Store each version of the response in a separate `response_versions` table
   - Pros: Complete history, supports multiple edits
   - Cons: Overkill for MVP, adds complexity, most responses won't have multiple versions

3. **Overwrite generated_text on edit**
   - Update `generated_text` when user edits, losing original
   - Pros: Simpler logic, single source of truth
   - Cons: Loses audit trail, can't analyze AI quality or edit patterns

4. **JSON field with versions**
   - Store `{ original: "...", edited: "...", published: "..." }` in a JSON column
   - Pros: Flexible, single field
   - Cons: Less queryable, harder to index, type safety concerns

### Implementation Details

The publish endpoint (`POST /api/reviews/[reviewId]/publish`) implements this logic:

```typescript
// Check if text was edited (only set edited_text if different from generated)
const wasEdited = existingResponse
  ? responseText !== existingResponse.generated_text
  : false;

// Update existing response - preserve generated_text
await supabase
  .from("responses")
  .update({
    edited_text: wasEdited ? responseText : null,
    final_text: responseText,
    status: "published",
    published_at: now,
  })
  .eq("id", existingResponse.id);
```

### Consequences

- **Positive:**
  - Complete audit trail of AI suggestions vs user edits
  - Enables future features (revert, diff views, analytics)
  - No data loss when users edit responses
  - Clear separation of concerns (generated vs edited vs published)

- **Negative:**
  - Slightly more complex database schema (three text fields instead of one)
  - Additional logic to determine if edits were made
  - More storage required (though text is relatively small)
  - Must handle null `edited_text` in queries and UI

### Future Considerations

- If we add "regenerate response" feature, we may want to track multiple generations (e.g., `generated_text_v1`, `generated_text_v2`)
- For now, single `generated_text` is sufficient; we can extend the schema later if needed
- Consider adding a `edited_at` timestamp if we want to track when edits were made (currently only `published_at` is tracked)

### Update (Dec 2025)

The `generated_text` field was made nullable to distinguish between AI-generated responses and direct publishes (user-written responses without AI generation). This enables accurate analytics and reporting on response origin. Direct publishes have `generated_text = null`, while AI-generated responses preserve the generated text.

---

## ADR-029: Custom Tones Architecture

**Status:** Accepted

### Context

Users need personalized communication tones beyond the standard options (Warm, Direct, Professional, Friendly, Casual). An interactive quiz can help users discover their ideal tone, and AI can generate custom tones based on quiz responses that better match their business personality.

### Decision

Implement a custom tones system with:
- **Tone Quiz:** 10-question interactive quiz (single-select and multi-select) that captures user preferences
- **AI Generation:** Use Claude AI to generate personalized tone name, description, and enhanced context from quiz responses
- **Database Storage:** Store custom tones in `custom_tones` table with `organization_id`, `name`, `description`, `enhanced_context`, and `quiz_responses` (JSONB)
- **Tone Selection:** Custom tones appear in tone selectors with format `custom:{uuid}` and are displayed as `{name} - {description}`
- **Integration:** Custom tone `enhanced_context` is included in AI prompts when generating review responses

### Rationale

- **Personalization:** Standard tones may not match every business's unique voice; custom tones provide flexibility
- **Discovery:** Interactive quiz helps users identify their communication style preferences
- **AI Enhancement:** Claude-generated enhanced context provides richer guidance for response generation than standard tones
- **Organization-scoped:** Custom tones belong to organizations, allowing team members to share the same voice
- **Backward Compatible:** Standard tones remain available; custom tones extend rather than replace existing options

### Alternatives Considered

1. **User-defined tone names only**
   - Pros: Simpler, no AI generation needed
   - Cons: No enhanced context for AI prompts, less personalized

2. **Pre-defined industry tones**
   - Pros: Faster to implement, no quiz needed
   - Cons: Less personalized, doesn't capture individual business nuances

3. **Free-text tone description**
   - Pros: Maximum flexibility
   - Cons: Inconsistent quality, harder to use in AI prompts, no structured data

4. **Multiple custom tones per organization**
   - Pros: More flexibility (e.g., one tone per location)
   - Cons: Adds complexity, not needed for MVP (single voice per organization)

### Implementation Details

- **Quiz Component:** `components/voice-profile/tone-quiz.tsx` - React component with progress tracking, question navigation, and result display
- **API Endpoint:** `POST /api/tone-quiz/generate` - Validates quiz answers, calls Claude AI, saves custom tone to database
- **Shared Questions:** `lib/quiz/questions.ts` - Centralized quiz questions and answer definitions
- **Database:** `custom_tones` table with organization foreign key, JSONB for quiz responses
- **Tone Format:** Custom tones use `custom:{uuid}` format to distinguish from standard tones (e.g., `custom:123e4567-e89b-12d3-a456-426614174000`)

### Consequences

- **Positive:**
  - More personalized response generation
  - Better user experience with interactive discovery
  - Extensible system (can add more quiz questions or generation logic)
  - Enhanced context improves AI response quality

- **Negative:**
  - Additional database table and API endpoint
  - AI generation cost per custom tone creation (~$0.001 per tone)
  - More complex tone selection UI (standard vs custom sections)
  - Requires validation of custom tone UUID format in voice profile constraints

---

## ADR-030: Tier-Based Cron Polling with Time-Window Approach

**Status:** Accepted

### Context

Different subscription tiers should receive different review polling frequencies (higher tiers = more frequent polling). Cron jobs may run slightly early or late due to timing variations, and we need to prevent duplicate processing while handling these variations gracefully.

### Decision

Implement tier-based polling with a resilient time-window approach:
- **Tier Intervals:** Starter (15 min), Growth (10 min), Agency (5 min)
- **Time-Window Tolerance:** Accept runs within +/- 2 minutes of target interval
- **Deduplication:** Track `last_processed_at` timestamp per tier in `cron_poll_state` table
- **Best-Effort Deduplication:** Use timestamp checks to minimize duplicates, but accept that overlapping runs may process the same tier (safe because review upserts are idempotent)
- **Atomic Updates:** Use database atomic updates for `last_processed_at` to prevent race conditions

### Rationale

- **Tier Differentiation:** Provides value differentiation between subscription tiers
- **Resilient to Timing Variations:** Time-window approach handles cron timing variations (early/late runs) gracefully
- **Idempotent Operations:** Review upserts by `external_review_id` are idempotent, making occasional duplicate processing safe
- **Best-Effort Deduplication:** Simpler than strict locking mechanisms, sufficient for our scale
- **Atomic Updates:** Database-level atomicity prevents race conditions in timestamp updates

### Alternatives Considered

1. **Exact minute alignment**
   - Pros: Simpler logic, no timestamp tracking needed
   - Cons: Fails if cron runs early/late, brittle to timing variations

2. **Distributed locking (Redis, etc.)**
   - Pros: Strict single-run guarantees
   - Cons: Additional infrastructure, complexity, overkill for current scale

3. **Single polling interval for all tiers**
   - Pros: Simpler implementation
   - Cons: No tier differentiation, can't provide value to higher tiers

4. **Separate cron jobs per tier**
   - Pros: Clear separation, easier to monitor
   - Cons: More cron jobs to manage, harder to coordinate

### Implementation Details

- **Database Table:** `cron_poll_state` with `tier` (PRIMARY KEY), `last_processed_at`, `updated_at`
- **Scheduling Logic:** `shouldProcessForTier()` function checks time window and minimum interval since last processing
- **Cron Schedule:** Single cron job runs every 5 minutes, filters locations by tier and processes eligible tiers
- **Atomic Updates:** Database `UPDATE ... WHERE` with timestamp check ensures only one run updates per tier

### Consequences

- **Positive:**
  - Provides tier differentiation value
  - Resilient to cron timing variations
  - Simple implementation without external dependencies
  - Acceptable duplicate processing is safe due to idempotent operations

- **Negative:**
  - Not strictly single-run (overlapping runs may both process same tier)
  - Requires `cron_poll_state` table maintenance
  - More complex scheduling logic than fixed intervals
  - Time-window tolerance may allow slightly more frequent processing than intended

---

## ADR-031: Atomic Upsert for Response Publishing

**Status:** Accepted

### Context

Multiple concurrent publish requests for the same review can create race conditions, resulting in duplicate response records or lost data. We need to ensure only one response exists per review at the database level, even when multiple requests arrive simultaneously.

### Decision

Implement atomic upsert for response publishing using:
- **UNIQUE Constraint:** `UNIQUE(review_id)` on `responses` table ensures database-level uniqueness
- **Database Function:** `upsert_response()` PostgreSQL function with `ON CONFLICT` handling
- **Atomic Operation:** Single database call handles both insert and update cases atomically
- **Data Preservation:** Function preserves `generated_text` on update, sets `edited_text` appropriately, and handles both new and existing responses

### Rationale

- **Database-Level Guarantee:** UNIQUE constraint prevents duplicates at the database level, not just application level
- **Atomic Operation:** Database function ensures single atomic transaction, preventing race conditions
- **Simpler Application Logic:** Application code doesn't need to handle "check then insert/update" race conditions
- **Data Integrity:** Preserves `generated_text` correctly in all scenarios (new response, update existing, direct publish)
- **Idempotent:** Multiple concurrent requests result in same final state

### Alternatives Considered

1. **Application-level check-then-insert/update**
   - Pros: Simpler database schema
   - Cons: Race conditions possible, requires transaction handling, more complex application code

2. **Optimistic locking (version numbers)**
   - Pros: Detects conflicts
   - Cons: Requires retry logic, more complex, doesn't prevent duplicates

3. **Distributed locking (Redis, etc.)**
   - Pros: Strict single-operation guarantee
   - Cons: Additional infrastructure, complexity, overkill for current scale

4. **Separate insert and update endpoints**
   - Pros: Clear separation of concerns
   - Cons: Application must determine which to call, race conditions still possible

### Implementation Details

- **Database Function:** `upsert_response(p_review_id, p_generated_text, p_final_text, p_status, p_published_at)` with `ON CONFLICT (review_id) DO UPDATE`
- **Conflict Handling:** On conflict, preserves existing `generated_text`, updates `edited_text` only if `final_text` differs from `generated_text`, updates `final_text` and `status`
- **Direct Publish Support:** Handles both AI-generated responses (with `generated_text`) and direct publishes (with `generated_text = null`)
- **API Integration:** `POST /api/reviews/[reviewId]/publish` calls `supabase.rpc('upsert_response', ...)` instead of separate insert/update logic

### Consequences

- **Positive:**
  - Prevents duplicate response records at database level
  - Eliminates race conditions in concurrent publish scenarios
  - Simpler application code (single database call)
  - Guaranteed data integrity and consistency

- **Negative:**
  - Requires database function maintenance
  - Less flexible than application-level logic (changes require migration)
  - Database-specific (PostgreSQL) solution (not portable to other databases)

---

## Template for New Decisions

```markdown
## ADR-XXX: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded

### Context

[What is the issue that we're seeing that is motivating this decision?]

### Decision

[What is the change that we're proposing and/or doing?]

### Rationale

[Why is this the best choice? What alternatives were considered?]

### Consequences

[What are the positive and negative implications of this decision?]
```
