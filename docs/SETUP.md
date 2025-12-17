# Setup & Runbook

Status: early scaffolding (auth, APIs, Google/Claude/Stripe integrations are not implemented yet). Use this to bootstrap local dev and fill env values.

## Prerequisites

- Node.js 18+
- npm (or yarn/pnpm)
- Accounts/keys: Supabase, Google Cloud (Business Profile API), Stripe, Anthropic, Resend (optional)

## Install & Env

1. Install deps:

```bash
npm install
```

1. Copy env template:

```bash
cp .env.local.example .env.local
```

1. Fill required vars:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (optional for now)
- `CRON_SECRET` (random string for cron auth)
- `NEXT_PUBLIC_APP_URL` (e.g., `http://localhost:3000`)

## Local Development

```bash
npm run dev
# visits http://localhost:3000
```

## Supabase Notes

- Use Supabase project console to configure auth (email + Google) and enable RLS.
- Regenerate types after schema changes:

```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/types.ts
```

## Cron (poll reviews)

- Endpoint: `GET /api/cron/poll-reviews`
- Protect with `Authorization: Bearer $CRON_SECRET`
- Local smoke test (returns stub response):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/poll-reviews
```

## Stripe Webhook (stubbed)

- Endpoint: `POST /api/webhooks/stripe`
- Uses `stripe-signature` header but logic is not implemented yet.
- To dry-run locally once implemented:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Testing

- Unit tests (Vitest):

```bash
npm test
```

- Lint/format:

```bash
npm run lint
npm run format
```

## Troubleshooting

- Missing env vars: Next.js route handlers will throw; check `.env.local`.
- Auth middleware: `middleware.ts` refreshes Supabase session; ensure cookies are allowed in your browser.
- Cron auth failures: verify `CRON_SECRET` matches request header.

