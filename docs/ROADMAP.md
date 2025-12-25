# Development Roadmap

## Phase 1: MVP (Week 1-2)

### Current Status (Dec 2025)

**Completed:**
- Project scaffolding and infrastructure setup (Next.js 16, React 19, Tailwind v4, TypeScript, Vitest, Biome)
- Authentication (email/password, Google OAuth, password reset, email verification)
- Google Business Profile integration (OAuth, location selection, token encryption with AES-256-GCM)
- Review polling and storage (tier-based cron job every 5 min, processes starter/growth/agency tiers at 15/10/5 min intervals)
- Voice profile API (tone, personality notes, sign-off, max length, custom tones, example responses, words to use/avoid)
- Voice profile UI (VoiceEditor component with tone selection, personality notes, sign-off, max length, custom tone quiz integration)
- AI response generation (Claude Haiku 4.5 integration with retry logic, timeout handling, token tracking)
- Custom tones (10-question tone quiz with AI-generated custom tone names/descriptions)
- Dashboard data integration (reviews page with functional rating/status filters, generate response button, review cards)
- Response editing UI (ResponseEditModal with review context, character/word count, accessibility features)
- Response publishing (atomic upsert to Google Business Profile, preserves generated text)
- Notification preferences API and UI (GET/PUT /api/notifications, settings page integration)
- Location management API (GET/POST /api/locations with sync status)
- Landing page (hero, features, pricing, FAQ sections)

**Remaining:**
- Voice profile UI fields (example responses input, words to use/avoid input — API supports these fields, UI missing)
- Stripe integration (checkout session creation, customer portal links, webhook implementation)
- Email notifications (Resend integration for new review alerts, welcome emails, trial ending reminders)
- Regenerate response button (API currently returns existing response instead of regenerating)
- Optimistic UI updates for publish operations
- Review management features (ignore status API/UI, search, date range filter)
- Waitlist management (database table, signup form, admin interface, invite functionality)
- Initial bulk import of 200 reviews when location is first connected

**Goal:** One location, core response loop, payments working

### Week 1: Foundation

- [X] **Project setup**
  - [x] Initialize Next.js 16 with App Router
  - [x] Configure Supabase project and client
  - [x] Set up environment variables
  - [x] Configure Biome (linting and formatting)
  - [x] Set up Tailwind CSS

- [X] **Authentication**
  - [x] Email/password registration
  - [x] Email/password login
  - [x] Google OAuth sign-in
  - [x] Password reset flow
  - [x] Protected route middleware
  - [x] Email verification enforcement

- [~] **Google Business Profile integration**
  - [x] OAuth consent screen setup
  - [x] OAuth flow implementation
  - [x] Fetch and store refresh token (encrypted)
  - [x] Location listing and selection
  - [x] Store selected location
  - [ ] Initial bulk import of 200 reviews when location is first connected **(blocked: depends on location connection trigger/hook to detect first-time connections and initiate bulk import)**

- [X] **Review polling and storage**
  - [x] Review fetch from Google API (tier-based: starter 15min, growth 10min, agency 5min)
  - [x] Store reviews in database with deduplication by `external_review_id`
  - [x] Cron job for polling (Vercel cron every 5 min, tier-based processing with time-window tolerance)
  - [x] Deduplication logic (cron_poll_state table tracks last_processed_at per tier)

- [X] **AI response generation**
  - [x] Claude API integration (Haiku 4.5 with retry logic, exponential backoff, 30s timeout)
  - [x] System prompt with voice profile (tone, personality, sign-off, max length, words to use/avoid, custom tones)
  - [x] Generate response endpoint (POST /api/responses with voice profile resolution: location → org → default)
  - [x] Token usage tracking (input + output tokens stored in responses table)

- [X] **Basic dashboard UI**
  - [x] Review list component (ReviewCard component with full data integration)
  - [x] Rating filter (fully functional via ReviewsFilters component, filters reviews by rating 1-5)
  - [x] Status filter (fully functional via ReviewsFilters component, filters by pending/responded/ignored)
  - [x] Generate response button (GenerateResponseButton component, fully functional, calls POST /api/responses)
  - [ ] Response preview (not yet implemented)

- [ ] **Review management features**
  - [ ] Mark review as "ignored" (status field exists in reviews table, but no API endpoint or UI)
  - [ ] Search reviews by text content (not implemented)
  - [ ] Filter by date range (API does not support, needs query parameter and database filtering)

### Week 2: Polish & Launch

