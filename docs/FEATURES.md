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
- `500`: Server error

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

- If tone starts with `custom:`, looks up custom tone
- Includes `enhancedContext` in AI prompt
- Falls back gracefully if custom tone not found

### Error Handling

- `400`: Missing reviewId, no organization, review has no text
- `404`: User/review not found
- `429`: Rate limit exceeded (Claude API)
- `500`: Database/Claude API error
- `502`: AI service unavailable
- `504`: Response generation timed out

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
   - If exists: preserves `generated_text`, stores edits in `edited_text` (if modified)
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
- `403`: Google API permission denied
- `404`: User/review not found
- `500`: Database/Google API error
- Returns `200` with warning if Google succeeds but DB fails
