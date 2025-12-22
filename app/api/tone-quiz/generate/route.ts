import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { ClaudeAPIError } from "@/lib/claude/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

type QuizAnswer = {
  questionId: number;
  answerIds: number[];
};

const QUIZ_QUESTIONS = [
  {
    id: 1,
    text: "What is your preferred communication style?",
    answers: [
      { id: 1, text: "Warm and empathetic" },
      { id: 2, text: "Direct and straightforward" },
      { id: 3, text: "Professional and polished" },
      { id: 4, text: "Friendly and conversational" },
      { id: 5, text: "Casual and relaxed" },
    ],
  },
  {
    id: 2,
    text: "How do you handle negative reviews?",
    answers: [
      { id: 1, text: "Acknowledge concerns with empathy and offer solutions" },
      { id: 2, text: "Address issues directly and professionally" },
      { id: 3, text: "Thank for feedback and invite private discussion" },
      { id: 4, text: "Show understanding while maintaining brand voice" },
      { id: 5, text: "Keep it brief and move conversation offline" },
    ],
  },
  {
    id: 3,
    text: "What is your preferred response length?",
    answers: [
      { id: 1, text: "Very brief (50-100 words)" },
      { id: 2, text: "Short (100-150 words)" },
      { id: 3, text: "Medium (150-250 words)" },
      { id: 4, text: "Detailed (250-350 words)" },
      { id: 5, text: "Comprehensive (350+ words)" },
    ],
  },
  {
    id: 4,
    text: "What type of customer relationship do you want to build?",
    answers: [
      { id: 1, text: "Personal and caring" },
      { id: 2, text: "Professional and trustworthy" },
      { id: 3, text: "Friendly and approachable" },
      { id: 4, text: "Efficient and solution-focused" },
      { id: 5, text: "Relaxed and authentic" },
    ],
  },
  {
    id: 5,
    text: "How do you prioritize handling complaints?",
    answers: [
      { id: 1, text: "Address immediately with personal attention" },
      { id: 2, text: "Acknowledge quickly and provide clear next steps" },
      { id: 3, text: "Respond professionally with structured approach" },
      { id: 4, text: "Show understanding and offer flexible solutions" },
      { id: 5, text: "Keep response brief and direct to resolution" },
    ],
  },
  {
    id: 6,
    text: "What formality level matches your brand?",
    answers: [
      { id: 1, text: "Very formal" },
      { id: 2, text: "Formal" },
      { id: 3, text: "Moderately formal" },
      { id: 4, text: "Casual" },
      { id: 5, text: "Very casual" },
    ],
  },
  {
    id: 7,
    text: "How urgent should your responses feel?",
    answers: [
      { id: 1, text: "Very urgent - immediate action" },
      { id: 2, text: "Urgent - prompt response" },
      { id: 3, text: "Moderate - timely but thoughtful" },
      { id: 4, text: "Relaxed - take time to respond" },
      { id: 5, text: "Very relaxed - no rush" },
    ],
  },
  {
    id: 8,
    text: "What communication tone best represents your brand?",
    answers: [
      { id: 1, text: "Empathetic and understanding" },
      { id: 2, text: "Confident and authoritative" },
      { id: 3, text: "Professional and reliable" },
      { id: 4, text: "Warm and welcoming" },
      { id: 5, text: "Authentic and genuine" },
    ],
  },
  {
    id: 9,
    text: "What industry type(s) does your business operate in?",
    answers: [
      { id: 1, text: "Restaurant & Food Service" },
      { id: 2, text: "Retail & E-commerce" },
      { id: 3, text: "Healthcare & Medical" },
      { id: 4, text: "Professional Services" },
      { id: 5, text: "Hospitality & Travel" },
      { id: 6, text: "Beauty & Wellness" },
      { id: 7, text: "Technology & Software" },
      { id: 8, text: "Education & Training" },
      { id: 9, text: "Real Estate" },
      { id: 10, text: "Other" },
    ],
  },
  {
    id: 10,
    text: "What brand personality traits describe your business?",
    answers: [
      { id: 1, text: "Trustworthy" },
      { id: 2, text: "Innovative" },
      { id: 3, text: "Caring" },
      { id: 4, text: "Professional" },
      { id: 5, text: "Friendly" },
      { id: 6, text: "Authentic" },
      { id: 7, text: "Efficient" },
      { id: 8, text: "Creative" },
      { id: 9, text: "Reliable" },
      { id: 10, text: "Approachable" },
    ],
  },
];

/**
 * Build a formatted summary of quiz responses for Claude prompt
 */
