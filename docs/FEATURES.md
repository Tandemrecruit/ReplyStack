# Feature Documentation

This document provides detailed documentation for key features in ReplyStack.

## Tone Quiz

### Overview

The Tone Quiz is an interactive 10-question quiz that helps users discover their ideal communication
tone and generates personalized custom tones using AI.

### User Flow

1. User clicks "Take Tone Quiz" button in Settings → Voice Profile section
2. Modal opens with first question
3. User answers 10 questions (mix of single-select and multi-select)
4. Progress bar shows completion (e.g., "3 of 10")
5. After final question, quiz generates custom tone using Claude AI
6. Results screen displays generated tone name and description
7. User can:
   - Apply the tone (sets it as selected tone in voice profile)
   - Skip (closes modal without applying)
   - Retake quiz (starts over)

### Technical Details

**Component:** `components/voice-profile/tone-quiz.tsx`

**API Endpoint:** `POST /api/tone-quiz/generate`

**Questions:**
- 10 questions covering:
  - Communication style preferences
  - Review handling approach
  - Response length preferences
  - Customer relationship style
  - Brand personality

**Question Types:**
- Single-select: User picks one answer
- Multi-select: User can select multiple answers ("Select all that apply")

**Custom Tone Generation:**
- Quiz answers are sent to Claude AI
- AI generates:
  - `name`: Short, descriptive tone name (e.g., "Warm & Personal")
  - `description`: Detailed description of the tone
  - `enhancedContext`: Additional context used in AI prompts for response generation
- Custom tone is saved to `custom_tones` table
- Tone ID format: `custom:{uuid}`

**Validation:**
- All questions must have at least one answer selected
- Answers are validated against question structure
- Duplicate question IDs are rejected

**Error Handling:**
- Network errors display user-friendly messages
- Invalid responses show validation errors
- Failed generation allows retry

### Database Schema

```sql
CREATE TABLE custom_tones (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    enhanced_context TEXT,
    quiz_responses JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Integration

- Custom tones appear in tone selector dropdowns (Settings and Voice Editor)
- Displayed in "Custom Tones" section, separate from standard tones
- Format: `{name} - {description}`
- When selected, tone value is `custom:{id}`
- Enhanced context is included in AI prompts when generating responses

---

## Response Editing Modal

### Overview

The Response Editing Modal allows users to review, edit, and publish AI-generated responses to
Google Business Profile reviews.

### User Flow

1. User clicks "Generate Response" on a review card
2. AI generates response using voice profile
3. Modal opens automatically with generated response
4. User can:
   - Edit the response text
   - See real-time character and word count
   - View review context (reviewer name, rating, review text)
   - Publish directly to Google
   - Cancel and close modal

### Technical Details

**Component:** `components/reviews/response-edit-modal.tsx`

**API Endpoint:** `POST /api/reviews/[reviewId]/publish`

**Features:**

**Review Context Display:**
- Reviewer name (or "Anonymous" if not available)
- Star rating visualization (1-5 stars)
- Review text (truncated with line-clamp if long)

**Editing:**
- Full-featured textarea
- Real-time character count
- Real-time word count (excludes empty strings)
- Disabled during publish operation

**Publishing:**
- Validates response is not empty (trimmed)
- Sends to Google Business Profile API
- Updates database atomically (prevents race conditions)
- Preserves AI-generated text when editing existing responses
- Updates review status to "responded"
- Closes modal on success
- Refreshes page data

**Error Handling:**
- Displays error messages in alert banner
- Network errors show user-friendly messages
- API errors show specific error details
- Modal remains open on error (doesn't close)
- User edits are preserved after errors

**Accessibility:**
- Uses native `<dialog>` element
- Proper ARIA labels and roles
- Keyboard navigation (ESC to close, Tab to navigate)
- Focus management (focuses textarea on open, restores focus on close)
- Screen reader support

**State Management:**
- Syncs with `initialText` prop changes
- Clears errors when modal reopens with new text
- Tracks publishing state to disable controls

### Database Integration

**Response Storage:**
- `edited_text` is set only when the user modifies the generated text; it is NULL when unchanged
- `final_text` always contains the text that was actually published (may be the generated text, the edited text, or null for direct publishes with no AI)
- If response exists: preserves `generated_text`, stores edits in `edited_text` (only if modified)
- If no existing response: creates new with `generated_text` and `final_text`
- Direct publishes (no AI): `generated_text` is null
- Atomic upsert prevents duplicate responses

**Review Updates:**
- Sets `has_response = true`
- Sets `status = 'responded'`
- Updates `published_at` timestamp

### API Response Format

**Success:**
```json
{
  "success": true,
  "message": "Response published successfully",
  "response_id": "uuid",
  "published_at": "2025-01-01T00:00:00Z"
}
```

**Error:**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optional
}
```

