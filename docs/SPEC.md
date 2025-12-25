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
AI generates response using voice profile (including custom tones if selected)
    ↓
Response editing modal opens with:
    - Review context (reviewer name, rating, review text)
    - Editable response textarea
    - Character and word count display
    - Cancel and Publish buttons
    ↓
Edit response if needed (optional)
    ↓
Click "Publish" → Response posted to Google
    ↓
Review marked as "Responded" and modal closes
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

Status note (Dec 2025): **MVP near complete.** Implemented: authentication; Google Business Profile integration (OAuth, location sync, tier-based review polling); AI response generation (Claude Haiku 4.5); voice profile management (tone quiz + custom tones); response editing modal; notification preferences; and dashboard UI with functional filters. Remaining: Stripe checkout/portal + webhook implementation, email sending (Resend), voice profile UI fields (example responses, words to use/avoid), and waitlist management.

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
- [x] Review list view with newest first (fully implemented: ReviewCard component, data integration, pagination)
- [x] Filter by rating (1-5 stars) (fully functional: filters reviews by rating via API)
- [x] Filter by status (pending/responded/ignored) (fully functional: filters reviews by status via API)
- [ ] Filter by date range (API does not support)
- [ ] Search reviews by text content (not implemented)
- [ ] Mark review as "ignored" (status field exists in DB, no API/UI)

### Voice Profile
- [x] Tone selection (Warm, Direct, Professional, Friendly, Casual, plus custom tones from tone quiz)
- [x] Personality notes (free text input)
- [~] Example responses (3-5 samples) (API supports `example_responses` array, UI input field not implemented)
- [x] Sign-off style (name, title, business name)
- [~] Words to use (brand terms, values) (API supports `words_to_use` array, UI input field not implemented)
- [~] Words to avoid (competitor names, sensitive terms) (API supports `words_to_avoid` array, UI input field not implemented)
- [x] Maximum response length (word count with validation: 50-500 words)
- [x] Tone quiz (10-question interactive quiz with custom tone generation)
  - Supports both single-select and multi-select questions
  - Covers communication style, review handling, response length, customer relationships, and brand personality
  - Generates personalized custom tone with AI-generated name, description, and enhanced context via Claude
  - Custom tones are saved to organization and available for selection in voice profile
  - Custom tone format: `custom:{uuid}` displayed as `{name} - {description}`

### AI Response Generation
- [x] One-click response generation via generate response button
- [x] Uses voice profile for personalization (tone, personality notes, sign-off, max length, custom tones)
- [x] Different handling for positive vs negative reviews (via prompt engineering)
- [x] Voice profile resolution: location-specific → organization → default fallback
- [ ] Regenerate button for alternatives (API returns existing response instead of regenerating)

### Response Workflow
- [x] Edit response in modal before publishing (ResponseEditModal with review context and accessibility)
  - Modal displays reviewer name, rating (with star visualization), and review text
  - Editable textarea with real-time character and word count display
  - Accessibility features: proper ARIA labels, keyboard navigation (ESC to close), focus management
  - Error handling with user-friendly error messages (401 auth, 403 permission, 502 API errors)
  - Disables form controls during publish operation (loading states)
- [x] Character and word count display (updates in real-time as user types)
- [ ] Preview how response will look (not implemented)
- [x] Publish to Google with atomic upsert (prevents race conditions)
  - Preserves AI-generated text when editing existing responses (`generated_text` never overwritten)
  - Handles both direct publishes (no AI generation) and AI-generated responses
  - `generated_text`: Original AI output (nullable, null for direct publishes)
  - `edited_text`: User edits (only set if modified from `generated_text`)
  - `final_text`: Published content (always set)
- [ ] Response history per review (responses table exists, no UI for viewing history)

### Payments
- [ ] Stripe Checkout for subscription
- [ ] Single tier: $49/month (MVP simplicity)
- [ ] 14-day free trial
- [ ] Stripe Customer Portal for billing management

### Notifications
- [x] Notification preferences API (GET/PUT /api/notifications)
- [x] Notification preferences UI in settings page
- [ ] Email notification sending for new reviews (Resend integration pending)
- [ ] Configurable frequency (instant/daily digest) (preferences stored, sending not implemented)
- [ ] Unsubscribe option (part of email template, not yet implemented)

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
