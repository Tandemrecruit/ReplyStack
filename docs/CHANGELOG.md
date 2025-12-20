# Changelog

## 2025-12-19

### Code Quality

- Added type aliases to Supabase types file: exported commonly used types (UserInsert, ReviewInsert, Review, VoiceProfile, Location) as top-level aliases from nested Database structure, fixing TypeScript errors after type regeneration
- Fixed Node.js deprecation warning in generate-types.js: on Windows use `shell: true` with single command string instead of argument array to avoid DEP0190 warning, on Unix-like systems use array format without shell for better security, projectId is validated alphanumeric so safe to interpolate
- Removed `.claude` folder from git tracking: uncommitted previously tracked `.claude/settings.local.json` file to prevent local Claude IDE settings from being committed, folder already listed in `.gitignore`

### Features

- Implemented AI response generation endpoint (`POST /api/responses`): generates customer-facing review responses using Claude API, supports voice profile configuration (location-specific, organization-wide, or default), returns existing responses instead of regenerating, tracks token usage, handles Claude API errors (timeout, rate limits, service unavailability), validates review ownership and text content before generation

### Testing

- Refactored Claude client test setup/teardown: moved `process.env.ANTHROPIC_API_KEY` setup to `beforeEach`, enhanced `afterEach` to restore both `process.env` and `global.fetch`, removed redundant manual cleanup from test body to prevent test pollution on failures
- Added tests for Claude API auth/config errors (401/403→500) and generic errors (→502) in `/api/responses` route: covers AI service configuration error (401/403) and AI service unavailable (other ClaudeAPIError) error paths
- Updated `/api/responses` route tests: replaced placeholder tests with comprehensive test coverage for actual implementation including successful generation, existing response detection, voice profile fallback logic, error handling (Claude API errors, database errors), and edge cases (missing review text, wrong organization, etc.)
- Fixed 9 failing tests: voice editor form validation (disabled HTML5 validation to allow number input submission), middleware redirect logic (added email_confirmed_at to mock user), locations route mocks (added missing id field to synced locations and fixed DELETE handler mock chain), poll-reviews cron tests (set up required Supabase environment variables and mocked createAdminSupabaseClient)
- Fixed locations DELETE failure test: added missing select chain mock (select().eq().eq().single()) to verify location existence before update, matching success test pattern, ensuring test reaches update call before simulating deactivation failure
- Refactored responses route test mock: replaced duplicate inline ClaudeAPIError class definition with real class import using vi.importActual, ensuring test uses actual error class from module instead of duplicate implementation
- Optimized test suite performance: removed redundant mock clearing options (mockReset, clearMocks), configured node environment for pure unit tests (format, crypto, validation, client libraries) to reduce jsdom overhead, replaced setTimeout delays with promise-based approach in auth form tests (threads pool reverted - forks pool performs better on Windows)

### Documentation

- Updated README.md to reflect current project state: corrected development status (core features implemented), updated AI model name (Claude Haiku 4.5), added missing npm scripts (test:ci, supabase:types), improved setup instructions
- Updated API documentation (`docs/API.md`): documented actual POST /api/responses implementation with request/response formats, error codes, and voice profile resolution strategy; updated status to reflect completed features (Google Business Profile integration, review polling, AI response generation)
- Updated DECISIONS.md with ADR maintenance guidance: added sections on when to create/update ADRs, ADR numbering rules, integration with code changes, and review checklist based on `.cursor/rules/adr-maintenance/RULE.mdc`
- Updated ADR-001 status to "Superseded" by ADR-006 (Next.js 16 upgrade), added Supersedes section linking to ADR-006
- Added ADR-021 documenting Vitest testing framework choice: rationale for Vitest over Jest/Mocha, ESM support, Jest-compatible API, and consequences
- Added ADR-022 documenting Stripe payment provider choice: rationale for subscription billing, webhook reliability, customer portal, and alternatives considered (Paddle, PayPal, Braintree)
- Added ADR-023 documenting Resend transactional email service choice: rationale for simple API, React Email support, free tier, and alternatives considered (SendGrid, Mailgun, SES, Postmark)