function buildQuizSummary(answers: QuizAnswer[]): string {
  const summaryParts: string[] = [];

  for (const answer of answers) {
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) continue;

    const selectedAnswers = answer.answerIds
      .map((answerId) => {
        const answerOption = question.answers.find((a) => a.id === answerId);
        return answerOption?.text;
      })
      .filter(Boolean)
      .join(", ");

    if (selectedAnswers) {
      summaryParts.push(
        `Q${question.id}: ${question.text}\nA: ${selectedAnswers}`,
      );
    }
  }

  return summaryParts.join("\n\n");
}

/**
 * Call Claude API directly for tone generation
 */
async function callClaudeForTone(
  systemPrompt: string,
  userPrompt: string,
): Promise<{ text: string; tokensUsed: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeAPIError(500, "AI service not configured");
  }

  const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
  const ANTHROPIC_VERSION = "2023-06-01";
  const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
  const MAX_TOKENS = 500;
  const TIMEOUT_MS = 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(CLAUDE_API_URL, {
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
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } }).error?.message ??
        "Claude API request failed";

      throw new ClaudeAPIError(response.status, errorMessage);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };
    const text = data.content[0]?.text ?? "";
    const tokensUsed = data.usage.input_tokens + data.usage.output_tokens;

    return { text, tokensUsed };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ClaudeAPIError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ClaudeAPIError(408, "Request timed out");
    }
    throw error;
  }
}

/**
 * Generate a custom tone name, description, and enhanced context using Claude AI
 */
async function generateCustomTone(quizSummary: string): Promise<{
  name: string;
  description: string;
  enhancedContext: string;
}> {
  const systemPrompt = `You are a tone generation expert. Based on quiz responses about a business's communication preferences, generate:
1. A custom tone name (2-4 words, e.g., "Empathetic Professional", "Warmly Direct")
2. A brief description (1-2 sentences explaining the tone)
3. Enhanced context (detailed instructions for AI to use when generating review responses in this tone)

The enhanced context should be specific, actionable instructions that guide AI response generation. It should incorporate the quiz responses to create a unique voice that goes beyond standard tones.`;

  const userPrompt = `Based on these quiz responses, generate a custom tone:

${quizSummary}

Please provide your response in the following JSON format:
{
  "name": "Tone Name Here",
  "description": "Brief description of the tone",
  "enhancedContext": "Detailed instructions for AI response generation that incorporates the quiz responses..."
}`;

  try {
    const result = await callClaudeForTone(systemPrompt, userPrompt);
    const text = result.text.trim();

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        name?: string;
        description?: string;
        enhancedContext?: string;
      };

      if (parsed.name && parsed.description && parsed.enhancedContext) {
        return {
          name: parsed.name,
          description: parsed.description,
          enhancedContext: parsed.enhancedContext,
        };
      }
    }

    // Fallback if JSON parsing fails
    const lines = text.split("\n").filter((line) => line.trim());
    return {
      name: lines[0]?.replace(/^[#*-\s]*/g, "").trim() ?? "Custom Tone",
      description:
        lines[1]?.replace(/^[#*-\s]*/g, "").trim() ??
        "A personalized tone based on your preferences",
      enhancedContext:
        lines.slice(2).join("\n").trim() ||
        "Use the quiz responses to guide response generation with a personalized approach.",
    };
  } catch (error) {
    console.error("Error generating custom tone with Claude:", error);
    throw new Error("Failed to generate custom tone");
  }
}

/**
 * POST /api/tone-quiz/generate
 *
 * Generates a custom tone based on quiz responses using Claude AI.
 * Saves the custom tone to the database and returns it.
 *
 * @param request - Request containing quiz answers
 * @returns JSON object with generated custom tone
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { answers } = body as { answers?: QuizAnswer[] };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "Quiz answers are required" },
        { status: 400 },
      );
    }

    // Validate all questions are answered
    if (answers.length !== QUIZ_QUESTIONS.length) {
      return NextResponse.json(
        { error: "All questions must be answered" },
        { status: 400 },
      );
    }

    // Build quiz summary and generate custom tone
    const quizSummary = buildQuizSummary(answers);
    const customTone = await generateCustomTone(quizSummary);

    // Save custom tone to database
    const { data: insertedTone, error: insertError } = await supabase
      .from("custom_tones")
      .insert({
        organization_id: userData.organization_id,
        name: customTone.name,
        description: customTone.description,
        enhanced_context: customTone.enhancedContext,
        quiz_responses: answers as Json,
      })
      .select("id, name, description, enhanced_context")
      .single();

    if (insertError || !insertedTone) {
      console.error("Error saving custom tone:", insertError);
      return NextResponse.json(
        { error: "Failed to save custom tone" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      customTone: {
        id: insertedTone.id,
        name: insertedTone.name,
        description: insertedTone.description,
        enhancedContext: insertedTone.enhanced_context,
      },
    });
  } catch (error) {
    console.error("Tone quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate custom tone" },
      { status: 500 },
    );
  }
}
