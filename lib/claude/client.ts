/**
 * Claude AI Response Generator
 *
 * Implements Claude API integration for generating review responses.
 *
 * @see https://docs.anthropic.com/en/api
 * @see docs/PROMPTS.md for prompt templates
 */

import type { Review, VoiceProfile } from "@/lib/supabase/types";

// Claude model to use
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

// API configuration
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2025-09-29";
const MAX_TOKENS = 500;
const TIMEOUT_MS = 30000;
const MAX_RETRY_ATTEMPTS = 2;
const MAX_REVIEW_TEXT_LENGTH = 10000;

/**
 * Custom error class for Claude API errors
 */
export class ClaudeAPIError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ClaudeAPIError";
  }
}

/**
 * Default voice profile used when organization has no voice profile configured
 */
export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  id: "",
  organization_id: null,
  name: "Default",
  tone: "friendly",
  personality_notes: "Professional and friendly",
  sign_off_style: "The Team",
  example_responses: null,
  words_to_use: null,
  words_to_avoid: ["sorry for any inconvenience", "valued customer"],
  max_length: 150,
  created_at: null,
};

/**
 * Response shape from Claude API
 */
interface ClaudeResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{ type: "text"; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Fetches the given URL and aborts the request if it does not complete within the specified timeout.
 *
 * Integrates with an optional existing AbortSignal: if provided and already aborted, the fetch is aborted immediately; if that signal aborts later, the fetch is aborted as well. On timeout the request is aborted and a ClaudeAPIError with status 408 is thrown.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options; an existing `signal` may be provided to cancel the request
 * @param timeoutMs - Timeout in milliseconds
 * @returns The fetch Response
 * @throws ClaudeAPIError with status 408 if the request times out
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;
  let isTimeoutAbort = false;

  timeoutId = setTimeout(() => {
    isTimeoutAbort = true;
    controller.abort();
  }, timeoutMs);

  const existingSignal = options.signal;
  if (existingSignal) {
    if (existingSignal.aborted) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      controller.abort();
    } else {
      existingSignal.addEventListener(
        "abort",
        () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          controller.abort();
        },
        { once: true },
      );
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    return response;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (error instanceof Error && error.name === "AbortError") {
      if (isTimeoutAbort) {
        throw new ClaudeAPIError(408, "Request timed out");
      }
      throw error;
    }
    throw error;
  }
}

/**
 * Generate a response from the Claude API using the provided system and user prompts.
 *
 * @param systemPrompt - Instructions that define the assistant's role, style, and constraints
 * @param userPrompt - The message describing the specific review and context for which a reply should be written
 * @returns An object with `text`: the assistant's generated reply, and `tokensUsed`: the sum of input and output tokens consumed
 * @throws ClaudeAPIError when the API key is missing or the Claude API returns an error status
 */
async function callClaudeAPI(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeAPIError(500, "AI service not configured");
  }

  const response = await fetchWithTimeout(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      (errorData as { error?: { message?: string } }).error?.message ??
      "Claude API request failed";

    throw new ClaudeAPIError(response.status, errorMessage);
  }

  const data = (await response.json()) as ClaudeResponse;
  const text = data.content[0]?.text ?? "";
  const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

  return { text, tokensUsed };
}

/**
 * Attempt to call the Claude API with retry and exponential backoff.
 *
 * @param systemPrompt - System-level prompt that defines the assistant's role and style
 * @param userPrompt - User-level prompt containing the review and business context
 * @param maxAttempts - Maximum number of attempts before failing (defaults to MAX_RETRY_ATTEMPTS)
 * @returns An object with `text` (the generated assistant response) and `tokensUsed` (total tokens consumed)
 * @throws ClaudeAPIError for authentication (401/403), rate-limit (429) errors raised immediately, or when all retry attempts are exhausted
 */
async function callClaudeWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
): Promise<{ text: string; tokensUsed: number }> {
  let lastError: ClaudeAPIError | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await callClaudeAPI(systemPrompt, userPrompt);
    } catch (error) {
      if (error instanceof ClaudeAPIError) {
        lastError = error;

        // Don't retry on auth errors or rate limits
        if (
          error.status === 401 ||
          error.status === 403 ||
          error.status === 429
        ) {
          throw error;
        }

        // Log retry attempt (never log API key)
        console.warn("Claude API attempt failed:", {
          attempt,
          maxAttempts,
          status: error.status,
        });

        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
        }
      } else {
        throw error;
      }
    }
  }

  throw lastError ?? new ClaudeAPIError(500, "Claude API call failed");
}

/**
 * Generate a customer-facing response to a review in the voice defined by the provided voice profile.
 *
 * If the review is one or two stars and `contactEmail` is provided, the response will include a short addendum
 * inviting the reviewer to continue the conversation via that email.
 *
 * @param contactEmail - Optional email address included in a negative-review addendum to invite offline resolution
 * @returns An object with `text` containing the generated response and `tokensUsed` indicating total tokens consumed
 * @throws ClaudeAPIError when the Claude API call fails
 */
