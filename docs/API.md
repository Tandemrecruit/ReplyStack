# API Overview

Status: All handlers are scaffolds; responses are placeholders. Auth flows and external integrations are not implemented yet.

## Auth Model

- Supabase auth; middleware refreshes sessions for all non-static routes.
- Protected routes return `401` when no Supabase user session is found.
- Cron endpoint uses `Authorization: Bearer $CRON_SECRET`.

## Routes

### GET /api/reviews
- Auth: Required (Supabase session).
- Query: `status?`, `rating?` (not yet applied).
- Current behavior: Returns empty list payload `{ reviews: [], total: 0, page: 1, limit: 20 }` and logs a warning.

### POST /api/responses
- Auth: Required.
- Body: `{ reviewId: string }`.
- Current behavior: Returns placeholder draft response and logs "not implemented".
- Planned: fetch review + voice profile, build prompt, call Claude, store response.

### GET /api/cron/poll-reviews
- Auth: `Authorization: Bearer $CRON_SECRET`.
- Current behavior: Returns stub JSON noting not implemented.
- Planned: iterate active locations, fetch new reviews from Google, store, notify.

### POST /api/webhooks/stripe
- Auth: Stripe signature header `stripe-signature` (verification not implemented).
- Current behavior: Returns `{ received: true }` after logging stub warning.
- Planned: verify signature, handle checkout/session + subscription lifecycle events.

## External Clients (stubs)

- `lib/claude/client.ts`: placeholder; would call Anthropic.
- `lib/google/client.ts`: placeholder; would refresh tokens, list accounts/locations, fetch reviews, publish replies.
- `lib/stripe/client.ts`: placeholder; would create checkout/portal sessions, read subscription status, verify webhooks.