**Error Codes:**
- `400`: Missing or empty response_text, Google account not connected
- `401`: Unauthorized, Google authentication expired
- `403`: Google API permission denied
- `404`: User/review not found
- `500` (`INTERNAL_ERROR`): Unexpected server error (retry may help)
- `500` (`DB_ERROR`): Database operation failed (retry may help)
- `502` (`GOOGLE_API_ERROR`): Google Business Profile API unreachable or returned error (retry after delay)

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "INTERNAL_ERROR" | "DB_ERROR" | "GOOGLE_API_ERROR"
}
```

**Client Retry Guidance:**
- `500` codes: Transient failures; retry with exponential backoff (max 3 attempts)
- `502`: External API issue; retry after 5-10 seconds
- `400`, `401`, `403`, `404`: User-actionable errors; do not retry automatically

---

## Custom Tones

### Overview

Custom tones are AI-generated personalized communication styles created through the Tone Quiz.
They extend the standard tone options (Warm, Direct, Professional, Friendly, Casual) with
organization-specific tones.

### Features

- **Generation:** Created via Tone Quiz using Claude AI
- **Storage:** Saved per organization in `custom_tones` table
- **Selection:** Available in tone selectors alongside standard tones
- **Usage:** Enhanced context is included in AI prompts for response generation
- **Management:** Listed in Settings and Voice Editor components

### API Endpoints

**GET /api/custom-tones**
- Returns all custom tones for user's organization
- Sorted by creation date (newest first)
- Returns camelCase format (normalized from database)

**POST /api/tone-quiz/generate**
- Creates new custom tone from quiz answers
- Validates quiz structure
- Generates tone using Claude AI
- Saves to database
- Returns created tone

### Display Format

In tone selectors, custom tones appear as:
```
{name} - {description}
```

Example:
```
Warm & Personal - A friendly, approachable tone that emphasizes personal connection and gratitude
```

### Tone Value Format

When a custom tone is selected, the tone value stored is:
```
custom:{uuid}
```

Example:
```
custom:123e4567-e89b-12d3-a456-426614174000
```

This format allows the system to:
- Distinguish custom tones from standard tones
- Validate tone values (UUID format check)
- Look up custom tone details when generating responses

---

## Notification Preferences

### Overview

Users can control email notification preferences for new reviews and other events.

### Features

- **Toggle:** Enable/disable email notifications
- **Persistence:** Saved per user in `notification_preferences` table
- **Default:** Email notifications enabled by default
- **UI:** Toggle switch in Settings → Notifications section

### API Endpoints

**GET /api/notifications**
- Returns current email notification preference
- Defaults to `true` if no preference set

**PUT /api/notifications**
- Updates email notification preference
- Body: `{ emailNotifications: boolean }`
- Uses upsert (creates if doesn't exist)

### Database Schema

```sql
CREATE TABLE notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    email_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Future Enhancements

- Email frequency options (instant, daily digest, weekly)
- Notification types (new reviews, response published, etc.)
- Per-location notification settings

---

## Location Management

### Overview

Users can connect and manage Google Business Profile locations for review monitoring and response
publishing.

### Features

- **Discovery:** Fetches all locations from connected Google accounts
- **Selection:** Users select which locations to sync
- **Sync Status:** Shows which locations are already synced
- **Organization:** Locations are associated with user's organization

### API Endpoints

**GET /api/locations**
- Fetches all locations from user's Google accounts
- Returns locations with sync status
- Handles multiple Google accounts
- Shows account name for each location

**POST /api/locations**
- Saves selected locations to database
- Creates organization if user doesn't have one
- Associates locations with organization
- Returns saved location records

### Location Data Structure

```typescript
interface LocationWithStatus {
  id?: string; // Database ID if synced
  google_account_id: string;
  google_location_id: string;
  name: string;
  address: string;
  account_name: string;
  is_synced: boolean;
}
```

### Integration

- Locations are used for review polling
- Reviews are associated with locations
- Voice profiles can be location-specific (future feature)
- Response publishing uses location's Google account

---

## Voice Profile Management

### Overview

Voice profiles define how AI-generated responses should sound, including tone, personality, and
style preferences.

### Features

- **Tone Selection:** Standard tones (Warm, Direct, Professional, Friendly, Casual) or custom tones
- **Personality Notes:** Free-text description of business personality
- **Sign-off Style:** Custom sign-off format (e.g., "— John, Owner")
- **Max Length:** Maximum response length in words (50-500)
- **Example Responses:** Sample responses to guide AI (API supports, UI pending)
- **Words to Use/Avoid:** Brand terms and sensitive words (API supports, UI pending)

