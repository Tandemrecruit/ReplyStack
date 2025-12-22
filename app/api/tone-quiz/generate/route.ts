import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { callClaudeWithRetry } from "@/lib/claude/client";
import { QUIZ_QUESTIONS, type QuizAnswer } from "@/lib/quiz/questions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

/**
 * Validate quiz answers structure and content
 *
 * @param answers - Array of quiz answers to validate
 * @returns Error message if validation fails, null if valid
 */
function validateQuizAnswers(answers: QuizAnswer[]): string | null {
  for (const answer of answers) {
    // Check that questionId exists in QUIZ_QUESTIONS
    const question = QUIZ_QUESTIONS.find((q) => q.id === answer.questionId);
    if (!question) {
      return `Invalid question ID: ${answer.questionId}`;
    }

    // Check that answerIds is an array and not empty
    if (!Array.isArray(answer.answerIds) || answer.answerIds.length === 0) {
      return `Missing answers for question ${answer.questionId}`;
    }

    // Check that every answerId exists in the matched question's answers
    for (const answerId of answer.answerIds) {
      const answerOption = question.answers.find((a) => a.id === answerId);
      if (!answerOption) {
        return `Invalid answer ID ${answerId} for question ${answer.questionId}`;
      }
    }
  }

  return null;
}

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
 * Extract the first balanced JSON object from text using brace balancing.
 *
 * Scans the text to find the first complete JSON object by tracking
 * opening and closing braces, handling nested objects correctly.
 *
 * @param text - The text to extract JSON from
 * @returns The extracted JSON string, or null if no balanced object found
 */
function extractBalancedJson(text: string): string | null {
  let braceCount = 0;
  let startIndex = -1;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "{") {
      if (braceCount === 0) {
        startIndex = i;
      }
      braceCount++;
    } else if (char === "}") {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

/**
 * Generate a custom tone name, description, and enhanced context using Claude AI
 */
async function generateCustomTone(
  quizSummary: string,
  requestId?: string,
): Promise<{
  name: string;
  description: string;
  enhancedContext: string;
}> {
  const systemPrompt = `You are a tone generation expert. Based on quiz responses about a business's communication preferences, generate:
1. A custom tone name (2-4 words, e.g., "Empathetic Professional", "Warmly Direct")
2. A brief description (1-2 sentences explaining the tone)
3. Enhanced context (detailed instructions for AI to use when generating review responses in this tone)

The enhanced context should be specific, actionable instructions that guide AI response generation. It should incorporate the quiz responses to create a unique voice that goes beyond standard tones.

IMPORTANT: Your response must be ONLY a valid JSON object with no surrounding text, comments, or markdown formatting.`;

  const userPrompt = `Based on these quiz responses, generate a custom tone:

${quizSummary}

Return ONLY a valid JSON object in this exact format (no other text):
{
  "name": "Tone Name Here",
  "description": "Brief description of the tone",
  "enhancedContext": "Detailed instructions for AI response generation that incorporates the quiz responses..."
}`;

  try {
    const result = await callClaudeWithRetry(systemPrompt, userPrompt);
    const text = result.text.trim();

    // Try to extract JSON using brace-balancing
    const jsonString = extractBalancedJson(text);
    if (jsonString) {
      try {
        const parsed = JSON.parse(jsonString) as {
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
      } catch (parseError) {
        // JSON string found but parsing failed - fall through to fallback
        console.warn("Failed to parse extracted JSON:", parseError);
      }
    }

    // Fallback if JSON parsing fails
    const lines = text.split("\n").filter((line) => line.trim());
    const name = lines[0]?.replace(/^[#*-\s]*/g, "").trim() ?? "Custom Tone";
    const description =
      lines[1]?.replace(/^[#*-\s]*/g, "").trim() ??
      "A personalized tone based on your preferences";
    const enhancedContext =
      lines.slice(2).join("\n").trim() ||
      "Use the quiz responses to guide response generation with a personalized approach.";

    // Track which fallback defaults were applied
    const appliedDefaults: string[] = [];
    if (name === "Custom Tone") appliedDefaults.push("name");
    if (description === "A personalized tone based on your preferences")
      appliedDefaults.push("description");
    if (
      enhancedContext ===
      "Use the quiz responses to guide response generation with a personalized approach."
    )
      appliedDefaults.push("enhancedContext");

    // Truncate Claude response to avoid PII leaks (max 500 chars)
    const truncatedResponse =
      text.length > 500 ? `${text.slice(0, 500)}...` : text;

    // Warning-level log with structured data for monitoring
    console.warn(
      JSON.stringify({
        event: "fallback_parsing_triggered",
        metric: "fallback_parsing_triggered",
        level: "warn",
        requestId: requestId ?? "unknown",
        message: "Fallback line-based parsing used for Claude response",
        data: {
          truncatedResponse,
          parsedLines: lines,
          appliedDefaults:
            appliedDefaults.length > 0 ? appliedDefaults : "none",
          lineCount: lines.length,
        },
      }),
    );

    return {
      name,
      description,
      enhancedContext,
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
  // Generate request ID for tracking and logging
  const requestId = crypto.randomUUID();

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

    // Validate each answer object structure and content
    const validationError = validateQuizAnswers(answers);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Build quiz summary and generate custom tone
    const quizSummary = buildQuizSummary(answers);
    const customTone = await generateCustomTone(quizSummary, requestId);

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
      .select("id, name, description, enhanced_context, created_at")
      .single();

    if (insertError || !insertedTone) {
      console.error("Error saving custom tone:", insertError);
      return NextResponse.json(
        { error: "Failed to save custom tone" },
        { status: 500 },
      );
    }

    // Normalize snake_case to camelCase at API boundary
    return NextResponse.json({
      customTone: {
        id: insertedTone.id,
        name: insertedTone.name,
        description: insertedTone.description,
        enhancedContext: insertedTone.enhanced_context,
        createdAt: insertedTone.created_at ?? new Date().toISOString(),
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
