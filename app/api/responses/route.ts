import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ClaudeAPIError,
  DEFAULT_VOICE_PROFILE,
  generateResponse,
} from "@/lib/claude/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { VoiceProfile } from "@/lib/supabase/types";

/**
 * Handle POST /api/responses to generate an AI response for a review.
 *
 * Requires an authenticated user and a JSON body containing `reviewId`.
 * Generates a response using Claude API based on the review and voice profile.
 *
 * @param request - NextRequest whose JSON body must include `reviewId` (string)
 * @returns On success: a JSON object with `id`, `reviewId`, `generatedText`, `status`, and `tokensUsed`.
 *          On error: a JSON object with `error` and an appropriate HTTP status.
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

    // Parse request body
    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId is required" },
        { status: 400 },
      );
    }

    // Get user's organization and email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Fetch review with location to verify organization ownership
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        reviewer_name,
        review_text,
        review_date,
        reviewer_photo_url,
        external_review_id,
        platform,
        status,
        sentiment,
        has_response,
        location_id,
        created_at,
        locations!inner (
          id,
          name,
          organization_id,
          voice_profile_id
        )
      `,
      )
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify review belongs to user's organization
    const location = review.locations as unknown as {
      id: string;
      name: string;
      organization_id: string;
      voice_profile_id: string | null;
    };

    if (location.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check for existing response
    const { data: existingResponse, error: existingResponseError } =
      await supabase
        .from("responses")
        .select("id, generated_text, status, tokens_used")
        .eq("review_id", reviewId)
        .maybeSingle();

    if (existingResponseError) {
      console.error(
        "Failed to check for existing response:",
        existingResponseError,
      );
      return NextResponse.json(
        { error: "Failed to check for existing response" },
        { status: 500 },
      );
    }

    if (existingResponse) {
      // Return existing response instead of regenerating
      return NextResponse.json({
        id: existingResponse.id,
        reviewId,
        generatedText: existingResponse.generated_text,
        status: existingResponse.status,
        tokensUsed: existingResponse.tokens_used ?? 0,
      });
    }

    // Validate review has text to respond to
    if (!review.review_text || review.review_text.trim().length === 0) {
      return NextResponse.json(
        { error: "Cannot generate response for review without text" },
        { status: 400 },
      );
    }

    // Get voice profile (location first, then org's first, then default)
    let voiceProfile: VoiceProfile | null = null;

    if (location.voice_profile_id) {
      const { data: locationProfile, error: locationProfileError } =
        await supabase
          .from("voice_profiles")
          .select("*")
          .eq("id", location.voice_profile_id)
          .single();
      if (locationProfileError) {
        console.warn(
          "Failed to fetch location voice profile, using fallback:",
          locationProfileError,
        );
      }
      voiceProfile = locationProfile;
    }

    if (!voiceProfile) {
      const { data: orgProfile, error: orgProfileError } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("organization_id", userData.organization_id)
        .limit(1)
        .maybeSingle();
      if (orgProfileError) {
        console.warn(
          "Failed to fetch organization voice profile, using fallback:",
          orgProfileError,
        );
      }
      voiceProfile = orgProfile;
    }

    // Use default voice profile if none found
    const effectiveProfile = voiceProfile ?? DEFAULT_VOICE_PROFILE;

    // Generate response using Claude
    const result = await generateResponse(
      review,
      effectiveProfile,
      location.name,
      userData.email ?? undefined,
    );

    // Store the generated response
    const { data: insertedResponse, error: insertError } = await supabase
      .from("responses")
      .insert({
        review_id: reviewId,
        generated_text: result.text,
        status: "draft",
        tokens_used: result.tokensUsed,
      })
      .select("id")
      .single();

    if (insertError || !insertedResponse) {
      console.error("Failed to save response:", insertError);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: insertedResponse.id,
      reviewId,
      generatedText: result.text,
      status: "draft",
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    // Handle Claude API errors with appropriate status codes
    if (error instanceof ClaudeAPIError) {
      console.error("Claude API error:", {
        status: error.status,
        message: error.message,
      });

      if (error.status === 408) {
        return NextResponse.json(
          { error: "AI response generation timed out" },
          { status: 504 },
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 },
        );
      }
      if (error.status === 401 || error.status === 403) {
        return NextResponse.json(
          { error: "AI service configuration error" },
          { status: 500 },
        );
      }
      return NextResponse.json(
        { error: "AI service unavailable" },
        { status: 502 },
      );
    }

    console.error("Response generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