### API Endpoint

**PUT /api/voice-profile**
- Updates voice profile for user's organization
- Creates profile if doesn't exist
- All fields optional (partial updates supported)
- Validates input (max_length range, etc.)

### Voice Profile Resolution

When generating responses, voice profile is resolved in this order:
1. Location-specific voice profile (if exists)
2. Organization-level voice profile
3. Default voice profile (system default)

When no profile exists at location, organization, or system tiers, the following system defaults are applied to ensure all required fields have values:

| Field | Default Value |
|-------|---------------|
| `tone` | `"warm"` |
| `personality_notes` | `"Professional and friendly"` |
| `sign_off_style` | `"The Team"` |
| `max_length` | `150` |
| `words_to_avoid` | `["sorry for any inconvenience", "valued customer"]` |
| `words_to_use` | `null` (no specific words required) |
| `example_responses` | `null` (no examples provided) |

All core fields (`tone`, `personality_notes`, `sign_off_style`, `max_length`, `words_to_avoid`) are guaranteed to have values; only optional enhancement fields (`words_to_use`, `example_responses`) may be null.

### Custom Tone Integration

- Custom tones can be selected as the tone
- Enhanced context from custom tones is included in AI prompts
- Custom tones are organization-specific

---

## Review Polling

### Overview

Automated background job that polls Google Business Profile API for new reviews and updates existing
reviews.

### Features

- **Scheduling:** Runs every 15 minutes via Vercel Cron
- **Tier-based Processing:** Different schedules for different plan tiers
  - Starter: Every 15 minutes
  - Growth: Every 10 minutes (when minute is divisible by 10)
  - Agency: Every 5 minutes (when minute is divisible by 5)
- **Deduplication:** Prevents duplicate reviews using `external_review_id`
- **Updates:** Updates existing reviews if they've changed on Google
- **Error Handling:** Continues processing other locations if one fails

### API Endpoint

**GET /api/cron/poll-reviews**
- Auth: `Authorization: Bearer $CRON_SECRET`
- Processes all active locations
- Returns processing statistics

### Database State Tracking

Uses `cron_poll_state` table to track last processed timestamp per tier:
- Prevents duplicate runs
- Handles cron timing variations
- Atomic updates prevent race conditions

### Error Handling

- Logs errors per location
- Continues processing remaining locations
- Returns error summary in response
- Does not fail entire job if individual locations fail

---

## Response Generation

### Overview

AI-powered response generation using Claude AI, personalized with voice profile settings.

### Features

- **One-Click Generation:** Single button click generates response
- **Voice Profile Integration:** Uses tone, personality notes, custom tone context
- **Review Context:** Considers review rating, text, and sentiment
- **Token Tracking:** Tracks token usage for cost monitoring
- **Error Handling:** Retries on transient failures, handles rate limits

### API Endpoint

**POST /api/responses**
- Body: `{ reviewId: string }`
- Generates response using Claude AI
- Returns existing response if one already exists (does not regenerate)
- Returns: `{ id, reviewId, generatedText, status: "draft", tokensUsed }`

### Voice Profile Resolution

1. Check if review's location has voice profile
2. If not, use organization's voice profile
3. If not, use system default

### Custom Tone Support

- If tone starts with `custom:`, looks up custom tone by ID
- Includes `enhancedContext` in AI prompt when custom tone is found
- **Fallback behavior when custom tone is not found:**
  - `enhancedContext` is omitted from the AI prompt (passed as `undefined`)
  - No warning or error is logged to the user
  - Response generation continues using the base tone value without enhancement

### Error Handling

