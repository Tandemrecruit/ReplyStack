# Architecture Decision Records (ADR)

This document logs key architectural and product decisions for ReplyStack.

---

## ADR-001: Next.js 15 with App Router

**Status:** Accepted

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

## ADR-003: Claude Sonnet over GPT-5.2 for Response Generation

**Status:** Accepted

### Context

Need high-quality, natural-sounding responses for business review replies.

### Decision

Claude Sonnet 4 via Anthropic API.

### Rationale

- More natural, human-sounding tone for business communication (multiple sources cite this as Claude's strength)
- More consistent and predictable response quality
- We're already building with Claude tools (familiarity)
- GPT-5.2 is cheaper ($1.75/$14 vs $3/$15 per MTok) but the cost difference is negligible at our scale (~$0.003/response)
- GPT-5.2 excels at math/reasoning which isn't our primary use case

### Tradeoffs

- Paying ~40% more on input tokens
- Could revisit if costs become material at scale

### Consequences

- Single AI vendor dependency
- Could add GPT-5.2 fallback if quality issues emerge or costs become significant

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

**Status:** Deprecated

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
   - Per-row IVs stored alongside encrypted data
   - Keys stored in environment variables or Supabase Vault
   - Pros: Full control, no external dependencies, works with any database
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

**AES-256-GCM with per-row IVs, keys in Supabase Vault (post-MVP), environment variables (development)**

- Use Node.js `crypto` module for AES-256-GCM encryption/decryption
- Store IV (12 bytes) alongside encrypted token in database (e.g., `encrypted_token_iv` column)
- Encryption key stored in `ENCRYPTION_KEY` environment variable (32 bytes for AES-256)
- Post-MVP: Migrate keys to Supabase Vault for production key management
- Support key rotation: maintain current + previous key during rotation window

### Migration Plan

1. **Schema changes:**
   - Add `encrypted_token_iv` column (BYTEA) to `users` table
   - Keep `google_refresh_token` column temporarily for migration

2. **Encryption utility:**
   - Create `lib/encryption/tokens.ts` with `encryptToken()` and `decryptToken()` functions
   - Functions handle IV generation, encryption, and decryption

3. **Code updates:**
   - Update all token read/write paths to use encryption utilities
   - Token reads: decrypt on fetch
   - Token writes: encrypt before insert/update

4. **Data migration:**
   - One-time migration script: fetch all plaintext tokens, encrypt with new IV, store encrypted value + IV
   - Clear plaintext `google_refresh_token` column after verification
   - Optional: Rename column to `google_refresh_token_encrypted` for clarity

5. **Rollback plan:**
   - Keep plaintext column until migration verified
   - Support both encrypted and plaintext reads during transition
   - Remove plaintext support after full migration

### Implementation Details

- **Encryption algorithm:** AES-256-GCM (authenticated encryption)
- **IV size:** 12 bytes (96 bits, recommended for GCM)
- **Key derivation:** Direct use of 32-byte key from environment (no PBKDF2 needed for single-purpose key)
- **Storage format:** Base64-encoded encrypted token + separate IV column
- **Error handling:** Graceful failure if decryption fails (treat as invalid token, prompt re-auth)

### Owner

Backend/Infrastructure team (post-MVP)

### Priority

**High (post-MVP, before production scale)**

- Not blocking MVP launch (acceptable risk for initial users)
- Must be implemented before handling sensitive customer data at scale
- Required for compliance certifications (SOC 2, ISO 27001)

### Acceptance Criteria

- [ ] All Google refresh tokens encrypted at application level before database write
- [ ] Per-row IVs stored and used for decryption
- [ ] Encryption keys stored in Supabase Vault (production) or environment variables (development)
- [ ] Migration script successfully encrypts all existing plaintext tokens
- [ ] Plaintext token column removed or deprecated after migration
- [ ] Key rotation process documented and tested
- [ ] Decryption failures handled gracefully (clear token, prompt re-auth)
- [ ] Unit tests for encryption/decryption utilities
- [ ] Integration tests verify encrypted tokens work with Google API calls
- [ ] Documentation updated with key management procedures

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
