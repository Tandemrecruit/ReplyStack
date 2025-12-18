# Changelog

## 2025-12-19

- Updated all timestamp columns to use TIMESTAMPTZ consistently: changed organizations.trial_ends_at, organizations.created_at, users.created_at, voice_profiles.created_at, locations.created_at, reviews.review_date, reviews.created_at, responses.published_at, and responses.created_at from TIMESTAMP to TIMESTAMPTZ in both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to ensure all timestamps store timezone information consistently with 002_add_notification_preferences.sql
- Added missing type aliases to lib/supabase/types.ts: exported convenience types (Review, ReviewInsert, ReviewUpdate, VoiceProfile, VoiceProfileInsert, VoiceProfileUpdate, Location, LocationInsert, LocationUpdate, User, UserInsert, UserUpdate, Organization, OrganizationInsert, OrganizationUpdate, Response, ResponseInsert, ResponseUpdate) to fix TypeScript import errors
- Fixed TypeScript errors: updated review-card component to handle null status values, fixed vitest.config.ts by removing unsupported environmentMatchGlobs property, and added null check in voice-editor test
- Added INSERT and DELETE policies for organizations table: added "Authenticated users can create organizations" policy (WITH CHECK auth.uid() IS NOT NULL) and "Users can delete their own organization" policy (USING id IN (SELECT organization_id FROM users WHERE id = auth.uid())) to both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to support organization creation and deletion by authenticated users
- Added INSERT policy for users table: added "Users can insert their own record" policy (WITH CHECK id = auth.uid()) to both 001_initial_schema.sql and 001_initial_schema_idempotent.sql migrations to allow OAuth callback to upsert user records during authentication flow
- Fixed location-selector test to query checkboxes by accessible name: replaced `getAllByRole("checkbox")` array indexing with `getByRole("checkbox", { name: /Location 1/i })` and similar queries to make tests independent of DOM order and more maintainable
- Removed non-null assertion in location-selector component: replaced `loc.id!` with a type guard in the filter function using type predicate `(loc): loc is LocationData & { id: string }` to properly narrow the type and eliminate the need for non-null assertion

- Updated generate-types.js warning message with cross-platform examples: replaced PowerShell-only syntax with POSIX (macOS/Linux), PowerShell (Windows), and cross-env examples so users on all platforms know how to set SUPABASE_ACCESS_TOKEN environment variable
- Added python/tests to pyrightconfig.json extraPaths: included "python/tests" in extraPaths array alongside python/src and python/automation to ensure pyright can resolve imports in test files consistently with other Python modules
- Enhanced generate-types.js script to read SUPABASE_ACCESS_TOKEN from .env.local: added getAccessToken() function that checks environment variable first, then falls back to .env.local file, with proper quote and whitespace handling; fixed Windows compatibility by using shell: true option for spawnSync
- Added generated-file header and manual additions delimiter to lib/supabase/types.ts: added header comment at top indicating auto-generated content and delimiter comment before manual convenience aliases section to clearly mark which portions are safe to edit
- Fixed truncated command in Supabase setup troubleshooting: replaced incomplete `npx supabase@latest ...` with complete type generation command including `gen types typescript` subcommand, `--project-id`/`--project-ref` flag, `--schema public` flag, and output redirection to `lib/supabase/types.ts` with placeholders for project ID/ref
- Merged duplicate 2025-12-18 sections in changelog: consolidated two "## 2025-12-18" headings into a single section, merged duplicate subsections (Code Quality, Testing, Components, API Routes, Infrastructure, Documentation) and removed the empty duplicate heading to fix MD024 linting error
- Replaced local VoiceProfile type derivation in voice-editor component with direct import from shared types: removed `type VoiceProfile = Database["public"]["Tables"]["voice_profiles"]["Row"]` and updated import to use exported `VoiceProfile` from `@/lib/supabase/types` for consistency
- Removed redundant filter in location-selector deactivation pipeline: eliminated duplicate `loc.id` check by mapping directly over `locationsToDeactivate` (which already filters for `loc.id`) instead of filtering again before mapping, added non-null assertion for type safety
- Fixed misleading comment in app/globals.css: updated "Star rating colors - adjusted for dark mode" to "Star rating colors - maintains consistent gold (#f4b41a) across modes" to accurately reflect that the star color value remains the same in both light and dark modes
- Enhanced color system documentation: added comprehensive usage examples and warnings about semantic inversion in CSS comments, created design system guide (docs/DESIGN_SYSTEM.md) with use case mappings, quick reference tables, and common patterns to reduce cognitive load when working with partially inverted color scales in dark mode
- Refactored voice-profile route update object construction: replaced verbose field-by-field checks with concise Object.entries/Object.fromEntries approach that filters out undefined values, maintaining same runtime behavior and VoiceProfileUpdate type safety
- Fixed potential empty string insertion in auth callback route: added email validation to ensure non-empty email before upserting to users table (NOT NULL constraint); uses provider-scoped synthetic email fallback (`${user.id}@google-noreply`) when OAuth provider doesn't return an email, with warning log for monitoring
- Fixed potential NaN issue in voice-editor component: added fallback value (150) for max_length when parseInt returns NaN on invalid input
- Made notification_preferences migration (002_add_notification_preferences.sql) idempotent: added IF NOT EXISTS clauses, DROP POLICY IF EXISTS, and DROP TRIGGER IF EXISTS to allow safe reruns without errors
- Corrected roadmap voice profile setup status: marked as partially complete (~) instead of fully complete (X) - API supports all fields (example_responses, words_to_use, words_to_avoid, max_length) but settings UI is missing these input fields
- Fixed line length linting error in python/automation/example_task.py: split long docstring line (162 chars) into multiple lines to comply with 100-character limit
- Fixed Python import resolution error in python/tests/test_example_module.py: added pyright ignore comment and configured pyrightconfig.json with extraPaths to resolve example_module import (works at runtime via pytest pythonpath, but linter needed explicit configuration)
- Fixed unused variable warning in python/tests/test_example_task.py: removed unused `result` variable assignment from subprocess.run() call since check=True already ensures command success
- Fixed TypeScript "Object is possibly 'undefined'" error in tests/app/(auth)/callback/route.test.ts: added runtime check for mock result value before accessing upsert property to satisfy type safety requirements
- Fixed TypeScript array index type error in tests/components/settings/location-selector.test.tsx: added length assertion and runtime check before accessing checkbox array elements to ensure type safety

