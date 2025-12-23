# Changelog

## 2025-12-23

### Code Quality

- Consolidated bloated test files using shared helpers and parameterized tests: created `tests/helpers/fixtures.ts` (test data factories for Review, Location, User, VoiceProfile, Organization, Response), `tests/helpers/supabase-mocks.ts` (Supabase client mock factories), and `tests/helpers/assertions.ts` (custom assertion helpers); refactored 4 largest test files (`responses/route.test.ts` from ~2466 to ~460 lines, `poll-reviews/route.test.ts` from ~2260 to ~650 lines, `google/client.test.ts` from ~1133 to ~440 lines, `claude/client.test.ts` from ~1000 to ~440 lines) using `it.each` for parameterized tests and shared mock setup, reducing total lines by ~60% while maintaining all 882 tests passing
- Made landing page hero test resilient to copy changes: updated test to check for key concepts (restaurants, dental, service shops, local businesses) in hero description text content rather than exact wording, preventing test failures when marketing copy is updated while still verifying target audience messaging is present
- Consolidated redundant edge case tests in poll-reviews route: replaced four individual error handling tests (lines 1557-1737) with a single parametrized test that covers token decryption, token refresh, fetchReviews, and database upsert errors with agency tier explicitly set, reducing test bloat while maintaining identical coverage and mocks
- Simplified upsert_response function by removing redundant update-case logic: removed preliminary SELECT and IF/ELSE branch that computed values for updates since ON CONFLICT block already handles generated_text preservation and edited_text recomputation, keeping only insert-path logic that sets v_new_generated_text := p_generated_text and v_edited_text := NULL, and dropped unused v_existing_generated_text variable
- Fixed direct publish logic in upsert_response function: changed insert path to set `generated_text := NULL` (not COALESCE to final_text) when `p_generated_text IS NULL` for direct publishes, ensuring direct publishes correctly store NULL in generated_text column instead of incorrectly falling back to final_text value
- Added backup step before destructive DELETE in responses migration: created timestamped backup table (`responses_duplicates_backup_YYYY_MM_DD_HH24_MI_SS`) containing duplicate rows before deletion in migration 007, added explicit warnings about irreversibility in SQL comments, and documented that the deletion is destructive and should be reviewed in production before applying
- Scoped information_schema queries in custom_tones migration to public schema: added `AND table_schema = 'public'` to both IF EXISTS checks (table and column detection) in migration 005 to prevent matching identically named objects in other schemas, ensuring cleanup and NOT NULL alterations only target public.custom_tones
- Fixed Supabase type definitions to match database schema: updated `responses.Update.generated_text` to allow `string | null` (was `string`) to match nullable column, fixed `custom_tones` types to require `organization_id: string` (not nullable) and added missing `updated_at` field to Row/Insert/Update types, ensuring typed helpers accurately reflect the actual database schema
- Separated status state for Voice Profile form and custom tones loader in settings page: introduced dedicated `customTonesError` state for custom tones fetch errors, updated `fetchCustomTones` to set custom-tone-specific error state instead of shared `status`, and added error message display for custom tones loading failures while keeping Voice Profile form bound to original `status` state to prevent message overwrites
- Fixed focus stealing on page load in settings dialog effect: added `wasOpenRef` to track previous dialog state and guard close/restore logic so it only runs when dialog was previously open, preventing focus restoration and dialog.close() from executing on initial mount when dialog was never open
- Added accessible label for custom-tone select in settings: added proper `<label htmlFor="custom-tone-select">` with sr-only class to associate the select with assistive technology while keeping existing paragraph as supplemental visual text, improving accessibility for screen reader users
- Optimized tier processing decision in poll-reviews cron: precompute and cache `allowedToProcessTier` boolean for each tier once per run using TIME_WINDOW_TOLERANCE_MINUTES, TIER_CONFIG, currentTime, and last_processed_at, then consult cached map when filtering locations instead of recalculating time-window logic and target minutes for each location, reducing redundant computations
- Added requestId to all console.error calls in tone-quiz generate route: updated error logging in generateCustomTone function and POST handler catch blocks to include requestId in error messages, enabling log correlation across error paths for better debugging and monitoring
- Fixed client-side UX edge cases uncovered by tests: allow Tone Quiz “Next” to trigger validation when no answer is selected, prevent duplicate “Tone Quiz” headings by avoiding redundant modal title semantics and by unmounting quiz content when closed, compose consecutive ReviewsFilters changes correctly without relying on updated search params, and include HTTP status details when GenerateResponseButton encounters HTML error responses

### Database

- Fixed migration 007 to preserve orphaned responses: added `review_id IS NOT NULL` condition to DELETE statement and backup query to prevent deletion of responses with NULL review_id, updated migration comments to explicitly state that orphaned responses (review_id IS NULL) are preserved and not affected by deduplication logic

