import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ReviewContext {
  reviewerName: string;
  rating: number;
  reviewText: string;
  businessName: string;
}

export interface VoiceProfile {
  tone: string;
  personalityNotes?: string;
  exampleResponses?: string[];
  signOffStyle?: string;
  wordsToUse?: string[];
  wordsToAvoid?: string[];
  maxLength: number;
}

export interface GenerateResponseResult {
  response: string;
  tokensUsed: number;
}

/**
 * Generate a review response using Claude AI
 *
 * @param review - The review context (reviewer name, rating, text, etc.)
 * @param voiceProfile - The voice profile configuration for the business
 * @returns The generated response text and token usage
 */
export async function generateReviewResponse(
  review: ReviewContext,
  voiceProfile: VoiceProfile
): Promise<GenerateResponseResult> {
  // Build the system prompt with voice profile
  const systemPrompt = buildSystemPrompt(voiceProfile);

  // Build the user prompt with review details
  const userPrompt = buildUserPrompt(review, voiceProfile);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract the response text
  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';

  return {
    response: responseText,
    tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
  };
}

function buildSystemPrompt(voiceProfile: VoiceProfile): string {
  const parts = [
    `You are a helpful assistant writing business review responses.`,
    `Write in a ${voiceProfile.tone} tone.`,
  ];

  if (voiceProfile.personalityNotes) {
    parts.push(`Personality: ${voiceProfile.personalityNotes}`);
  }

  if (voiceProfile.wordsToUse?.length) {
    parts.push(`Try to incorporate these words/phrases when appropriate: ${voiceProfile.wordsToUse.join(', ')}`);
  }

  if (voiceProfile.wordsToAvoid?.length) {
    parts.push(`Avoid using these words/phrases: ${voiceProfile.wordsToAvoid.join(', ')}`);
  }

  if (voiceProfile.exampleResponses?.length) {
    parts.push(`Here are examples of good responses in this voice:`);
    voiceProfile.exampleResponses.forEach((example, i) => {
      parts.push(`Example ${i + 1}: "${example}"`);
    });
  }

  parts.push(`Keep responses under ${voiceProfile.maxLength} words.`);
  parts.push(`Be genuine and specific to what the reviewer mentioned.`);
  parts.push(`Never make up facts or promises the business can't keep.`);

  return parts.join('\n\n');
}

function buildUserPrompt(review: ReviewContext, voiceProfile: VoiceProfile): string {
  const sentiment = review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative';

  let prompt = `Write a response to this ${sentiment} ${review.rating}-star review for ${review.businessName}.\n\n`;
  prompt += `Reviewer: ${review.reviewerName}\n`;
  prompt += `Review: "${review.reviewText}"\n\n`;

  if (voiceProfile.signOffStyle) {
    prompt += `Sign off as: ${voiceProfile.signOffStyle}`;
  }

  return prompt;
}

export default anthropic;