### Documentation

- Updated roadmap to reflect current implementation status: marked Google Business Profile integration, review polling, voice profile setup, and landing page as complete; updated dashboard UI and response publishing status to reflect partial completion

## 2025-12-18

- Fixed missing type exports in lib/supabase/types.ts: added Review, VoiceProfile, and Location type aliases to resolve import errors in lib/claude/client.ts and other files
- Fixed line length linting error in python/automation/example_task.py: split long docstring line (162 chars) into multiple lines to comply with 100-character limit

### Code Quality

- Fixed TypeScript type inference errors in poll-reviews cron by adding explicit type assertions for location and user query results, and casting Supabase admin client method chains to work around generic inference limitations
- Fixed null rating handling in poll-reviews cron: reviews without ratings now correctly set sentiment to null instead of defaulting to "negative", accurately representing text-only reviews without star ratings
- Fixed memory leak in Google API client's fetchWithTimeout function by using { once: true } option for abort event listener, ensuring it auto-removes after firing
- Removed redundant 400 status check in refreshAccessToken function that duplicated the unconditional error throw
- Extracted inline type definitions (UserData, UserOrgData, SyncedLocation, NewOrg) to module level in locations route to reduce verbosity and improve maintainability
- Replaced @ts-expect-error suppressions with typed helper functions (typedInsert, typedUpdate, typedUpsert) for Supabase operations, improving type safety and maintainability

### Components

- Fixed TypeScript type error in location-selector: added null check for `result.value.error` before pushing to errors array to handle `string | undefined` type
- Fixed missing VoiceProfile export in voice-editor: replaced import with Database type pattern (`Database["public"]["Tables"]["voice_profiles"]["Row"]`) to match Supabase type structure
- Optimized location selector DELETE requests to run in parallel using Promise.allSettled, improving performance when deactivating multiple locations
- Fixed location selector save handler to properly deactivate unselected locations
- Improved accessibility with semantic output element and ARIA attributes for loading state
- Simplified hasChanges logic in location selector

### API Routes