### Documentation

- Updated ARCHITECTURE.md polling strategy documentation: replaced outdated flat 15-minute per-location polling description with current tier-based scheduling implementation, updated vercel.json snippet to show 5-minute cron schedule, documented tier intervals (agency: 5min, growth: 10min, starter: 15min), explained cron_poll_state table usage for per-tier timestamp tracking, and added details about time-window tolerance and best-effort deduplication to match actual implementation
- Fixed poll-reviews cron JSDoc to reflect actual scheduling logic: updated GET handler and shouldProcessForTier function JSDoc comments to describe time-window tolerance + best-effort deduplication approach instead of inaccurate "every 2nd/3rd run" wording, now correctly states "approximately every X minutes using a resilient time window with best‑effort deduplication based on last_processed timestamps"

### UI/UX

- Updated landing page tone quiz description: changed "6-question tone quiz" to "10-question tone quiz" in the "Set Your Voice" section to accurately reflect the current quiz length
- Removed generic "Built for local businesses" badge from hero section: removed the common AI site badge pattern to create a cleaner, more unique landing page design

## 2025-12-22

### Security

- Fixed PII exposure in tone quiz generate route fallback logging: removed `parsedLines` array (containing untruncated Claude response) from fallback log output, replaced with bounded metadata only (lineCount, appliedDefaults, and safe preview limited to first 100 characters of first line or truncatedResponse), ensuring no full or raw lines are emitted to logs to honor PII mitigation
- Fixed concurrent publish race condition in `/api/reviews/[reviewId]/publish`: added UNIQUE constraint on `responses.review_id` and implemented atomic upsert using database function `upsert_response` with `ON CONFLICT` handling to prevent duplicate response records when multiple publish requests arrive simultaneously for the same review, ensuring one response per review at the database level

### Database

- Fixed incorrect comment and added auto-update trigger for `cron_poll_state` table: corrected `tier` column comment to remove incorrect "or null" reference (tier is PRIMARY KEY and cannot be null) and list only valid values ('agency', 'growth', 'starter'), and added `update_cron_poll_state_updated_at` trigger that uses the existing `update_updated_at_column()` function to automatically maintain `updated_at` timestamp on row modifications
- Made `organization_id` NOT NULL in `custom_tones` table: added NOT NULL constraint to prevent orphaned rows and ensure RLS policies work correctly, included pre-migration cleanup step to delete any existing rows with NULL organization_id before applying the constraint, and added defensive check to handle cases where table might exist from previous partial migrations
- Added `updated_at` column and auto-update trigger to `custom_tones` table: added `updated_at TIMESTAMPTZ DEFAULT now()` column and created `update_custom_tones_updated_at` trigger that uses the existing `update_updated_at_column()` function to automatically maintain `updated_at` timestamp whenever a row is modified
- Made `generated_text` nullable in `responses` table to distinguish AI-generated vs user-written responses: direct publishes (user-written) now have `generated_text` set to null, while AI-generated responses preserve the generated text, enabling accurate analytics and reporting on response origin
- Enhanced custom tone validation in voice_profiles constraint: updated tone constraint to validate UUID format for custom tones (e.g., `custom:{uuid}`), ensuring the UUID portion matches standard format (8-4-4-4-12 hex digits with dashes) and total length is exactly 43 characters, preventing invalid values like `custom:abc` from being stored

### Code Quality

