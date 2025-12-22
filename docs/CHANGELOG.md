# Changelog

## 2025-12-22

### Code Quality

- Fixed TypeScript errors: added missing type exports (Review, ReviewInsert, VoiceProfile, Location, UserInsert) and custom_tones table definition to Database type, fixed currentQuestion undefined issues in tone-quiz component, and corrected Json type casting in tone-quiz generate route

### Testing

- Fixed settings client test error message handling: improved JSON parsing error handling to properly check response.ok before showing error messages
- Fixed API responses route tests: updated generateResponse call assertions to include the 5th argument (customToneEnhancedContext) that was missing from test expectations
- Fixed cron poll-reviews route tests: added organizations table mock to test helper to support tier-based filtering logic, and added check to skip locations without id field to prevent errors
- Fixed remaining 10 failing tests: updated all settings client tests to mock both /api/notifications and /api/custom-tones fetch calls that occur on component mount, and added organizations table mock to edge case test for locations without id field

### Accessibility

- Fixed SVG accessibility issue in tone quiz component: added aria-label to checkmark icon for screen reader support

### Features

- Added interactive tone quiz with custom tone generation: 10-question quiz generates personalized tones based on user responses
- Quiz supports both single-select and multi-select questions covering communication style, review handling, response length, customer relationships, and brand personality
- Custom tones are saved to database with AI-generated name, description, and enhanced context for response generation
- Updated tone selectors in settings and voice editor to display both standard tones and custom tones in separate sections
- Custom tone enhanced context is now included in AI prompt when generating review responses
- Added API endpoint `/api/tone-quiz/generate` for generating custom tones using Claude AI
- Added API endpoint `/api/custom-tones` for fetching organization's custom tones
- Updated database schema to support custom tones with `custom_tones` table and modified `voice_profiles.tone` constraint to allow `custom:{id}` format

## 2025-12-21

### Code Quality

- Replaced unsafe type assertion in reviews page with runtime validation: removed unsafe type assertion and replaced with type guard functions (`isValidReviewLocation`, `isValidReviewWithLocation`)
- Added explicit mapping function (`mapToReviewWithLocation`) that validates required fields and nested location data before casting, ensuring type safety through compile-time inference and runtime checks
- Replaced unsafe type assertion in reviews API route with runtime validation: applied same validation pattern as reviews page
- Added type guard functions and mapping function to validate Supabase query results
- Updated validation to handle undefined values for optional fields (normalizing to null), ensuring consistent type safety across both API route and page component
- Fixed dead code in reviews API route: added `platform` field to Supabase select query and API response transformation to match validation and mapping logic, ensuring the field is properly selected from database and returned in responses (defaults to "google" if null, matching reviews page behavior)
- Fixed unused response data in GenerateResponseButton component: updated `onSuccess` callback to accept and pass the API response data (id, reviewId, generatedText, status, tokensUsed) instead of parsing JSON without using it, enabling callers to access response metadata when needed
- Fixed trailing `?` in ReviewsFilters component URLs: updated router.push logic to conditionally append query string only when params are non-empty, preventing URLs like `/reviews?` when all filters are cleared
- Added validation failure logging in reviews API route: modified mapping step to log each invalid review with context (row index, review id, external_review_id, validation errors) using console.error before filtering, avoiding sensitive user content in logs while maintaining existing filter behavior

### Features

- Implemented tiered polling intervals for review monitoring: cron job now runs every 5 minutes with tier-based filtering
  - Agency tier: processes every run (every 5 minutes)
  - Growth tier: processes every 2nd run (every 10 minutes)
  - Starter tier: processes every 3rd run (every 15 minutes)
  - Updated cron schedule in vercel.json from 15-minute to 5-minute intervals
  - Added `shouldProcessForTier()` function to determine processing eligibility based on organization plan tier and current minute

- Added Response Editing Modal to review workflow: opens after AI response generation, displays review context (reviewer name, rating, excerpt)
- Modal provides editable textarea with live character/word counts, publishes edited text to Google Business Profile via existing API
- Handles errors with accessible error banner, closes and refreshes UI on success
- Uses native `<dialog>` element for accessibility with ESC key and backdrop click to close, focus management on open/close

