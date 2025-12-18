# Development Roadmap

## Phase 1: MVP (Week 1-2)

**Current Status (Dec 2025):** Project scaffolding, authentication, Google Business Profile integration, review polling, voice profile API, and landing page are complete. Remaining: AI response generation, dashboard data integration, response editing UI, Stripe, and email notifications.

**Goal:** One location, core response loop, payments working

### Week 1: Foundation

- [X] **Project setup**
  - [x] Initialize Next.js 16 with App Router
  - [x] Configure Supabase project and client
  - [x] Set up environment variables
  - [x] Configure Biome (linting and formatting)
  - [x] Set up Tailwind CSS

- [x] **Authentication**
  - [x] Email/password registration
  - [x] Email/password login
  - [x] Google OAuth sign-in
  - [x] Password reset flow
  - [x] Protected route middleware
  - [x] Email verification enforcement

- [X] **Google Business Profile integration**
  - [x] OAuth consent screen setup
  - [x] OAuth flow implementation
  - [x] Fetch and store refresh token (encrypted)
  - [x] Location listing and selection
  - [x] Store selected location

- [X] **Review polling and storage**
  - [x] Review fetch from Google API
  - [x] Store reviews in database
  - [x] Cron job for polling (every 15 min)
  - [x] Deduplication logic

- [ ] **AI response generation**
  - [ ] Claude API integration
  - [ ] System prompt with voice profile
  - [ ] Generate response endpoint
  - [ ] Token usage tracking

- [~] **Basic dashboard UI**
  - [x] Review list component (ReviewCard component exists)
  - [x] Rating filter (UI exists, needs data integration)
  - [x] Status filter (UI exists, needs data integration)
  - [x] Generate response button (component exists, needs AI integration)
  - [ ] Response preview (not yet implemented)

### Week 2: Polish & Launch

- [~] **Response editing and publishing**
  - [ ] Edit modal component
  - [ ] Character/word count
  - [ ] Save draft functionality
  - [x] Publish to Google API (endpoint implemented)
  - [ ] Optimistic UI updates
  - [ ] Error handling and retry

- [~] **Voice profile setup**
  - [x] Tone selection step
  - [x] Personality notes input
  - [ ] Example responses input (API supports, UI missing)
  - [x] Sign-off configuration
  - [ ] Words to use/avoid (API supports, UI missing)
  - [~] Max length setting (exists in VoiceEditor component, missing from settings page)
  - [x] Save and update profile (API fully implemented, UI partially implemented)

- [ ] **Stripe integration**
  - [ ] Products and prices in Stripe Dashboard
  - [ ] Checkout session creation
  - [ ] Webhook handler
  - [ ] Customer portal link
  - [ ] Trial logic (14 days)
  - [ ] Subscription status checks

- [ ] **Email notifications**
  - [ ] Resend integration
  - [ ] New review notification
  - [ ] Welcome email
  - [ ] Notification preferences

- [X] **Landing page**
  - [x] Hero section
  - [x] Feature highlights
  - [x] Pricing section
  - [x] FAQ (pricing-faq page exists)
  - [x] CTA buttons

- [ ] **Soft launch**
  - [ ] Deploy to production
  - [ ] Invite waitlist users
  - [ ] Monitor for issues
  - [ ] Collect initial feedback

---

## Phase 2: Scale & Sticky (Week 3-4)

**Goal:** Multi-location, team features, make product stickier

- [ ] **Multi-location support**
  - [ ] Location switcher UI
  - [ ] Per-location voice profiles
  - [ ] Aggregate dashboard view
  - [ ] Location-specific notifications

- [ ] **Team invites**
  - [ ] Invite by email
  - [ ] Role definitions (owner, manager, viewer)
  - [ ] Permission checks
  - [ ] Team management UI

- [ ] **Response templates library**
  - [ ] Pre-built templates by industry
  - [ ] Custom template creation
  - [ ] Template management UI
  - [ ] Quick-select from templates

- [ ] **Bulk actions**
  - [ ] Select multiple reviews
  - [ ] Bulk generate responses
  - [ ] Bulk mark as ignored
  - [ ] Bulk publish

- [ ] **Analytics dashboard**
  - [ ] Response rate over time
  - [ ] Average response time
  - [ ] Rating distribution
  - [ ] Review volume trends

- [ ] **Tiered pricing**
  - [ ] Starter: $29/month (1 location, 50 responses)
  - [ ] Growth: $79/month (3 locations, unlimited)
  - [ ] Agency: $199/month (10 locations, team features)
  - [ ] Plan upgrade/downgrade flow

- [ ] **Auto-respond toggle**
  - [ ] Enable for 4-5 star reviews only
  - [ ] Delay setting (publish after X hours)
  - [ ] Notification before auto-publish
  - [ ] Easy override/edit

---

## Phase 3: Platform (Month 2+)

**Goal:** Multi-platform, agency features, ecosystem

- [ ] **Yelp integration**
  - [ ] Yelp API access (business verification)
  - [ ] Review fetching
  - [ ] Response publishing
  - [ ] Unified review dashboard

- [ ] **Facebook integration**
  - [ ] Facebook Page OAuth
  - [ ] Recommendations/reviews fetch
  - [ ] Response publishing

- [ ] **Agency dashboard**
  - [ ] Multi-client management
  - [ ] Client switching UI
  - [ ] Per-client reporting
  - [ ] Client billing management

- [ ] **White-label option**
  - [ ] Custom domain support
  - [ ] Branding customization
  - [ ] Remove ReplyStack branding
  - [ ] Agency-specific pricing

- [ ] **API access**
  - [ ] API key management
  - [ ] REST API endpoints
  - [ ] API documentation
  - [ ] Usage tracking and limits

- [ ] **Zapier integration**
  - [ ] Triggers: New review, response published
  - [ ] Actions: Generate response, update status
  - [ ] Zapier app submission

---

## Anti-Features (Won't Build)

These are explicitly out of scope to maintain focus:

| Feature | Why We Won't Build It |
|---------|----------------------|
| **Full CRM** | Scope creep—completely different product. Users have CRMs already. |
| **Email/SMS marketing campaigns** | Different problem, different market. Many good solutions exist. |
| **Survey tools** | Tangential to review response. Would dilute the product. |
| **Social media management** | Huge market with established players. Stay in our lane. |
| **Website review widgets** | Maybe Phase 4, but not core to the response workflow. |
| **Review generation/solicitation** | Legal gray area, doesn't fit "response" positioning. |
| **Competitor monitoring** | Interesting but different product entirely. |
| **AI review summarization** | Nice-to-have but not core value prop. |

---

## Technical Debt Budget

Reserve 20% of each phase for:
- Bug fixes from previous phase
- Performance improvements
- Security updates
- Dependency updates
- Code refactoring

---

## Launch Checklist

### Pre-Launch
- [ ] Error tracking (Sentry)
- [ ] Analytics (Posthog or similar)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] GDPR compliance check
- [ ] Load testing
- [ ] Backup strategy verified

### Launch Day
- [ ] Monitor error rates
- [ ] Monitor API latencies
- [ ] Monitor Stripe webhooks
- [ ] Customer support ready
- [ ] Social media announcement
- [ ] Email to waitlist

### Post-Launch (Week 1)
- [ ] Daily check-ins on metrics
- [ ] Respond to all user feedback
- [ ] Fix critical bugs same-day
- [ ] Document common issues
- [ ] Plan Phase 2 based on feedback