- Preserved ClaudeAPIError type in tone quiz generate route: updated error handling to re-throw `ClaudeAPIError` instances instead of replacing them with generic `Error`, enabling downstream callers to access specific error status codes and type information for better error tracking and handling
- Fixed CustomTone type to match nullable database column: updated `enhancedContext` field in `CustomTone` type from `string` to `string | null` to match the nullable `enhanced_context` database column, and updated `/api/custom-tones` and `/api/tone-quiz/generate` endpoints to explicitly preserve nulls in mapping (using `?? null` for clarity)
- Clarified atomicity guarantees in poll-reviews cron route: updated doc comments to reflect "best-effort deduplication" rather than strict single-run guarantees, noting that overlapping cron invocations may both process the same tier if they read the same old last_processed_at before either completes, which is acceptable because review upserts are idempotent by external_review_id
- Fixed dialog event handlers and focus management in settings tone quiz modal: changed dialog to always render (removed conditional rendering) and control visibility with `showModal()`/`close()`, consolidated event handlers and focus management into single effect that depends on `showQuiz`, ensuring ESC key and backdrop click handlers are properly attached and focus restoration works reliably
- Fixed malformed tone display for custom tones in Claude client: changed logic to return "Custom Tone" label when tone starts with "custom:" prefix instead of replacing prefix and leaving ID suffix (e.g., "Custom Toneabc123"), ensuring proper nil-safe access and correct display in system prompts
- Extracted shared CustomTone type definition: created `lib/types/custom-tone.ts` with consistent camelCase field names (`enhancedContext`, `createdAt`) matching API response format, updated `tone-quiz.tsx`, `settings-client.tsx`, and `voice-editor.tsx` to import and use the shared type, and updated `/api/tone-quiz/generate` to return `createdAt` for consistency with `/api/custom-tones` endpoint
- Added convenience type aliases for frequently used database tables: added `User`, `Organization`, `OrganizationInsert`, `Response`, `ResponseInsert`, `LocationInsert`, and `VoiceProfileInsert` type aliases in `lib/supabase/types.ts` following existing pattern to improve type ergonomics across the codebase
- Added response validation in tone quiz component: added defensive checks to validate API response structure and required fields (id, name, description, enhancedContext, createdAt) with correct types before calling setGeneratedTone, sets user-friendly error messages and returns early if validation fails, ensuring UI remains stable when API returns malformed JSON or unexpected shapes without throwing errors
- Added duplicate questionId validation in tone quiz generate route: added uniqueness check using Set to detect duplicate questionId values in answers array, returns 400 error with message "Duplicate answers for a question detected" when duplicates are found, ensuring each questionId appears at most once in the request
- Enhanced input validation in tone quiz generate route: added comprehensive validation function that checks each answer object for valid questionId (matches QUIZ_QUESTIONS), ensures answerIds is a non-empty array, and validates all answerIds exist in the matched question's answers, with descriptive error messages (e.g., "Invalid question ID: X", "Missing answers for question X", "Invalid answer ID Y for question X") and short-circuit behavior on first invalid item
- Fixed silent failure in publish route: added error handling for existing response query to properly handle Supabase query errors instead of treating them as "no existing response", preventing incorrect inserts and ensuring flow aborts on query failure
- Extracted QUIZ_QUESTIONS array to shared module: moved duplicated quiz questions constant from `app/api/tone-quiz/generate/route.ts` and `components/voice-profile/tone-quiz.tsx` to `lib/quiz/questions.ts`, exported Question and QuizAnswer types, and updated both files to import from the shared module
- Refactored tone quiz generate route to use shared Claude client: exported `callClaudeWithRetry` from `lib/claude/client.ts`, replaced duplicated `callClaudeForTone` function in `app/api/tone-quiz/generate/route.ts` with call to `callClaudeWithRetry`, and removed duplicated constants, timeout handling, fetch logic, and error parsing code to centralize retry behavior and error handling in the client module
- Improved JSON extraction robustness in tone quiz generate route: replaced greedy regex `/\{[\s\S]*\}/` with brace-balancing extractor that correctly handles nested objects and finds the first complete JSON object, added error handling for parse failures, and updated Claude prompts to explicitly require only JSON output with no surrounding text to reduce parsing fragility
- Extracted `fetchCustomTones` function to component scope: moved function from inside useEffect to component scope to eliminate code duplication, consolidated JSON parsing, Array.isArray check, setCustomTones, and error handling into single reusable function, replaced inline fetch chain in ToneQuiz onComplete callback with call to extracted function, added optional `showLoading` parameter to control loading state display
- Improved error handling for custom tones loading: updated `fetchCustomTones` to display user-facing error messages via status UI, reset custom tones to empty array on failure to avoid stale data, and handle both network errors and non-OK HTTP responses; also improved error handling in ToneQuiz onComplete callback for consistency
- Normalized custom tone naming convention: updated `/api/custom-tones` to return `enhancedContext` (camelCase) instead of `enhanced_context` (snake_case) at API boundary, and updated `CustomTone` types in `settings-client.tsx` and `voice-editor.tsx` to use `enhancedContext` for consistency with `ToneQuiz` component
- Completed custom tone API normalization: normalized `created_at` to `createdAt` in `/api/custom-tones` response and updated `CustomTone` types in `settings-client.tsx` and `voice-editor.tsx` to use `createdAt` for full camelCase consistency across all custom tone endpoints
- Fixed TypeScript errors: added missing type exports (Review, ReviewInsert, VoiceProfile, Location, UserInsert) and custom_tones table definition to Database type, fixed currentQuestion undefined issues in tone-quiz component, and corrected Json type casting in tone-quiz generate route

### Infrastructure

- Added warning-level logging for fallback parsing in tone quiz generate route: logs structured JSON with requestId, truncated Claude response (max 500 chars to avoid PII leaks), bounded metadata (lineCount, appliedDefaults, and safe preview limited to first 100 characters of first line or truncatedResponse), and metric counter (`fallback_parsing_triggered`) to monitor frequency and debug low-quality outputs when JSON parsing fails
- Replaced exact-minute tier scheduling with resilient time-window approach in poll-reviews cron: implemented approach (B) using time-window checks (+/- 2 minutes) with last-processed timestamp deduplication to prevent duplicate runs and handle cron timing variations gracefully, added `cron_poll_state` table to track last processed timestamp per tier, updated scheduling logic to use atomic database updates for race condition prevention