- Standardized tone options across all components:
  - Updated tone options from inconsistent values (friendly/professional/casual/formal, Warm/Direct/Concise, Warm/Direct/Concierge) to 5 consistent options (Warm, Direct, Professional, Friendly, Casual) in settings-client.tsx, voice-editor.tsx, live-demo.tsx, and landing page
  - Changed default tone from "friendly" to "warm" in database schema, DEFAULT_VOICE_PROFILE, and component defaults
  - Created migration (003_standardize_tone_options.sql) to map existing "formal" values to "professional" and update default tone for new voice profiles

### Bug Fixes

- Fixed publish API to preserve original AI-generated text: existing `generated_text` is no longer overwritten on publish
- Stores user edits in `edited_text` field only when modified, sets `final_text` to the published content
- Checks for existing response before update to prevent data loss

- Fixed response parsing error in generate-response-button component: changed error handling to check `response.ok` before calling `response.json()`, preventing errors when server returns non-JSON (e.g., HTML error pages)
- Now safely attempts JSON parsing for error responses, falls back to text parsing when Content-Type indicates non-JSON, and provides meaningful error messages to users
- Improved accessibility in GenerateResponseButton component: added `aria-busy={isLoading}` attribute to button element so screen readers announce when the generate action is in progress, tied to the same `isLoading` state used for disabling and label changes

### UI/UX

- Updated landing page response time messaging: changed hero headline from "30 seconds" to "within minutes"
- Updated metadata description to reflect tiered polling intervals (5-15 minutes based on plan tier)
- Updated stats section to show "Avg. detection time: 5-15 min" instead of misleading "27 sec" response time
- Fixed UX inconsistency in review-card component: changed Generate Response button condition to match badge behavior
- Now shows button when status is null (treated as pending) using `(review.status ?? "pending") === "pending"` instead of strict `review.status === "pending"`, ensuring consistent behavior when badge displays "pending" for null status

### Documentation

- Updated API documentation: added comprehensive documentation for POST /api/reviews/[reviewId]/publish endpoint including request/response formats, error codes, and database update behavior

## 2025-12-19

### Bug Fixes

- Fixed max_length input in voice editor: changed onChange handler to allow empty string temporarily instead of forcing default value of 150, enabling validation errors to display for empty input rather than immediately resetting to default

### UI/UX

- Enhanced max_length validation in voice editor: added real-time validation error state that displays inline error messages
- Prevents form submission when value is out of range (50-500), clears errors on input correction
- Includes aria-live region for accessible error announcements to assistive technologies

### Features

- Implemented AI response generation endpoint (`POST /api/responses`): generates customer-facing review responses using Claude API
- Supports voice profile configuration (location-specific, organization-wide, or default)
- Returns existing responses instead of regenerating, tracks token usage
- Handles Claude API errors (timeout, rate limits, service unavailability), validates review ownership and text content before generation

### Documentation

- Updated README.md to reflect current project state: corrected development status (core features implemented), updated AI model name (Claude Haiku 4.5), added missing npm scripts (test:ci, supabase:types), improved setup instructions
- Updated API documentation (`docs/API.md`): documented actual POST /api/responses implementation with request/response formats, error codes, and voice profile resolution strategy; updated status to reflect completed features (Google Business Profile integration, review polling, AI response generation)

## 2025-12-18

### Security