- `400`: Missing reviewId, no organization, review has no text
- `404`: User/review not found
- `429` (`RATE_LIMITED`): Claude API rate limit exceeded (retry after delay from response headers)
- `500` (`INTERNAL_ERROR`): Unexpected server error (retry may help)
- `500` (`DB_ERROR`): Database operation failed (retry may help)
- `502` (`AI_SERVICE_ERROR`): Claude API unreachable or returned error (retry after delay)
- `504` (`AI_TIMEOUT`): Response generation timed out (retry with same request)

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "INTERNAL_ERROR" | "DB_ERROR" | "RATE_LIMITED" | "AI_SERVICE_ERROR" | "AI_TIMEOUT"
}
```

**Client Retry Guidance:**
- `500` codes: Transient failures; retry with exponential backoff (max 3 attempts)
- `502`, `504`: External AI service issue; retry after 5-10 seconds
- `429`: Rate limited; wait for duration specified in `Retry-After` header or default 60 seconds
- `400`, `404`: User-actionable errors; do not retry automatically

---

## Waitlist Signup

### Overview

Pre-launch waitlist signup allows users to register their interest before the product launches. The waitlist
is implemented as a public API endpoint with email enumeration protection.

### Features

- **Public API:** No authentication required (uses Supabase RLS with anonymous INSERT)
- **Email Validation:** Both client-side and server-side email format validation
- **Review Volume:** Collects estimated monthly Google review volume for prioritization
- **Duplicate Protection:** Silently succeeds on duplicate emails to prevent email enumeration attacks
- **Case-Insensitive:** Emails are normalized to lowercase before storage

### User Flow

1. User visits landing page and scrolls to waitlist section
2. User enters email address
3. User selects monthly review volume (Less than 10, 10-50, 50-100, 100+)
4. User clicks "Join the Waitlist"
5. On success, form is replaced with confirmation message

### API Endpoint

**POST /api/waitlist**
- Body: `{ email: string, review_volume: string }`
- Returns: `{ success: true }` on success (including duplicates)
- Review volume options: `less_than_10`, `10_to_50`, `50_to_100`, `100_plus`

### Database Schema

```sql
CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    review_volume TEXT NOT NULL CHECK (
        review_volume IN ('less_than_10', '10_to_50', '50_to_100', '100_plus')
    ),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Case-insensitive unique index
CREATE UNIQUE INDEX waitlist_email_lower_idx ON waitlist (LOWER(email));

-- RLS: Allow anonymous inserts only
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous waitlist signups"
    ON waitlist FOR INSERT TO anon WITH CHECK (true);
```

### Security Considerations

- **Email Enumeration Protection:** Returns success even for duplicate emails
- **RLS INSERT-only:** Anonymous users can only INSERT, not SELECT/UPDATE/DELETE
- **Admin Access:** Requires service role key to view waitlist entries
- **Input Validation:** Both API and database validate email format and review volume values

See ADR-032 for the full architectural decision on public API endpoints with anonymous RLS.

---

## Response Publishing

### Overview

Publishes edited or generated responses to Google Business Profile as replies to reviews.

### Features

- **Google Integration:** Publishes directly to Google Business Profile API
- **Atomic Updates:** Database upsert prevents race conditions
- **Response Preservation:** Preserves AI-generated text when editing
- **Status Updates:** Updates review status and response records
- **Error Recovery:** Handles partial failures (Google success but DB failure)

### API Endpoint

**POST /api/reviews/[reviewId]/publish**
- Body: `{ response_text: string }`
- Publishes to Google Business Profile
- Updates database atomically
- Returns success with response ID and timestamp

### Database Updates

1. Updates `reviews` table:
   - `has_response = true`
   - `status = 'responded'`

2. Upserts `responses` table:
   - `edited_text` is set only when the user modifies the generated text; it is NULL when unchanged
   - `final_text` always contains the text that was actually published (may be the generated text, the edited text, or null for direct publishes with no AI)
   - If exists: preserves `generated_text`, stores edits in `edited_text` (only if modified)
   - If new: creates with `generated_text` and `final_text`
   - Sets `status = 'published'`
   - Sets `published_at` timestamp

### Race Condition Prevention

- UNIQUE constraint on `responses.review_id`
- Atomic upsert using database function `upsert_response`
- ON CONFLICT handling at database level
- Ensures one response per review

### Error Handling

- `400`: Missing/empty response_text, Google account not connected
- `401`: Unauthorized, Google auth expired (requires reconnection)
- `403` (`GOOGLE_PERMISSION_DENIED`): Google API permission denied (user must re-authorize)
- `404`: User/review not found
- `500` (`INTERNAL_ERROR`): Unexpected server error (retry may help)
- `500` (`DB_ERROR`): Database operation failed (retry may help)
- `502` (`GOOGLE_API_ERROR`): Google Business Profile API unreachable or returned error (retry after delay)
- Returns `200` with warning if Google succeeds but DB fails (partial success)

**Error Response Format:**
```json
{
  "error": "Error message",
  "code": "INTERNAL_ERROR" | "DB_ERROR" | "GOOGLE_API_ERROR" | "GOOGLE_PERMISSION_DENIED"
}
```

**Client Retry Guidance:**
- `500` codes: Transient failures; retry with exponential backoff (max 3 attempts)
- `502`: External API issue; retry after 5-10 seconds
- `401`, `403`: Authentication/authorization errors; prompt user to reconnect Google account
- `400`, `404`: User-actionable errors; do not retry automatically