### UI/UX

- Improved clarity of tone quiz question 2 answer 3: updated text from "Thank for feedback and invite private discussion" to "Thank them for the feedback and invite private discussion" for better readability
- Added loading indicator for custom tones section in voice editor: renders skeleton placeholder grid (2-column layout matching button size) with animated pulse effect when isLoadingCustomTones is true, provides visual feedback during loading, and displays empty-state message when loading completes and no custom tones are available

### Accessibility

- Improved keyboard accessibility for tone quiz modal: converted modal overlay to native `<dialog>` element with proper focus management (saves trigger element, focuses first focusable element on open, restores focus on close), ESC key handling, backdrop click handling, focus trapping via native dialog, aria-modal and role attributes, and marks background content as aria-hidden/inert when open
- Fixed tone quiz modal to fully comply with ADR-027 pattern: removed redundant `role="dialog"` and `aria-modal="true"` attributes (implicit with native `<dialog>`), added `aria-labelledby` reference to hidden dialog title for proper accessibility, and added ADR-027 comment reference
- Enhanced tone quiz answer button accessibility: added ARIA roles (`role="checkbox"` for multi-select, `role="radio"` for single-select), `aria-checked` attributes to expose selection state to screen readers, `aria-labelledby` references to answer text spans for accessible names, and marked decorative SVG icons as `aria-hidden="true"` to remove duplicate state announcements

### Testing

- Added tests for update path when response already exists in publish route: tests verify that when maybeSingle() returns an existing response, the update path is taken (preserving generated_text, setting edited_text when content differs, and setting edited_text to null when content matches)
- Added custom tone enhanced context tests for responses API route: tests verify that custom tones (e.g., `tone: "custom:uuid"`) properly fetch and pass enhanced_context value to generateResponse, including edge cases where custom tone has no enhanced_context or doesn't exist (both pass undefined)
- Added tier-specific processing tests for poll-reviews cron route: tests verify starter tier (processes every 15 minutes), growth tier (processes every 10 minutes), and agency tier (processes every run) behavior using fake timers to control current minute
- Fixed settings client test error message handling: improved JSON parsing error handling to properly check response.ok before showing error messages
- Fixed API responses route tests: updated generateResponse call assertions to include the 5th argument (customToneEnhancedContext) that was missing from test expectations
- Fixed cron poll-reviews route tests: added organizations table mock to test helper to support tier-based filtering logic, and added check to skip locations without id field to prevent errors
- Fixed remaining 10 failing tests: updated all settings client tests to mock both /api/notifications and /api/custom-tones fetch calls that occur on component mount, and added organizations table mock to edge case test for locations without id field

### Documentation

- Updated API.md with missing endpoints: added comprehensive documentation for GET/POST /api/locations, GET /api/custom-tones, POST /api/tone-quiz/generate, GET/PUT /api/notifications, and PUT /api/voice-profile endpoints with request/response formats and error codes
- Updated ARCHITECTURE.md database schema: added custom_tones, notification_preferences, and cron_poll_state tables to schema documentation, updated responses table to show generated_text as nullable, added indexes for custom_tones table, and updated implementation status to reflect latest features
- Created FEATURES.md: comprehensive feature documentation covering tone quiz, response editing modal, custom tones, notification preferences, location management, voice profile management, review polling, response generation, and response publishing with technical details, user flows, API endpoints, and database schemas
- Updated SPEC.md: enhanced user flows to include response editing modal details, added detailed information about tone quiz features and custom tone generation, expanded response workflow documentation with accessibility features and error handling details
- Updated README.md: added reference to new FEATURES.md documentation file in documentation section
- Updated SETUP.md: updated status to reflect completion of custom tones, tone quiz, response editing modal, and notification preferences features
- Updated DECISIONS.md: updated ADR-028 to reflect that generated_text is nullable (for direct publishes), added ADR-029 for custom tones architecture, added ADR-030 for tier-based cron polling with time-window approach, and added ADR-031 for atomic upsert for response publishing
- Updated ADR-020 to reflect actual implementation: corrected encryption utility location (`lib/crypto/encryption.ts`), IV storage format (embedded in payload vs separate column), environment variable name (`TOKEN_ENCRYPTION_KEY`), and plaintext column retention for backward compatibility
- Updated documentation to reflect current implementation status: marked response editing modal and character/word count as complete in ROADMAP.md, updated SPEC.md to include word count and tone quiz features, updated README.md development status, and updated ARCHITECTURE.md implementation status section

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
