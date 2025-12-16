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

```bash
# Clone the repository
git clone https://github.com/your-org/replystack.git
cd replystack

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

> **Note:** Full setup instructions coming soon. See documentation for API key requirements.

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