### Code Quality

- Fixed duplicate GoogleAPIError class definition in lib/google/client.ts: removed first definition with incorrect constructor signature (message, status), kept second definition with correct signature (status, message) matching all usage throughout codebase
- Fixed Node.js builtin imports in scripts/generate-types.js: added node: protocol to child_process, fs, and path imports per Biome linting rules
- Fixed null safety in scripts/reencrypt-tokens.ts: added explicit null check for google_refresh_token before calling decryptTokenWithVersion to satisfy TypeScript strict null checks

## 2025-12-18

### Code Quality

- Fixed version control configuration: removed incorrect `.gitignore` entry for `scripts/generate-types.js` (utility script should be tracked), added missing `lib/supabase/typed-helpers.ts` to version control

### Security

- Fixed base64 validation in token decryption: removed ineffective try/catch around `Buffer.from()` (which doesn't throw on invalid base64), added explicit base64 validation function that checks for valid characters, proper padding, and correct length before decoding, ensuring `TokenDecryptionError` is thrown for clearly invalid base64 input
- Fixed token re-encryption script to detect primary key usage via key version identifier: added 1-byte key version header (0x01 for primary key, 0x00 for old/legacy) to ciphertext format in `encryptToken()`, created `decryptTokenWithVersion()` function that returns both plaintext and key version used, updated `reencrypt-tokens.ts` to check key version instead of comparing ciphertexts (which never matched due to random IVs), maintaining backward compatibility with legacy tokens without version byte

- Implemented AES-256-GCM application-layer encryption for Google refresh tokens: created `lib/crypto/encryption.ts` module with `encryptToken()` and `decryptToken()` functions, 12-byte random IV per encryption, 128-bit auth tag for integrity verification, and base64 storage format; updated OAuth callback to encrypt tokens before storage; updated all API routes (`locations`, `poll-reviews` cron, `publish`) to decrypt tokens with error handling; added `TOKEN_ENCRYPTION_KEY` env var (32-byte hex) and `TOKEN_ENCRYPTION_KEY_OLD` for key rotation support; documented key rotation procedure in ARCHITECTURE.md
- Created `scripts/reencrypt-tokens.ts` for key rotation: script re-encrypts all google_refresh_tokens with new key during key rotation, supports `--dry-run` mode for verification, includes detailed logging and error handling
- Created ADR-020 for application-level token encryption: documented threat model, remediation approach (AES-256-GCM with per-row IVs), and migration plan

### Code Quality

- Added interactive confirmation prompt to token re-encryption script: requires typing "YES" to proceed in live mode (prevents accidental production modifications), added `--force` flag for non-interactive runs (CI/automation), script exits with non-zero code if confirmation is cancelled
- Fixed token re-encryption script dry-run statistics: added `wouldReencrypt` counter to track dry-run outcomes separately from actual re-encryptions, ensuring `stats.success` only increments for real database updates; updated summary output to show "Would re-encrypt (dry run)" count in dry-run mode and "Successfully re-encrypted" count in live mode
- Extracted shared typed Supabase helpers (typedUpdate, typedInsert, typedUpsert) into `lib/supabase/typed-helpers.ts` to centralize type-safe database operations and eliminate inline `as any` casts and biome-ignore comments from poll-reviews cron route
- Fixed null rating handling in poll-reviews cron: reviews without ratings now correctly set sentiment to null instead of defaulting to "negative", accurately representing text-only reviews without star ratings
- Made determineSentiment function type-safe: changed return type from `string` to `Sentiment` union type (`"positive" | "neutral" | "negative"`) to ensure only valid sentiment values are returned
- Fixed error type handling in poll-reviews cron: properly typed all catch blocks as `unknown` and used type guards for error handling
- Fixed memory leak in Google API client's fetchWithTimeout function by using { once: true } option for abort event listener, ensuring it auto-removes after firing
- Removed redundant 400 status check in refreshAccessToken function that duplicated the unconditional error throw
- Fixed review-card component to handle null status values
- Removed unused `getSession` mock from auth callback route tests: cleaned up test mocks to only include `exchangeCodeForSession` and other actually-used methods, improving test clarity

### Components

- Fixed potential NaN issue in voice-editor component: added fallback value (150) for max_length when parseInt returns NaN on invalid input
- Fixed location selector save handler to properly deactivate unselected locations
- Optimized location selector DELETE requests to run in parallel using Promise.allSettled, improving performance when deactivating multiple locations
- Improved accessibility with semantic output element and ARIA attributes for loading state

### API Routes

- Updated OAuth callback fallback email to use RFC 2606 .invalid suffix: changed synthetic email fallback from `${session.user.id}@google-noreply` to `${session.user.id}@no-email.invalid` in app/(auth)/callback/route.ts to make the address unambiguously invalid and non-routable
- Fixed potential empty string insertion in auth callback route: added email validation to ensure non-empty email before upserting to users table (NOT NULL constraint); uses provider-scoped synthetic email fallback (`${user.id}@google-noreply`) when OAuth provider doesn't return an email, with warning log for monitoring
- Added runtime validation for voice-profile PUT route request body using Zod schema to validate types (strings, positive integers for max_length, string arrays) and prevent malformed input from causing unexpected behavior
- Fixed locations POST route to parse and validate request body before organization creation, preventing organizations from being created for invalid requests; body parsing and validation (ensuring body exists and body.locations is an Array) now runs immediately after authentication and returns 400 immediately on invalid input
- Created `/api/voice-profile` route handler with GET and PUT methods for fetching and updating voice profiles for authenticated users' organizations
- Fixed poll-reviews cron to keep first user found per organization when multiple users have refresh tokens (deterministic behavior instead of last-writer-wins)
- Fixed poll-reviews cron to generate stable synthetic IDs for reviews missing external_review_id (using SHA-256 hash of location_id + reviewer_name + review_date) to prevent UNIQUE constraint violations from empty strings; reviews with insufficient data are skipped with logging
- Switched synthetic review ID generation to length-prefixed encoding (format: "<length>:<value>") instead of pipe-separated join to prevent collisions when component values contain the separator character
- Added proper error responses for user lookup failures and missing locations
- Fixed database update failure handling in publish route to prevent silent state inconsistency
- Added rollback logic for organization creation failures in locations route

### Google API Client

- Added 30-second timeout handling to all fetch calls using AbortController
- Improved location ID extraction with regex validation and filtering of invalid IDs
- Updated parseStarRating to return null for missing/unrecognized ratings
- Fixed refreshAccessToken to handle 400 errors separately from 401 with proper status codes

### UI/UX

- Enhanced color system documentation: added comprehensive usage examples and warnings about semantic inversion in CSS comments, created design system guide (docs/DESIGN_SYSTEM.md) with use case mappings, quick reference tables, and common patterns to reduce cognitive load when working with partially inverted color scales in dark mode
- Fixed text contrast on billing page "Upgrade to Pro" card in dark mode: added dark mode overrides for primary color palette (primary-50 through primary-950) to ensure proper contrast with light foreground text, improving contrast ratio from 1.05:1 to 11.76:1 (WCAG AAA compliant)
- Refined dark mode color scale strategy: fixed primary palette gradient discontinuity (smooth transition from primary-500 to primary-600), added comprehensive dark mode overrides for accent palette (goldenrod) with inverted scale strategy maintaining semantic usage patterns, and documented color system strategy in CSS comments to clarify the intentional partial inversion approach for WCAG contrast compliance

### Infrastructure

- Updated generate-types.js warning message with cross-platform examples: replaced PowerShell-only syntax with POSIX (macOS/Linux), PowerShell (Windows), and cross-env examples so users on all platforms know how to set SUPABASE_ACCESS_TOKEN environment variable
- Enhanced generate-types.js script to read SUPABASE_ACCESS_TOKEN from .env.local: added getAccessToken() function that checks environment variable first, then falls back to .env.local file, with proper quote and whitespace handling; fixed Windows compatibility by using shell: true option for spawnSync
- Created helper script (`scripts/generate-types.js`) to automatically extract Supabase project ID from environment variables and generate TypeScript types
- Added validation for Supabase project ID format in `scripts/generate-types.js`: validates extracted project IDs against 20-character alphanumeric pattern before use, treating invalid formats as not found to prevent errors from malformed URLs
- Fixed command injection vulnerability in `scripts/generate-types.js`: replaced `execSync` with shell interpolation with `spawnSync` using argument array, removed `shell: true`, pass `projectId` as separate argument, and use `createWriteStream` to pipe stdout to file instead of shell redirection
- Fixed poll-reviews cron metric naming (newReviews → reviewsProcessed)
- Added ADR-013 through ADR-016 documenting Google Business Profile API integration decisions

### Database

- Added self-access fallback to users SELECT and UPDATE policies in non-idempotent migration: updated 001_initial_schema.sql to match idempotent version by adding `OR id = auth.uid()` to both SELECT and UPDATE policies, and changing SELECT policy from `IN` to `=` for consistency, ensuring users can view/update their own record before organization_id is set
- Added self-update fallback to users UPDATE policy: modified the "Users can update users in their organization" policy in 001_initial_schema_idempotent.sql to include `OR id = auth.uid()` in the USING clause, matching the SELECT policy pattern, so users can update their own record even when organization_id is not yet set
- Fixed fragile self-referential RLS policy for users table: replaced the SELECT policy's self-referential subquery pattern in 001_initial_schema_idempotent.sql with a direct equality comparison (`organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())`) and added explicit self-view fallback (`OR id = auth.uid()`) so users can always see their own row even if the organization check fails, making the policy more robust
- Enhanced database cleanup migration: added explicit DROP POLICY statements for all RLS policies in 000_drop_all.sql before dropping tables, added notification_preferences table to cleanup, and documented that DROP INDEX statements are intentional (redundant but explicit for clarity) since DROP TABLE CASCADE already removes dependent indexes
- Updated all timestamp columns to use TIMESTAMPTZ consistently: changed organizations.trial_ends_at, organizations.created_at, users.created_at, voice_profiles.created_at, locations.created_at, reviews.review_date, reviews.created_at, responses.published_at, and responses.created_at from TIMESTAMP to TIMESTAMPTZ in both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to ensure all timestamps store timezone information consistently with 002_add_notification_preferences.sql
- Added INSERT and DELETE policies for organizations table: added "Authenticated users can create organizations" policy (WITH CHECK auth.uid() IS NOT NULL) and "Users can delete their own organization" policy (USING id IN (SELECT organization_id FROM users WHERE id = auth.uid())) to both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to support organization creation and deletion by authenticated users
- Added INSERT policy for users table: added "Users can insert their own record" policy (WITH CHECK id = auth.uid()) to both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to allow OAuth callback to upsert user records during authentication flow
- Made notification_preferences migration (002_add_notification_preferences.sql) idempotent: added IF NOT EXISTS clauses, DROP POLICY IF EXISTS, and DROP TRIGGER IF EXISTS to allow safe reruns without errors
- Added migration for `notification_preferences` table (`supabase/migrations/002_add_notification_preferences.sql`) to support user email notification settings with RLS policies
- Changed `created_at` and `updated_at` columns in `notification_preferences` table from `TIMESTAMP` to `TIMESTAMPTZ` to store timezone-aware timestamps
- Added reusable `update_updated_at_column()` trigger function and BEFORE UPDATE trigger on `notification_preferences` table to automatically refresh `updated_at` timestamp on row modifications
- Fixed users table id column in initial schema: replaced `DEFAULT gen_random_uuid()` with `REFERENCES auth.users(id) ON DELETE CASCADE` to ensure profile rows match authenticated user IDs and RLS policies using `auth.uid()` work correctly

### Documentation

- Updated changelog rule to establish guidelines for what should and should not be included: added "What NOT to include" section to prevent linting fixes, test-only changes, internal refactoring, and other non-user-facing changes from cluttering the changelog
- Added troubleshooting section for Google OAuth "Access blocked" error (403: access_denied) with instructions for adding test users in development and completing verification for production
- Added comprehensive Supabase setup guide (`docs/SUPABASE_SETUP.md`) with step-by-step instructions for creating a project, configuring authentication, setting up the database schema, and generating TypeScript types
- Clarified Supabase key terminology in setup guide: anon/public key (like "Publishable Key") vs service_role key (like "Secret Key") to help users familiar with other services
- Improved Google OAuth setup instructions with clearer steps for creating OAuth credentials in Google Cloud Console, including OAuth consent screen configuration
- Updated RLS policies verification steps to match current Supabase UI (Table Editor → Policies tab instead of Authentication → Policies)
- Refined Google OAuth provider setup steps to match current Supabase dashboard interface
- Fixed Supabase CLI installation instructions: removed deprecated `npm install -g supabase` (no longer supported), updated to use `npx` directly or optional Scoop/Homebrew installation for Windows/macOS
- Updated type generation script to require and handle Supabase access token authentication, with clear instructions for obtaining tokens from dashboard or using CLI login
- Created initial database schema migration (`supabase/migrations/001_initial_schema.sql`) with all tables, indexes, and Row Level Security policies
- Updated `docs/SETUP.md` to reference the detailed Supabase setup guide
- Added `npm run supabase:types` script to simplify TypeScript type generation from Supabase schema
- Added three new ADRs to DECISIONS.md: ADR-017 (Multi-tenant Database Architecture), ADR-018 (Location Sync Workflow Pattern), and ADR-019 (Voice Profile API Structure) documenting key architectural decisions for tenant isolation, location synchronization, and voice profile management
- Fixed truncated command in Supabase setup troubleshooting: replaced incomplete `npx supabase@latest ...` with complete type generation command including `gen types typescript` subcommand, `--project-id`/`--project-ref` flag, `--schema public` flag, and output redirection to `lib/supabase/types.ts` with placeholders for project ID/ref
- Corrected roadmap voice profile setup status: marked as partially complete (~) instead of fully complete (X) - API supports all fields (example_responses, words_to_use, words_to_avoid, max_length) but settings UI is missing these input fields
- Updated roadmap to reflect current implementation status: marked Google Business Profile integration, review polling, voice profile setup, and landing page as complete; updated dashboard UI and response publishing status to reflect partial completion

## 2025-12-17

### Features

- Implemented Google Business Profile API integration:
  - OAuth token capture in auth callback to store provider_refresh_token
  - 5 Google API client functions (refreshAccessToken, fetchAccounts, fetchLocations, fetchReviews, publishResponse)
  - `/api/locations` route for fetching and saving Google Business locations
  - LocationSelector component for selecting locations to sync
  - Review polling cron job at `/api/cron/poll-reviews`
  - `/api/reviews/[reviewId]/publish` endpoint for publishing responses to Google
  - Updated `/api/reviews` route with real database queries, filtering, and pagination
  - Comprehensive tests for Google API client

### Components

- Introduced shared `AuthDivider` and `GoogleOAuthButton` components
- Refactored auth forms to reuse shared components
- Fixed update password redirect timeout cleanup on unmount

### Documentation

- Added ADR-006 for Next.js 16 / React 19 / Tailwind v4 upgrade path
- Added ADRs documenting auth route grouping, Supabase auth flows, shared validation, middleware routing rules, and shared auth UI components
- Refreshed architecture, roadmap, and spec to reflect current scaffolding state
- Added setup runbook, API overview, and changelog documentation
- Clarified README with development status and documentation links
- Added workspace rules covering performance monitoring, accessibility, secrets, testing, migrations, feature flags, and architecture docs

### Accessibility

- Removed redundant SVG titles
- Cleaned star icon aria attributes
- Reordered input help text placement
