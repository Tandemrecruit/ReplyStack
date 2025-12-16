# ReplyStack

**AI-powered Google review response tool for local businesses and agencies**

## The Problem

Local businesses are drowning in reviews. They know responses matter for SEO and reputation, but they either:
- Ignore them entirely
- Copy-paste generic responses that feel robotic
- Spend 30+ minutes daily writing thoughtful ones

None of these options scale, and none of them build the customer relationships that reviews should create.

## The Solution

ReplyStack makes responding to reviews effortless:

1. **Connect** your Google Business Profile
2. **Configure** your voice (tone, examples, preferences)
3. **Generate** on-brand responses with one click
4. **Publish** directly to Google

Every response sounds like you wrote it—because the AI learned your voice.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | Frontend + API routes |
| Supabase | PostgreSQL database + Auth |
| Claude API | AI response generation |
| Stripe | Subscription payments |
| Vercel | Deployment |
| Resend | Transactional email |

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (local or cloud)
- API keys for: Google OAuth, Anthropic Claude, Stripe

### 1. Clone the repository

```bash
git clone https://github.com/your-org/replystack.git
cd replystack
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your API keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth + Business Profile
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Resend
RESEND_API_KEY=your-resend-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up Supabase

**Option A: Local Development (recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Run migrations
supabase db reset
```

**Option B: Cloud Supabase**

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Copy your project URL and keys to `.env.local`

### 4. Install dependencies

```bash
npm install
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
replystack/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth pages (login, signup)
│   │   ├── (dashboard)/        # Dashboard pages
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── reviews/            # Review-related components
│   │   └── layout/             # Layout components
│   ├── lib/
│   │   ├── supabase/           # Supabase client setup
│   │   ├── anthropic.ts        # Claude AI integration
│   │   ├── stripe.ts           # Stripe integration
│   │   └── google.ts           # Google Business Profile API
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
├── docs/                       # Documentation
└── public/                     # Static assets
```

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Documentation

Full documentation is available in the [`/docs`](./docs) folder:

- [**SPEC.md**](./docs/SPEC.md) - Product specification and feature requirements
- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - Technical architecture and database schema
- [**PROMPTS.md**](./docs/PROMPTS.md) - AI prompt templates and configuration
- [**ROADMAP.md**](./docs/ROADMAP.md) - Development phases and timeline
- [**BUSINESS.md**](./docs/BUSINESS.md) - Business model and market analysis
- [**DECISIONS.md**](./docs/DECISIONS.md) - Architectural decision records

## License

Proprietary - All rights reserved
