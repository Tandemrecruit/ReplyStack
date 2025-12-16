/**
 * Claude AI Response Generator
 *
 * TODO: Implement Claude API integration for generating review responses
 *
 * @see https://docs.anthropic.com/en/api
 * @see docs/PROMPTS.md for prompt templates
 */

import type { Review, VoiceProfile } from "@/lib/supabase/types";

// Claude model to use
const CLAUDE_MODEL = "claude-sonnet-4-5-20250929";

// API configuration
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MAX_TOKENS = 500;
const TIMEOUT_MS = 30000;

/**
 * Generates a response for a review using Claude AI
 *
 * @param review - The review to respond to
 * @param voiceProfile - The voice profile configuration
 * @param businessName - The name of the business
 * @returns Generated response text
 */
export async function generateResponse(
  review: Review,
  voiceProfile: VoiceProfile,
  businessName: string
): Promise<{ text: string; tokensUsed: number }> {
  const systemPrompt = buildSystemPrompt(voiceProfile, businessName);
  const userPrompt = buildUserPrompt(review, businessName);

  // TODO: Implement Claude API call
  console.warn("Claude API not implemented", {
    model: CLAUDE_MODEL,
    apiUrl: CLAUDE_API_URL,
    maxTokens: MAX_TOKENS,
    timeout: TIMEOUT_MS,
    reviewId: review.id,
    systemPromptLength: systemPrompt.length,
    userPromptLength: userPrompt.length,
  });

  // Return placeholder response
  return {
    text: "AI response generation coming soon...",
    tokensUsed: 0,
  };
}

/**
 * Builds the system prompt from voice profile
 */
function buildSystemPrompt(
  voiceProfile: VoiceProfile,
  businessName: string
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
 */
function buildUserPrompt(review: Review, businessName: string): string {
  const reviewDate = review.review_date
    ? new Date(review.review_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown date";

  return `Review to respond to:
- Rating: ${review.rating ?? "Unknown"}/5 stars
- Reviewer: ${review.reviewer_name ?? "Anonymous"}
- Date: ${reviewDate}
- Text: "${review.review_text ?? "No review text"}"

Write a response as ${businessName}.`;
}

/**
 * Builds the negative review addendum for 1-2 star reviews
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