- Fixed TypeScript type errors in reviews route: updated `ReviewWithLocation` interface to allow nullable types for `has_response`, `status`, and `created_at` fields to match Supabase query result types
- Added explicit export for `UserInsert` type in `lib/supabase/types.ts` (export type UserInsert = TablesInsert<"users">) to fix missing export used by auth callback route
- Removed unused `@ts-expect-error` directive from auth callback route; type inference now works correctly with UserInsert type
- Added explicit export for `ReviewInsert` type in `lib/supabase/types.ts` (export type ReviewInsert = TablesInsert<"reviews">) to fix missing export used by poll-reviews route
- Added runtime validation for voice-profile PUT route request body using Zod schema to validate types (strings, positive integers for max_length, string arrays) and prevent malformed input from causing unexpected behavior
- Fixed locations route type imports: replaced non-existent exported types (LocationInsert, LocationUpdate, OrganizationInsert, UserUpdate) with local type definitions using Database type, following the pattern used in voice-profile route
- Fixed locations POST route to parse and validate request body before organization creation, preventing organizations from being created for invalid requests; body parsing and validation (ensuring body exists and body.locations is an Array) now runs immediately after authentication and returns 400 immediately on invalid input
- Created `/api/voice-profile` route handler with GET and PUT methods for fetching and updating voice profiles for authenticated users' organizations
- Fixed poll-reviews cron to keep first user found per organization when multiple users have refresh tokens (deterministic behavior instead of last-writer-wins)
- Fixed poll-reviews cron to generate stable synthetic IDs for reviews missing external_review_id (using SHA-256 hash of location_id + reviewer_name + review_date) to prevent UNIQUE constraint violations from empty strings; reviews with insufficient data are skipped with logging
- Improved type safety in reviews route with proper interfaces
- Added proper error responses for user lookup failures and missing locations
- Fixed database update failure handling in publish route to prevent silent state inconsistency
- Added rollback logic for organization creation failures in locations route

### Google API Client

- Added 30-second timeout handling to all fetch calls using AbortController
- Improved location ID extraction with regex validation and filtering of invalid IDs
- Updated parseStarRating to return null for missing/unrecognized ratings
- Fixed refreshAccessToken to handle 400 errors separately from 401 with proper status codes

### Testing

- Fixed all auth callback test mocks to return session from exchangeCodeForSession data property instead of getSession, matching the actual route implementation that reads session from exchangeCodeForSession response
- Enhanced auth callback test session mocks to include access_token for more complete and realistic session objects
- Fixed missing response_text test in publish route to mock reviews table query, allowing route to proceed to body validation and return intended 400 error instead of 404
- Added comprehensive test coverage for Google API client, locations/publish/callback routes, and location-selector component with edge cases, error handling, and fetch parameter verification

### UI/UX

- Fixed text contrast on billing page "Upgrade to Pro" card in dark mode: added dark mode overrides for primary color palette (primary-50 through primary-950) to ensure proper contrast with light foreground text, improving contrast ratio from 1.05:1 to 11.76:1 (WCAG AAA compliant)
- Refined dark mode color scale strategy: fixed primary palette gradient discontinuity (smooth transition from primary-500 to primary-600), added comprehensive dark mode overrides for accent palette (goldenrod) with inverted scale strategy maintaining semantic usage patterns, and documented color system strategy in CSS comments to clarify the intentional partial inversion approach for WCAG contrast compliance

### Infrastructure

- Created helper script (`scripts/generate-types.js`) to automatically extract Supabase project ID from environment variables and generate TypeScript types
- Added validation for Supabase project ID format in `scripts/generate-types.js`: validates extracted project IDs against 20-character alphanumeric pattern before use, treating invalid formats as not found to prevent errors from malformed URLs
- Fixed command injection vulnerability in `scripts/generate-types.js`: replaced `execSync` with shell interpolation with `spawnSync` using argument array, removed `shell: true`, pass `projectId` as separate argument, and use `createWriteStream` to pipe stdout to file instead of shell redirection
- Fixed poll-reviews cron metric naming (newReviews → reviewsProcessed)
- Refactored auth callback to use session directly from exchangeCodeForSession()
- Fixed Biome linting errors
- Added ADR-013 through ADR-016 documenting Google Business Profile API integration decisions

### Database

- Added migration for `notification_preferences` table (`supabase/migrations/002_add_notification_preferences.sql`) to support user email notification settings with RLS policies
- Changed `created_at` and `updated_at` columns in `notification_preferences` table from `TIMESTAMP` to `TIMESTAMPTZ` to store timezone-aware timestamps
- Added reusable `update_updated_at_column()` trigger function and BEFORE UPDATE trigger on `notification_preferences` table to automatically refresh `updated_at` timestamp on row modifications
- Removed redundant `CREATE INDEX idx_notification_preferences_user_id` from notification_preferences migration since `user_id` PRIMARY KEY already provides the necessary index
- Fixed users table id column in initial schema: replaced `DEFAULT gen_random_uuid()` with `REFERENCES auth.users(id) ON DELETE CASCADE` to ensure profile rows match authenticated user IDs and RLS policies using `auth.uid()` work correctly
- Removed redundant `CREATE INDEX idx_users_email` from initial schema: replaced with `DROP INDEX IF EXISTS idx_users_email` since `users.email` UNIQUE constraint already creates an index automatically, preventing duplicate index conflicts

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
- Refactored changelog with category-based organization (Testing, Google API Client, Components, API Routes, Infrastructure) for improved readability

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