- [X] **Response editing and publishing**
  - [x] Edit modal component (ResponseEditModal with review context, reviewer name, rating stars, review text)
  - [x] Character/word count (displayed in modal footer, updates in real-time)
  - [x] Save draft functionality (responses saved as drafts when generated via POST /api/responses)
  - [x] Publish to Google API (POST /api/reviews/[reviewId]/publish with atomic upsert, preserves generated_text)
  - [ ] Regenerate response button (API returns existing response instead of regenerating)
  - [ ] Optimistic UI updates (not implemented, manual refresh required after publish)
  - [x] Error handling and retry (error handling with user-friendly messages, retry logic in Claude client)

- [~] **Voice profile setup**
  - [x] Tone selection step (5 standard options: Warm, Direct, Professional, Friendly, Casual)
  - [x] Custom tone generation via 10-question tone quiz (ToneQuiz component, POST /api/tone-quiz/generate)
  - [x] Personality notes input (free text field in VoiceEditor)
  - [ ] Example responses input (API supports `example_responses` array, UI field not implemented in VoiceEditor)
  - [x] Sign-off configuration (name/title/business in VoiceEditor)
  - [ ] Words to use/avoid (API supports `words_to_use` and `words_to_avoid` arrays, UI fields not implemented in VoiceEditor)
  - [x] Max length setting (with validation, 50-500 words, slider + number input in VoiceEditor)
  - [x] Save and update profile (PUT /api/voice-profile API and VoiceEditor UI fully implemented)
  - [x] 10-question tone quiz (helps users choose between standard tones or generate custom tone via Claude AI)

- [~] **Stripe integration**
  - [ ] Products and prices in Stripe Dashboard (not configured)
  - [ ] Checkout session creation (no API endpoint for creating checkout sessions)
  - [~] Webhook handler (stub exists at POST /api/webhooks/stripe, signature verification not implemented)
  - [ ] Customer portal link (no API endpoint for creating portal sessions)
  - [ ] Trial logic (14 days) (not implemented)
  - [ ] Subscription status checks (not implemented)

- [~] **Email notifications**
  - [x] Resend API integration setup (RESEND_API_KEY and RESEND_FROM_EMAIL env vars configured)
  - [ ] New review notification email template and sending (Resend integration not implemented)
  - [ ] Welcome email (not implemented)
  - [x] Notification preferences (GET/PUT /api/notifications API and settings UI fully implemented)
  - [x] Email opt-in/opt-out toggle (part of notification preferences, stored in notification_preferences table)

- [~] **Account management**
  - [x] Update password (update-password-form component exists at app/(auth)/update-password/page.tsx)
  - [ ] Update email in settings (not implemented)
  - [ ] Delete account functionality (GDPR requirement, not implemented)

- [ ] **Onboarding & UX**
  - [ ] Voice Profile Wizard (guided multi-step onboarding)
  - [ ] First response tutorial/guidance
  - [ ] Success metrics tracking (time to first response)

- [ ] **Infrastructure & monitoring**
  - [ ] Basic error tracking (Sentry integration not configured)
  - [~] Rate limiting (Claude client has retry logic and error handling for 429 errors, but no per-user rate limits implemented)
  - [ ] Google API rate limit monitoring (not implemented)

- [X] **Landing page**
  - [x] Hero section
  - [x] Feature highlights
  - [x] Pricing section
  - [x] FAQ (pricing-faq page exists)
  - [x] CTA buttons

- [~] **Waitlist management**
  - [x] Waitlist database table (email, review_volume, created_at) with RLS for anonymous inserts
  - [x] Waitlist signup form on landing page (WaitlistForm component with validation)
  - [x] API endpoint for waitlist signups (POST /api/waitlist with email enumeration protection)
  - [ ] Admin interface to view/manage waitlist (not implemented)
  - [ ] Invite functionality (send signup link to waitlist users) (not implemented)
  - [ ] Email integration for waitlist invites (Resend) (not implemented)

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
  - [ ] Trial ending reminders (email notifications)

- [ ] **Response history & quality**
  - [ ] Response history view per review (responses table exists but no UI)
  - [ ] View previous generated responses

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
- [ ] Error tracking (Sentry) - moved to Phase 1 infrastructure
- [ ] Analytics (Posthog or similar)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] GDPR compliance
  - [ ] Cookie consent banner
  - [ ] Data retention policies
  - [ ] User data deletion (right to be forgotten)
  - [ ] Privacy policy implementation
- [ ] Load testing
- [ ] Backup & recovery
  - [ ] Automated database backups
  - [ ] Data export functionality
  - [ ] Disaster recovery plan

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