export async function generateResponse(
  review: Review,
  voiceProfile: VoiceProfile,
  businessName: string,
  contactEmail?: string,
): Promise<{ text: string; tokensUsed: number }> {
  // Truncate very long reviews to avoid token limits
  let reviewText = review.review_text;
  if (reviewText && reviewText.length > MAX_REVIEW_TEXT_LENGTH) {
    reviewText =
      reviewText.slice(0, MAX_REVIEW_TEXT_LENGTH) +
      "... [Review truncated due to length]";
  }
  const reviewWithTruncatedText = { ...review, review_text: reviewText };

  // Build prompts
  const systemPrompt = buildSystemPrompt(voiceProfile, businessName);
  const isNegativeReview = review.rating !== null && review.rating <= 2;
  const userPrompt = buildUserPrompt(
    reviewWithTruncatedText,
    businessName,
    isNegativeReview,
    contactEmail,
  );

  // Call Claude API with retry
  return await callClaudeWithRetry(systemPrompt, userPrompt);
}

/**
 * Constructs the system prompt that instructs the AI how to write review responses for the business.
 *
 * @param voiceProfile - Voice and style settings used to populate the prompt (fields used: `tone`, `personality_notes`, `sign_off_style`, `example_responses`, `words_to_avoid`, `words_to_use`, and `max_length`)
 * @param businessName - The business name included in the prompt to identify the sender
 * @returns The formatted system prompt string containing voice instructions, example responses, and rules (including length limit, addressing guidance, and preferred/forbidden words)
 */
function buildSystemPrompt(
  voiceProfile: VoiceProfile,
  businessName: string,
): string {
  const exampleResponses = voiceProfile.example_responses?.join("\n\n") ?? "";
  const wordsToAvoid = voiceProfile.words_to_avoid?.join(", ") ?? "";
  const wordsToUse = voiceProfile.words_to_use?.join(", ") ?? "";

  return `You are a review response writer for ${businessName}.

YOUR VOICE:
- Tone: ${voiceProfile.tone}
- Personality: ${voiceProfile.personality_notes ?? "Professional and friendly"}
- Sign off as: ${voiceProfile.sign_off_style ?? ""}

EXAMPLES OF RESPONSES THEY LIKE:
${exampleResponses}

RULES:
1. Keep responses under ${voiceProfile.max_length} words
2. Thank reviewer by name (if provided, otherwise "Thank you")
3. For 4-5 star: Show genuine appreciation, mention something specific from their review
4. For 1-3 star: Acknowledge concern without arguing, invite offline resolution
5. Never be defensive or make excuses
6. Sound human, not corporate
7. Never use: ${wordsToAvoid}
8. Prefer using: ${wordsToUse}`;
}

/**
 * Builds the user prompt for a specific review
 *
 * @param review - The review to respond to
 * @param businessName - The business name to use in the prompt
 * @param isNegativeReview - Whether this is a negative review (1-2 stars) requiring special handling
 * @param contactEmail - Optional contact email for negative review addendum
 * @returns The formatted user prompt string
 */
function buildUserPrompt(
  review: Review,
  businessName: string,
  isNegativeReview?: boolean,
  contactEmail?: string,
): string {
  const reviewDate = review.review_date
    ? new Date(review.review_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  let prompt = `Review to respond to:
- Rating: ${review.rating ?? "Unknown"}/5 stars
- Reviewer: ${review.reviewer_name ?? "Anonymous"}
- Date: ${reviewDate}
- Text: "${review.review_text ?? "No review text"}"

Write a response as ${businessName}.`;

  // Add negative review addendum if applicable
  if (isNegativeReview && contactEmail) {
    prompt += `\n\n${buildNegativeAddendum(contactEmail)}`;
  }

  return prompt;
}

/**
 * Create a short addendum guiding responses to 1–2 star (negative) reviews.
 *
 * The addendum flags the review as critical and specifies a concise five-step structure:
 * thank the reviewer, acknowledge the concern, apologize without admitting fault,
 * offer resolution using the provided contact email, and keep the response brief.
 *
 * @param contactEmail - Email address customers should use to contact the business
 * @returns A formatted multi-line string containing the structured addendum with the provided contact email
 */
export function buildNegativeAddendum(contactEmail: string): string {
  return `
CRITICAL: This is a negative review. Follow this structure:
1. Thank them for feedback (brief)
2. Acknowledge their specific concern without arguing
3. Apologize for their experience (don't admit fault)
4. Offer to resolve: "Please reach out to us at ${contactEmail} so we can make this right"
5. Keep it short - long responses look defensive`;
}