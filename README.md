# ReplyStack

AI-powered Google Business review response tool for local businesses. Respond to every review in 30 seconds with AI that sounds like you.

## Development Status

Core features implemented. Authentication, Google Business Profile integration, review polling, and AI response generation are complete. Dashboard UI data integration, response editing UI, and Stripe webhooks are in progress. See [Roadmap](./docs/ROADMAP.md) for detailed status.

## Tech Stack

- **Framework:** Next.js 16 with App Router (React Server Components)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth + Google OAuth
- **AI:** Claude Haiku 4.5 (claude-haiku-4-5-20251001)
- **Payments:** Stripe (subscriptions)
- **Email:** Resend
- **Styling:** Tailwind CSS v4
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Cloud Console project (for Business Profile API)
- Stripe account
- Anthropic API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/replystack.git
   cd replystack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

For detailed environment setup, troubleshooting, and local cron/webhook notes, see [Setup Guide](./docs/SETUP.md).

## Project Structure

```
ReplyStack/
├── app/
│   ├── (auth)/           # Auth routes (login, signup, callback)
│   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── dashboard/    # Main dashboard page
│   │   ├── reviews/      # Review management
│   │   ├── settings/     # Settings and voice profile
│   │   └── billing/      # Subscription management
│   ├── api/              # API routes
│   │   ├── reviews/      # Review endpoints
│   │   ├── responses/    # AI response generation
│   │   ├── webhooks/     # Stripe webhooks
│   │   └── cron/         # Scheduled jobs
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── reviews/          # Review-specific components
│   └── voice-profile/    # Voice profile components
├── lib/
│   ├── supabase/         # Supabase client utilities
│   ├── google/           # Google Business Profile API
│   ├── stripe/           # Stripe utilities
│   ├── claude/           # Claude AI integration
│   └── utils/            # General utilities
└── docs/                 # Project documentation
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Biome checks
- `npm run lint:fix` - Run Biome checks and apply fixes
- `npm run format` - Format code with Biome
- `npm run test` - Run Vitest unit tests
- `npm run test:ci` - Run tests in CI mode (no watch)
- `npm run typecheck` - Run TypeScript type checking
- `npm run supabase:types` - Generate TypeScript types from Supabase schema

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - Technical architecture and database schema
- [Specification](./docs/SPEC.md) - Product specification and user flows
- [Roadmap](./docs/ROADMAP.md) - Development roadmap and feature planning
- [Prompts](./docs/PROMPTS.md) - AI prompt templates
- [Decisions](./docs/DECISIONS.md) - Architecture decision records
- [Setup](./docs/SETUP.md) - Local development and environment runbook
- [API](./docs/API.md) - Route contracts and current state
- [Changelog](./docs/CHANGELOG.md) - Notable documentation/codebase updates

## Logs

Default log output is written to `logs/` (e.g., `logs/biome-lsp-logs`). This directory is ignored by git but remains user-owned so you can rotate or delete files as needed.

## Environment Variables

See `.env.local.example` for all required environment variables.

## License

Private - All rights reserved.
