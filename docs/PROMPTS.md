# AI Prompt Architecture

This document defines the prompt templates used for AI response generation and custom tone generation.

---

## Response Generation System Prompt

```
You are a review response writer for {business_name}, a {industry} in {city}.

YOUR VOICE:
- Tone: {tone}
{enhanced_context}
- Personality: {personality_notes}
- Sign off as: {sign_off_style}

EXAMPLES OF RESPONSES THEY LIKE:
{example_responses}

RULES:
1. Keep responses under {max_length} words
2. Thank reviewer by name (if provided, otherwise "Thank you")
3. For 4-5 star: Show genuine appreciation, mention something specific from their review
4. For 1-3 star: Acknowledge concern without arguing, invite offline resolution
5. Never be defensive or make excuses
6. Sound human, not corporate
7. Never use: {words_to_avoid}
8. Prefer using: {words_to_use}
```

---

## User Prompt Template

```
Review to respond to:
- Rating: {rating}/5 stars
- Reviewer: {reviewer_name}
- Date: {review_date}
- Text: "{review_text}"

Write a response as {business_name}.
```

---

## Negative Review Addendum

For reviews with 1-2 stars, append this to the system prompt:

```
CRITICAL: This is a negative review. Follow this structure:
1. Thank them for feedback (brief)
2. Acknowledge their specific concern without arguing
3. Apologize for their experience (don't admit fault)
4. Offer to resolve: "Please reach out to us at {contact} so we can make this right"
5. Keep it short - long responses look defensive
```

**Why this matters:** Negative reviews require careful handling. Long, defensive responses make businesses look worse. The goal is acknowledgment and offline resolution, not winning an argument in public.

---

## Prompt Variables Reference

| Variable | Source | Example |
|----------|--------|---------|
| `{business_name}` | `locations.name` | "Joe's Pizza" |
| `{industry}` | `voice_profiles.personality_notes` or inferred | "Italian restaurant" |
| `{city}` | Extracted from `locations.address` | "Austin" |
| `{tone}` | `voice_profiles.tone` (standard or `custom:{uuid}`) | "warm" or "custom:abc-123" |
| `{enhanced_context}` | `custom_tones.enhanced_context` (only for custom tones) | "This business values authentic, down-to-earth communication..." |
| `{personality_notes}` | `voice_profiles.personality_notes` | "Family-owned for 30 years, known for thin crust" |
| `{sign_off_style}` | `voice_profiles.sign_off_style` | "- Joe, Owner" |
| `{example_responses}` | `voice_profiles.example_responses` | Array joined with newlines |
| `{max_length}` | `voice_profiles.max_length` | 150 |
| `{words_to_avoid}` | `voice_profiles.words_to_avoid` | "sorry for any inconvenience, valued customer" |
| `{words_to_use}` | `voice_profiles.words_to_use` | "family, neighborhood, fresh" |
| `{rating}` | `reviews.rating` | 4 |
| `{reviewer_name}` | `reviews.reviewer_name` | "Sarah M." |
| `{review_date}` | `reviews.review_date` | "December 10, 2024" |
| `{review_text}` | `reviews.review_text` | "Great pizza, fast delivery!" |
| `{contact}` | `organizations` or `locations` | "joe@joespizza.com" |

---

## Example Outputs

### 5-Star Review Example

**Input:**
- Rating: 5/5 stars
- Reviewer: Sarah M.
- Text: "Best pizza in Austin! The thin crust is perfect and delivery was super fast. Will definitely order again."

**Generated Response:**
> Sarah, thank you so much! We're thrilled you loved the thin crust—it's been our family recipe for 30 years. Fast delivery is something we really pride ourselves on in the neighborhood. Can't wait to serve you again!
>
> — Joe, Owner

### 2-Star Review Example

**Input:**
- Rating: 2/5 stars
- Reviewer: Mike T.
- Text: "Pizza was cold when it arrived and took over an hour. Expected better based on reviews."

**Generated Response:**
> Mike, thank you for letting us know. Cold pizza after an hour wait is not the experience we want for anyone. We'd love the chance to make this right—please reach out to joe@joespizza.com so we can take care of you.
>
> — Joe, Owner

---

## Token Usage Estimation

### Review Response Generation

| Component | Estimated Tokens |
|-----------|------------------|
| System prompt (base) | ~200 |
| Enhanced context (custom tones only) | ~100 |
| Example responses (3) | ~150 |
| User prompt | ~100 |
| Negative addendum (if applicable) | ~80 |
| **Total input** | **~450-630** |
| Generated response | ~80-120 |

**Cost per response:** ~$0.001-0.0015 (Claude Haiku 4.5 pricing: $1.00/M input tokens, $5.00/M output tokens)

### Custom Tone Generation

| Component | Estimated Tokens |
|-----------|------------------|
| System prompt | ~50 |
| User prompt (template + quiz responses) | ~400-600 |
| **Total input** | **~450-650** |
| Generated custom tone JSON | ~150-200 |

**Cost per custom tone:** ~$0.001-0.0015 (one-time cost per tone creation)

---

## Prompt Engineering Notes

### Why These Rules Work

1. **"Thank by name"** — Personalization is the #1 factor in response quality perception
2. **"Mention something specific"** — Shows the response isn't generic/automated
3. **"Never be defensive"** — Businesses that argue in reviews always look bad
4. **"Sound human, not corporate"** — "We apologize for any inconvenience" is the kiss of death

### Words to Avoid (Defaults)

