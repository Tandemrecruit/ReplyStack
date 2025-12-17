import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Handle POST /api/responses to create an AI-generated response placeholder for a review.
 *
 * Requires an authenticated user and a JSON body containing `reviewId`.
 * If AI generation is not yet implemented, returns a draft placeholder response.
 *
 * @param request - NextRequest whose JSON body must include `reviewId` (string)
 * @returns On success: a JSON object with `id`, `reviewId`, `generatedText`, and `status`. On error: a JSON object with `error` and an appropriate HTTP status (401 when unauthenticated, 400 when `reviewId` is missing, 500 on internal failure).
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

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 },
      );
    }

    // TODO: Implement AI response generation
    // 1. Fetch review and voice profile
    // 2. Build prompt from PROMPTS.md template
    // 3. Call Claude API
    // 4. Store generated response
    // 5. Return response

    console.warn("Response generation not yet implemented", { reviewId });

    return NextResponse.json({
      id: "placeholder",
      reviewId,
      generatedText: "AI response generation coming soon...",
      status: "draft",
    });
  } catch (error) {
    console.error("Response generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}