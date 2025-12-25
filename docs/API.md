# API Overview

Status: **MVP near complete.** Implemented: authentication; Google Business Profile integration (OAuth, location sync, tier-based review polling); AI response generation (Claude Haiku 4.5); voice profile management (tone quiz + custom tones); response editing modal; notification preferences; and landing page. Remaining: Stripe checkout/portal + webhook implementation, email sending (Resend), voice profile UI fields (example responses, words to use/avoid), and waitlist management.

## Auth Model

- Supabase auth; middleware refreshes sessions for all non-static routes.
- Protected routes return `401` when no Supabase user session is found.
- Cron endpoint uses `Authorization: Bearer $CRON_SECRET`.

## Routes

### GET /api/reviews

- Auth: Required (Supabase session).
- Query: `status?`, `rating?`, `page?`, `limit?`.
- Returns: `{ reviews: Review[], total: number, page: number, limit: number }`.
- Filters reviews by user's organization and supports pagination.

### POST /api/responses

- Auth: Required.
- Body: `{ reviewId: string }`.
- Generates an AI response for a review using Claude API.
- Returns existing response if one already exists (does not regenerate).
- Voice profile resolution: location-specific → organization → default.
- Returns: `{ id: string, reviewId: string, generatedText: string, status: "draft", tokensUsed: number }`.
- Error responses:
  - `400`: Missing reviewId, no organization, review has no text
  - `404`: User not found, review not found, review belongs to different organization
  - `429`: Rate limit exceeded (Claude API)
  - `500`: Database error, Claude API error, general server error
  - `502`: AI service unavailable
  - `504`: AI response generation timed out

### GET /api/cron/poll-reviews

- Auth: `Authorization: Bearer $CRON_SECRET`.
- Polls Google Business Profile API for new reviews across all active locations.
- Stores new reviews in database with deduplication.
- Updates existing reviews if they've changed.
- Returns: `{ success: boolean, reviewsProcessed: number, newReviews: number, errors: string[] }`.

### POST /api/webhooks/stripe

- Auth: Stripe signature header `stripe-signature` (verification not implemented).
- Current behavior: Returns `{ received: true }` after logging stub warning.
- Planned: verify signature, handle checkout/session + subscription lifecycle events.

## External Clients

- `lib/claude/client.ts`: Implements Claude API integration for AI response generation. Includes retry logic, timeout handling, and error management.
- `lib/google/client.ts`: Implements Google Business Profile API integration. Handles OAuth token refresh, account/location fetching, review retrieval, and response publishing.
- `lib/stripe/client.ts`: Placeholder; would create checkout/portal sessions, read subscription status, verify webhooks.

