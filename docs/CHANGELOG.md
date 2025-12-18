# Changelog

## 2025-12-17

- Implemented Google Business Profile API integration:
  - Added OAuth token capture in auth callback to store provider_refresh_token
  - Implemented 5 Google API client functions (refreshAccessToken, fetchAccounts, fetchLocations, fetchReviews, publishResponse)
  - Created `/api/locations` route for fetching and saving Google Business locations
  - Built LocationSelector component for selecting locations to sync
  - Implemented review polling cron job at `/api/cron/poll-reviews`
  - Created `/api/reviews/[reviewId]/publish` endpoint for publishing responses to Google
  - Updated `/api/reviews` route with real database queries, filtering, and pagination
  - Added comprehensive tests for Google API client
- Fixed update password redirect timeout cleanup on unmount to avoid stale callback.
- Introduced shared `AuthDivider` and `GoogleOAuthButton` components, refactoring auth forms to reuse them.
- Added ADR-006 for Next.js 16 / React 19 / Tailwind v4 upgrade path.
- Added ADRs documenting auth route grouping, Supabase auth flows, shared validation, middleware routing rules, and shared auth UI components.
- Improved accessibility: removed redundant SVG titles, cleaned star icon aria attributes, and reordered input help text placement.
- Refreshed documentation: updated architecture, roadmap, and spec to reflect current scaffolding state.
- Added setup runbook, API overview, and changelog documentation.
- Clarified README with development status and documentation links.
- Added workspace rules covering performance monitoring, accessibility, secrets, testing, migrations, feature flags, and architecture docs.

