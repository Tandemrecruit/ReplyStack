# Product Specification

## Product Vision

### Target Customers

**Primary: Local Service Businesses**
- Restaurants and cafes
- Dental and medical practices
- HVAC and home services
- Salons and spas
- Auto repair shops
- Any business with a Google Business Profile

**Secondary: Marketing Agencies**
- Digital marketing agencies managing local clients
- Reputation management consultants
- Franchise marketing teams

### Core Value Proposition

> Respond to every review in 30 seconds with AI that sounds like you.

### Positioning

ReplyStack is:
- **Simple** — Connect, configure, respond. No training required.
- **Affordable** — $29-79/month, not enterprise pricing
- **AI-native** — Built around AI from day one, not bolted on

ReplyStack is NOT:
- A bloated "reputation management suite"
- An enterprise platform with 100 features you'll never use
- A social media management tool
- A CRM with reviews tacked on

---

## User Flows

### 1. Onboarding Flow

```
Sign Up (email/password or Google)
    ↓
Connect Google Business Profile (OAuth)
    ↓
Select Location(s) to manage
    ↓
Voice Profile Wizard
    - Choose tone (friendly, professional, casual, formal)
    - Add personality notes
    - Paste example responses you like
    - Set sign-off style
    - Words to use/avoid
    - Max response length
    ↓
Dashboard (ready to respond)
```

### 2. Daily Use Flow

```
See new reviews on dashboard
    ↓
Click "Generate Response" on any review
    ↓
AI generates response using voice profile
    ↓
Edit if needed (optional)
    ↓
Click "Publish" → Response posted to Google
    ↓
Review marked as "Responded"
```

### 3. Settings Flow

```
Settings Page
    ├── Voice Profile
    │   ├── Edit tone and personality
    │   ├── Update example responses
    │   └── Modify word lists
    ├── Notifications
    │   ├── Email frequency (instant/daily/weekly)
    │   └── Which ratings to notify
    ├── Billing
    │   ├── View current plan
    │   ├── Update payment method
    │   └── View invoice history
    └── Account
        ├── Update email/password
        └── Delete account
```

---

## MVP Feature Requirements

Status note (Dec 2025): Core features are implemented. Authentication, Google Business Profile integration, review polling, AI response generation, and voice profile management are complete. Dashboard UI data integration, response editing UI, and Stripe integration are in progress.

### Authentication
- [x] Email/password registration and login
- [x] Google OAuth sign-in
- [x] Password reset flow
- [x] Session management

### Google Integration
- [x] Google Business Profile OAuth connection
- [x] Location selection (supports multiple locations)
- [x] Automatic review fetching (polling every 15 min)
- [x] Publish responses to Google

### Review Management
- [~] Review list view with newest first (API complete, UI needs data integration)
- [~] Filter by rating (1-5 stars) (API supports, UI static)
- [~] Filter by status (pending/responded/ignored) (API supports, UI static)
- [ ] Filter by date range (API does not support)
- [ ] Search reviews by text content (not implemented)
- [ ] Mark review as "ignored" (status field exists, no API/UI)

### Voice Profile
- [x] Tone selection (friendly, professional, casual, formal)
- [x] Personality notes (free text)
- [~] Example responses (3-5 samples) (API supports, UI missing)
- [x] Sign-off style (name, title, business name)
- [~] Words to use (brand terms, values) (API supports, UI missing)
- [~] Words to avoid (competitor names, sensitive terms) (API supports, UI missing)
- [x] Maximum response length (word count)

### AI Response Generation
- [x] One-click response generation
- [x] Uses voice profile for personalization
- [x] Different handling for positive vs negative reviews
- [ ] Regenerate button for alternatives (API returns existing response)

### Response Workflow
- [x] Edit response in modal before publishing
- [x] Character count display
- [ ] Preview how response will look
- [x] Publish to Google with confirmation
- [ ] Response history per review (responses table exists, no UI)

### Payments
- [ ] Stripe Checkout for subscription
- [ ] Single tier: $49/month (MVP simplicity)
- [ ] 14-day free trial
- [ ] Stripe Customer Portal for billing management

### Notifications
- [ ] Email notification for new reviews
- [ ] Configurable frequency (instant/daily digest)
- [ ] Unsubscribe option

---

## Explicitly Deferred (Phase 2+)

These features are intentionally NOT in MVP:

| Feature | Phase | Rationale |
|---------|-------|-----------|
| Multi-location management | 2 | Adds complexity, most users start with 1 |
| Team members/roles | 2 | Solo users for MVP validation |
| Analytics dashboard | 2 | Nice-to-have, not core value |
| Auto-respond feature | 2 | Users want control initially |
| Yelp integration | 3 | Focus on Google first (80% of searches) |
| Facebook integration | 3 | Lower priority than Yelp |
| Agency white-label | 3 | Enterprise feature |
| Bulk actions | 2 | Power user feature |
| Response templates | 2 | AI generation is the core feature |
| API access | 3 | Developer/agency feature |

---

## Success Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first response | < 5 minutes | From signup to published response |
| Response generation rate | > 80% | Reviews with generated responses |
| Publish rate | > 60% | Generated responses that get published |
| Trial to paid conversion | > 10% | Free trial → paid subscription |
| Monthly churn | < 5% | Paid users who cancel |
