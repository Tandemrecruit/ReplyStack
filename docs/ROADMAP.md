# Development Roadmap

## Phase 1: MVP (Week 1-2)

**Goal:** One location, core response loop, payments working

### Week 1: Foundation

- [X] **Project setup**
  - [x] Initialize Next.js 15 with App Router
  - [x] Configure Supabase project and client
  - [x] Set up environment variables
  - [x] Configure Biome (linting and formatting)
  - [x] Set up Tailwind CSS

- [ ] **Authentication**
  - [ ] Email/password registration
  - [ ] Email/password login
  - [ ] Google OAuth sign-in
  - [ ] Password reset flow
  - [x] Protected route middleware

- [ ] **Google Business Profile integration**
  - [ ] OAuth consent screen setup
  - [ ] OAuth flow implementation
  - [ ] Fetch and store refresh token (encrypted)
  - [ ] Location listing and selection
  - [ ] Store selected location

- [ ] **Review polling and storage**
  - [ ] Review fetch from Google API
  - [ ] Store reviews in database
  - [ ] Cron job for polling (every 15 min)
  - [ ] Deduplication logic

- [ ] **AI response generation**
  - [ ] Claude API integration
  - [ ] System prompt with voice profile
  - [ ] Generate response endpoint
  - [ ] Token usage tracking

- [ ] **Basic dashboard UI**
  - [ ] Review list component
  - [ ] Rating filter
  - [ ] Status filter
  - [ ] Generate response button
  - [ ] Response preview

### Week 2: Polish & Launch

- [ ] **Response editing and publishing**
  - [ ] Edit modal component
  - [ ] Character/word count
  - [ ] Save draft functionality
  - [ ] Publish to Google API
  - [ ] Optimistic UI updates
  - [ ] Error handling and retry

- [ ] **Voice profile setup wizard**
  - [ ] Tone selection step
  - [ ] Personality notes input
  - [ ] Example responses input
  - [ ] Sign-off configuration
  - [ ] Words to use/avoid
  - [ ] Max length setting
  - [ ] Save and update profile

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

- [ ] **Landing page**
  - [ ] Hero section
  - [ ] Feature highlights
  - [ ] Pricing section
  - [ ] FAQ
  - [ ] CTA buttons

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