These phrases make responses sound robotic:
- "We apologize for any inconvenience"
- "Your feedback is valuable"
- "As a valued customer"
- "We strive to..."
- "Per our policy..."
- "Unfortunately..."

### Tone Definitions

| Tone | Description | Best For |
|------|-------------|----------|
| `warm` | Warm and approachable | Restaurants, salons, family businesses |
| `direct` | Straightforward and to the point | Service businesses, quick interactions |
| `professional` | Polished and business-like | Medical, legal, financial services |
| `friendly` | Conversational and personable | Retail, customer service, community businesses |
| `casual` | Relaxed and informal | Bars, gyms, entertainment, creative businesses |
| `custom:{uuid}` | AI-generated personalized tone from tone quiz | Any business wanting unique voice |

**Note on Custom Tones:** When `tone` is set to `custom:{uuid}`, the system fetches the custom tone record from the `custom_tones` table and includes its `enhanced_context` in the prompt. Custom tones are generated via the tone quiz (10 questions) and Claude AI, providing richer personality guidance than standard tones.

---

## Custom Tone Generation Prompt

Used by `POST /api/tone-quiz/generate` to create personalized tones from quiz responses.

### System Prompt

```
You are a communication style expert who helps businesses define their unique voice for responding to customer reviews. Based on a user's quiz responses, you will generate a personalized communication tone that captures their style, values, and approach to customer interactions.
```

### User Prompt Template

```
A business owner has completed a tone discovery quiz. Based on their responses, generate a custom communication tone that will guide AI-generated review responses.

QUIZ RESPONSES:
{quiz_responses_formatted}

Generate a custom tone with:
1. A creative, memorable name (2-4 words, avoid generic terms like "Professional" or "Friendly")
2. A concise description (1-2 sentences) that captures the essence of this communication style
3. Enhanced context (3-5 sentences) that provides detailed guidance for AI response generation, including:
   - How to address customers
   - What language/phrasing to prefer or avoid
   - How to handle different review types (positive vs negative)
   - Unique personality traits or brand voice characteristics

Return ONLY a valid JSON object with this exact structure:
{
  "name": "string",
  "description": "string",
  "enhanced_context": "string"
}
```

### Quiz Response Formatting

Quiz responses are formatted as:

```
Q1: {question_text}
   Answer: {selected_answer_text}

Q2: {question_text}
   Answers: {selected_answer_1}, {selected_answer_2}

...
```

### Example Output

```json
{
  "name": "Authentic Neighborhood Guide",
  "description": "Down-to-earth and genuine, like a trusted neighbor sharing recommendations over coffee.",
  "enhanced_context": "Address customers by name whenever possible, using conversational language that feels personal and warm. Avoid corporate jargon and overly formal phrasing—prefer 'we'd love to' over 'we would be pleased to.' When responding to positive reviews, share specific details that show you remember their experience. For negative reviews, acknowledge concerns directly without defensiveness, and always offer a personal follow-up (phone call or in-person conversation) rather than resolving issues publicly. Your voice should feel like a local business owner who genuinely cares about their community."
}
```

---

## Future Enhancements

- **Sentiment analysis:** Pre-classify review sentiment to adjust tone
- **Topic extraction:** Identify what the review is about (service, product, staff) for more specific responses
- **A/B testing:** Track which response styles get more engagement
- **Learning from edits:** Use user edits to improve future generations
- **Multi-language support:** Detect review language and respond in same language
- **Custom tone refinement:** Allow users to regenerate custom tones or manually edit enhanced context

---

## Tone Quiz Details

The tone quiz (`components/voice-profile/tone-quiz.tsx`) helps users discover their ideal communication style through 10 carefully designed questions:

### Quiz Structure

- **Question Types:** Single-select and multi-select
- **Categories Covered:**
  - Communication style preferences (formal vs casual, brief vs detailed)
  - Review response approach (public resolution vs offline, defensive vs empathetic)
  - Response length preferences (concise vs thorough)
  - Customer relationship philosophy (transactional vs relationship-building)
  - Brand personality traits (traditional vs innovative, serious vs playful)

### Quiz Questions Source

- Defined in `lib/quiz/questions.ts`
- Shared between frontend (ToneQuiz component) and backend (tone generation API)
- Each question has:
  - `id`: Unique numeric identifier
  - `question`: Question text
  - `type`: "single" or "multiple"
  - `answers`: Array of answer options with `id` and `text`

### Custom Tone Generation Flow

1. User completes 10 questions in ToneQuiz component
2. Component submits answers to `POST /api/tone-quiz/generate`
3. API validates answers (correct question IDs, valid answer IDs, no duplicates)
4. API formats quiz responses as readable text
5. API calls Claude AI with custom tone generation prompt
6. Claude returns JSON with `name`, `description`, and `enhanced_context`
7. API saves custom tone to `custom_tones` table with `organization_id`
8. Custom tone appears in voice profile tone selector as `custom:{uuid}`
9. When selected, `enhanced_context` is included in review response generation prompts

### Example Custom Tone Output

```json
{
  "name": "Authentic Neighborhood Guide",
  "description": "Down-to-earth and genuine, like a trusted neighbor sharing recommendations over coffee.",
  "enhanced_context": "Address customers by name whenever possible, using conversational language that feels personal and warm. Avoid corporate jargon and overly formal phrasing—prefer 'we'd love to' over 'we would be pleased to.' When responding to positive reviews, share specific details that show you remember their experience. For negative reviews, acknowledge concerns directly without defensiveness, and always offer a personal follow-up (phone call or in-person conversation) rather than resolving issues publicly. Your voice should feel like a local business owner who genuinely cares about their community."
}
```
