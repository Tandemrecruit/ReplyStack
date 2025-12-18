# Changelog

## 2025-12-18

### Code Quality

- Fixed memory leak in Google API client's fetchWithTimeout function by using { once: true } option for abort event listener, ensuring it auto-removes after firing
- Removed redundant 400 status check in refreshAccessToken function that duplicated the unconditional error throw

### Testing

- Fixed all auth callback test mocks to return session from exchangeCodeForSession data property instead of getSession, matching the actual route implementation that reads session from exchangeCodeForSession response
- Enhanced auth callback test session mocks to include access_token for more complete and realistic session objects
- Fixed missing response_text test in publish route to mock reviews table query, allowing route to proceed to body validation and return intended 400 error instead of 404

### Code Quality

- Extracted inline type definitions (UserData, UserOrgData, SyncedLocation, NewOrg) to module level in locations route to reduce verbosity and improve maintainability
- Replaced @ts-expect-error suppressions with typed helper functions (typedInsert, typedUpdate, typedUpsert) for Supabase operations, improving type safety and maintainability

### Components

- Optimized location selector DELETE requests to run in parallel using Promise.allSettled, improving performance when deactivating multiple locations

### Testing

- Added comprehensive test coverage for Google API client, locations/publish/callback routes, and location-selector component with edge cases, error handling, and fetch parameter verification

### Google API Client

- Added 30-second timeout handling to all fetch calls using AbortController
- Improved location ID extraction with regex validation and filtering of invalid IDs
- Updated parseStarRating to return null for missing/unrecognized ratings
- Fixed refreshAccessToken to handle 400 errors separately from 401 with proper status codes

### Components

- Fixed location selector save handler to properly deactivate unselected locations
- Improved accessibility with semantic output element and ARIA attributes for loading state
- Simplified hasChanges logic in location selector

### API Routes

- Fixed poll-reviews cron to keep first user found per organization when multiple users have refresh tokens (deterministic behavior instead of last-writer-wins)
- Fixed poll-reviews cron to generate stable synthetic IDs for reviews missing external_review_id (using SHA-256 hash of location_id + reviewer_name + review_date) to prevent UNIQUE constraint violations from empty strings; reviews with insufficient data are skipped with logging
- Improved type safety in reviews route with proper interfaces
- Added proper error responses for user lookup failures and missing locations
- Fixed database update failure handling in publish route to prevent silent state inconsistency
- Added rollback logic for organization creation failures in locations route

### Infrastructure

- Fixed poll-reviews cron metric naming (newReviews → reviewsProcessed)
- Refactored auth callback to use session directly from exchangeCodeForSession()
- Fixed Biome linting errors
- Added ADR-013 through ADR-016 documenting Google Business Profile API integration decisions

### Documentation

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