- Fixed base64 validation in token decryption: removed ineffective try/catch around `Buffer.from()` (which doesn't throw on invalid base64)
- Added explicit base64 validation function that checks for valid characters, proper padding, and correct length before decoding, ensuring `TokenDecryptionError` is thrown for clearly invalid base64 input
- Fixed token re-encryption script to detect primary key usage via key version identifier: added 1-byte key version header (0x01 for primary key, 0x00 for old/legacy) to ciphertext format in `encryptToken()`
- Created `decryptTokenWithVersion()` function that returns both plaintext and key version used
- Updated `reencrypt-tokens.ts` to check key version instead of comparing ciphertexts (which never matched due to random IVs), maintaining backward compatibility with legacy tokens without version byte
- Implemented AES-256-GCM application-layer encryption for Google refresh tokens: created `lib/crypto/encryption.ts` module with `encryptToken()` and `decryptToken()` functions
- Uses 12-byte random IV per encryption, 128-bit auth tag for integrity verification, and base64 storage format
- Updated OAuth callback to encrypt tokens before storage
- Updated all API routes (`locations`, `poll-reviews` cron, `publish`) to decrypt tokens with error handling
- Added `TOKEN_ENCRYPTION_KEY` env var (32-byte hex) and `TOKEN_ENCRYPTION_KEY_OLD` for key rotation support; documented key rotation procedure in ARCHITECTURE.md
- Created `scripts/reencrypt-tokens.ts` for key rotation: script re-encrypts all google_refresh_tokens with new key during key rotation, supports `--dry-run` mode for verification, includes detailed logging and error handling
- Fixed command injection vulnerability in `scripts/generate-types.js`: replaced unsafe shell interpolation with `spawnSync` using argument array and stdout piping via `createWriteStream`
- Retained `shell: true` on Windows only for npx compatibility with validated input (projectId limited to 20-character alphanumeric pattern) to prevent injection
- Aligns with ARCHITECTURE.md security guidance on using input validation when `shell: true` is necessary

### Bug Fixes

- Fixed null rating handling in poll-reviews cron: reviews without ratings now correctly set sentiment to null instead of defaulting to "negative", accurately representing text-only reviews without star ratings
- Fixed memory leak in Google API client's fetchWithTimeout function by using { once: true } option for abort event listener, ensuring it auto-removes after firing
- Fixed review-card component to handle null status values
- Fixed potential NaN issue in voice-editor component: added fallback value (150) for max_length when parseInt returns NaN on invalid input
- Fixed location selector save handler to properly deactivate unselected locations
- Updated OAuth callback fallback email to use RFC 2606 .invalid suffix: changed synthetic email fallback from `${session.user.id}@google-noreply` to `${session.user.id}@no-email.invalid` in app/(auth)/callback/route.ts to make the address unambiguously invalid and non-routable
- Fixed potential empty string insertion in auth callback route: added email validation to ensure non-empty email before upserting to users table (NOT NULL constraint); uses provider-scoped synthetic email fallback (`${user.id}@google-noreply`) when OAuth provider doesn't return an email, with warning log for monitoring
- Fixed locations POST route to parse and validate request body before organization creation, preventing organizations from being created for invalid requests; body parsing and validation (ensuring body exists and body.locations is an Array) now runs immediately after authentication and returns 400 immediately on invalid input
- Fixed poll-reviews cron to keep first user found per organization when multiple users have refresh tokens (deterministic behavior instead of last-writer-wins)
- Fixed poll-reviews cron to generate stable synthetic IDs for reviews missing external_review_id (using SHA-256 hash of location_id + reviewer_name + review_date) to prevent UNIQUE constraint violations from empty strings
- Reviews with insufficient data are skipped with logging
- Switched synthetic review ID generation to length-prefixed encoding (format: "<length>:<value>") instead of pipe-separated join to prevent collisions when component values contain the separator character
- Fixed database update failure handling in publish route to prevent silent state inconsistency
- Added rollback logic for organization creation failures in locations route

### Performance

- Optimized location selector DELETE requests to run in parallel using Promise.allSettled, improving performance when deactivating multiple locations

### Components

- Improved accessibility with semantic output element and ARIA attributes for loading state

### API Routes

- Added runtime validation for voice-profile PUT route request body using Zod schema to validate types (strings, positive integers for max_length, string arrays) and prevent malformed input from causing unexpected behavior
- Created `/api/voice-profile` route handler with GET and PUT methods for fetching and updating voice profiles for authenticated users' organizations
- Added proper error responses for user lookup failures and missing locations

### Google API Client

- Added 30-second timeout handling to all fetch calls using AbortController
- Improved location ID extraction with regex validation and filtering of invalid IDs
- Updated parseStarRating to return null for missing/unrecognized ratings
- Fixed refreshAccessToken to handle 400 errors separately from 401 with proper status codes

### UI/UX

- Fixed text contrast on billing page "Upgrade to Pro" card in dark mode: added dark mode overrides for primary color palette (primary-50 through primary-950) to ensure proper contrast with light foreground text
- Improved contrast ratio from 1.05:1 to 11.76:1 (WCAG AAA compliant)
- Refined dark mode color scale strategy: fixed primary palette gradient discontinuity (smooth transition from primary-500 to primary-600)
- Added comprehensive dark mode overrides for accent palette (goldenrod) with inverted scale strategy maintaining semantic usage patterns
- Documented color system strategy in CSS comments to clarify the intentional partial inversion approach for WCAG contrast compliance

### Infrastructure

- Enhanced generate-types.js script to read SUPABASE_ACCESS_TOKEN from .env.local: added getAccessToken() function that checks environment variable first, then falls back to .env.local file, with proper quote and whitespace handling
- Fixed Windows compatibility by using shell: true option for spawnSync
- Created helper script (`scripts/generate-types.js`) to automatically extract Supabase project ID from environment variables and generate TypeScript types
- Added validation for Supabase project ID format in `scripts/generate-types.js`: validates extracted project IDs against 20-character alphanumeric pattern before use, treating invalid formats as not found to prevent errors from malformed URLs

### Database

- Added self-access fallback to users SELECT and UPDATE policies in non-idempotent migration: updated 001_initial_schema.sql to match idempotent version by adding `OR id = auth.uid()` to both SELECT and UPDATE policies
- Changed SELECT policy from `IN` to `=` for consistency, ensuring users can view/update their own record before organization_id is set
- Added self-update fallback to users UPDATE policy: modified the "Users can update users in their organization" policy in 001_initial_schema_idempotent.sql to include `OR id = auth.uid()` in the USING clause, matching the SELECT policy pattern, so users can update their own record even when organization_id is not yet set
- Fixed fragile self-referential RLS policy for users table: replaced the SELECT policy's self-referential subquery pattern in 001_initial_schema_idempotent.sql with a direct equality comparison (`organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())`)
- Added explicit self-view fallback (`OR id = auth.uid()`) so users can always see their own row even if the organization check fails, making the policy more robust
- Enhanced database cleanup migration: added explicit DROP POLICY statements for all RLS policies in 000_drop_all.sql before dropping tables, added notification_preferences table to cleanup, and documented that DROP INDEX statements are intentional (redundant but explicit for clarity) since DROP TABLE CASCADE already removes dependent indexes
- Updated all timestamp columns to use TIMESTAMPTZ consistently: changed organizations.trial_ends_at, organizations.created_at, users.created_at, voice_profiles.created_at, locations.created_at, reviews.review_date, reviews.created_at, responses.published_at, and responses.created_at from TIMESTAMP to TIMESTAMPTZ
- Applied changes in both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to ensure all timestamps store timezone information consistently with 002_add_notification_preferences.sql
- Added INSERT and DELETE policies for organizations table: added "Authenticated users can create organizations" policy (WITH CHECK auth.uid() IS NOT NULL) and "Users can delete their own organization" policy (USING id IN (SELECT organization_id FROM users WHERE id = auth.uid())) to both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to support organization creation and deletion by authenticated users
- Added INSERT policy for users table: added "Users can insert their own record" policy (WITH CHECK id = auth.uid()) to both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to allow OAuth callback to upsert user records during authentication flow
- Made notification_preferences migration (002_add_notification_preferences.sql) idempotent: added IF NOT EXISTS clauses, DROP POLICY IF EXISTS, and DROP TRIGGER IF EXISTS to allow safe reruns without errors
- Added migration for `notification_preferences` table (`supabase/migrations/002_add_notification_preferences.sql`) to support user email notification settings with RLS policies
- Changed `created_at` and `updated_at` columns in `notification_preferences` table from `TIMESTAMP` to `TIMESTAMPTZ` to store timezone-aware timestamps
- Added reusable `update_updated_at_column()` trigger function and BEFORE UPDATE trigger on `notification_preferences` table to automatically refresh `updated_at` timestamp on row modifications
- Fixed users table id column in initial schema: replaced `DEFAULT gen_random_uuid()` with `REFERENCES auth.users(id) ON DELETE CASCADE` to ensure profile rows match authenticated user IDs and RLS policies using `auth.uid()` work correctly

### Documentation

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

### Components

- Introduced shared `AuthDivider` and `GoogleOAuthButton` components
- Fixed update password redirect timeout cleanup on unmount

### Documentation

- Added setup runbook, API overview, and changelog documentation
- Clarified README with development status and documentation links

### Accessibility

- Removed redundant SVG titles
- Cleaned star icon aria attributes
- Reordered input help text placement
