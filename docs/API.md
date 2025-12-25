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
  - `429` (`RATE_LIMITED`): Claude API rate limit exceeded (retry after delay)
  - `500` (`DB_ERROR`): Database operation failed (retry may help)
  - `500` (`INTERNAL_ERROR`): Unexpected server error (retry may help)
  - `502` (`AI_SERVICE_ERROR`): Claude API unreachable or returned error (retry after delay)
  - `504` (`AI_TIMEOUT`): AI response generation timed out (retry with same request)
- Error response format: `{ error: string, code?: string }`

### POST /api/reviews/[reviewId]/publish

- Auth: Required (Supabase session).
- Body: `{ response_text: string }`.
- Publishes a response to Google Business Profile as a reply to the specified review.
- Updates the review status to "responded" and `has_response` to `true`.
- Saves response to database:
  - If response already exists: preserves `generated_text`, stores edits in `edited_text` (only if modified), sets `final_text` to published content.
  - If no existing response: creates new response record with `generated_text` and `final_text` set to published content.
- Returns: `{ success: boolean, message: string, response_id: string, published_at: string }`.
- Error responses:
  - `400`: Missing or empty `response_text`, Google account not connected (`GOOGLE_NOT_CONNECTED`), no organization
  - `401` (`GOOGLE_AUTH_EXPIRED`): Unauthorized, Google authentication expired or corrupted (requires reconnection)
  - `403` (`GOOGLE_PERMISSION_DENIED`): Google API permission denied (user must re-authorize)
  - `404`: User not found, review not found, review belongs to different organization
  - `500` (`INTERNAL_ERROR`): Unexpected server error (retry may help)
  - `502` (`GOOGLE_API_ERROR`): Google Business Profile API unreachable or returned error (retry after delay)
- Error response format: `{ error: string, code?: string }`
- Note: If Google publish succeeds but database update fails, returns `200` with `warning` field indicating database inconsistency.

### GET /api/cron/poll-reviews

- Auth: `Authorization: Bearer $CRON_SECRET`.
- Polls Google Business Profile API for new reviews across all active locations.
- Stores new reviews in database with deduplication.
- Updates existing reviews if they've changed.
- Returns: `{ success: boolean, reviewsProcessed: number, newReviews: number, errors: string[] }`.

### GET /api/locations

- Auth: Required (Supabase session).
- Fetches all Google Business Profile locations for the authenticated user's connected accounts.
- Returns: `{ locations: LocationWithStatus[] }` where each location includes:
  - `id?`: Database ID if location is synced
  - `google_account_id`: Google account ID
  - `google_location_id`: Google location ID
  - `name`: Location name
  - `address`: Location address
  - `account_name`: Name of the Google account
  - `is_synced`: Boolean indicating if location is saved in database
- Error responses:
  - `401` (`GOOGLE_AUTH_EXPIRED`): Unauthorized, Google authentication expired or corrupted (requires reconnection)
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error
  - `502` (`GOOGLE_API_ERROR`): Google API unreachable or returned error

### POST /api/locations

- Auth: Required (Supabase session).
- Body: `{ locations: Array<{ google_account_id: string, google_location_id: string, name: string, address?: string }> }`.
- Saves selected locations to the user's organization. Creates organization if user doesn't have one.
- Returns: `{ saved: number, locations: Location[] }`.
- Error responses:
  - `400`: Invalid request body, missing required fields
  - `401`: Unauthorized
  - `404`: User not found
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error
  - `502` (`GOOGLE_API_ERROR`): Google API unreachable or returned error

### GET /api/custom-tones

- Auth: Required (Supabase session).
- Fetches all custom tones for the authenticated user's organization.
- Returns: `Array<{ id: string, name: string, description: string, enhancedContext: string | null, createdAt: string }>`.
- Custom tones are returned in camelCase format (normalized from database snake_case).
- Error responses:
  - `401`: Unauthorized
  - `404`: User not found, organization not found
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error

### POST /api/tone-quiz/generate

- Auth: Required (Supabase session).
- Body: `{ answers: Array<{ questionId: number, answerIds: number[] }> }`.
- Generates a custom tone based on quiz responses using Claude AI.
- Validates quiz answers structure and content before processing.
- Returns: `{ customTone: { id: string, name: string, description: string, enhancedContext: string | null, createdAt: string } }`.
- Error responses:
  - `400`: Invalid request body, missing answers, duplicate question IDs, invalid question/answer IDs
  - `401`: Unauthorized
  - `404`: User not found, organization not found
  - `429` (`RATE_LIMITED`): Claude API rate limit exceeded (retry after delay)
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error
  - `502` (`AI_SERVICE_ERROR`): Claude API unreachable or returned error
  - `504` (`AI_TIMEOUT`): AI response generation timed out

### GET /api/notifications

- Auth: Required (Supabase session).
- Fetches email notification preference for the authenticated user.
- Returns: `{ emailNotifications: boolean }` (defaults to `true` if no preference set).
- Error responses:
  - `401`: Unauthorized
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error

### PUT /api/notifications

- Auth: Required (Supabase session).
- Body: `{ emailNotifications: boolean }`.
- Updates email notification preference for the authenticated user.
- Creates preference record if it doesn't exist (upsert).
- Returns: `{ success: boolean }`.
- Error responses:
  - `400`: Invalid request body, emailNotifications must be boolean
  - `401`: Unauthorized
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error

### PUT /api/voice-profile

- Auth: Required (Supabase session).
- Body: `{ tone?: string, personality_notes?: string, sign_off_style?: string, max_length?: number, words_to_use?: string[], words_to_avoid?: string[], example_responses?: string[] }`.
- Updates the voice profile for the authenticated user's organization. Creates one if it doesn't exist.
- All fields are optional; only provided fields are updated.
- Returns: `{ id: string, organization_id: string, name: string, tone: string, personality_notes: string | null, sign_off_style: string | null, max_length: number, words_to_use: string[] | null, words_to_avoid: string[] | null, example_responses: string[] | null, created_at: string }`.
- Error responses:
  - `400`: Invalid request body, validation errors
  - `401`: Unauthorized
  - `404`: User not found, organization not found
  - `500` (`DB_ERROR`): Database operation failed
  - `500` (`INTERNAL_ERROR`): Unexpected server error

### POST /api/webhooks/stripe

- Auth: Stripe signature header `stripe-signature` (verification not implemented).
- Current behavior: Returns `{ received: true }` after logging stub warning.
- Planned: verify signature, handle checkout/session + subscription lifecycle events.

## External Clients

- `lib/claude/client.ts`: Implements Claude API integration for AI response generation. Includes retry logic, timeout handling, and error management. Also used for custom tone generation via tone quiz.
- `lib/google/client.ts`: Implements Google Business Profile API integration. Handles OAuth token refresh, account/location fetching, review retrieval, and response publishing.
- `lib/stripe/client.ts`: Placeholder; would create checkout/portal sessions, read subscription status, verify webhooks.

