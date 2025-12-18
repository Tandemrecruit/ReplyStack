import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  GoogleAPIError,
  publishResponse,
  refreshAccessToken,
} from "@/lib/google/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Request body for publishing a response
 */
interface PublishRequestBody {
  response_text: string;
}

/**
 * POST /api/reviews/[reviewId]/publish - Publish a response to Google Business Profile
 *
 * Takes the response text and publishes it as a reply to the review on Google.
 * Updates the review and response status in the database.
 *
 * @param request - Request with JSON body containing response_text
 * @param params - Route params containing reviewId
 * @returns JSON with success status or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  try {
    const { reviewId } = await params;
    const supabase = await createServerSupabaseClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization and Google refresh token
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, google_refresh_token")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.google_refresh_token) {
      return NextResponse.json(
        {
          error: "Google account not connected",
          code: "GOOGLE_NOT_CONNECTED",
        },
        { status: 400 },
      );
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: "No organization found" },
        { status: 400 },
      );
    }

    // Get the review and verify ownership via organization
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select(`
        id,
        external_review_id,
        location_id,
        has_response,
        locations!inner (
          id,
          google_account_id,
          google_location_id,
          organization_id
        )
      `)
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Type assertion for the joined location data
    const location = review.locations as unknown as {
      id: string;
      google_account_id: string;
      google_location_id: string;
      organization_id: string;
    };

    // Verify the review belongs to the user's organization
    if (location.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Parse request body
    const body = (await request.json()) as PublishRequestBody;

    if (!body.response_text || typeof body.response_text !== "string") {
      return NextResponse.json(
        { error: "response_text is required" },
        { status: 400 },
      );
    }

    const responseText = body.response_text.trim();
    if (responseText.length === 0) {
      return NextResponse.json(
        { error: "response_text cannot be empty" },
        { status: 400 },
      );
    }

    // Get access token
    let accessToken: string;
    try {
      accessToken = await refreshAccessToken(userData.google_refresh_token);
    } catch (error) {
      if (error instanceof GoogleAPIError && error.status === 401) {
        // Clear invalid token
        await supabase
          .from("users")
          .update({ google_refresh_token: null })
          .eq("id", user.id);

        return NextResponse.json(
          {
            error:
              "Google authentication expired. Please reconnect your account.",
            code: "GOOGLE_AUTH_EXPIRED",
          },
          { status: 401 },
        );
      }
      throw error;
    }

    // Publish response to Google
    try {
      await publishResponse(
        accessToken,
        location.google_account_id,
        location.google_location_id,
        review.external_review_id,
        responseText,
      );
    } catch (error) {
      if (error instanceof GoogleAPIError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      throw error;
    }

    // Update review status
    const { error: updateReviewError } = await supabase
      .from("reviews")
      .update({
        has_response: true,
        status: "responded",
      })
      .eq("id", reviewId);

    if (updateReviewError) {
      console.error(
        "Failed to update review status:",
        updateReviewError.message,
      );
    }

    // Upsert response record
    const { data: responseRecord, error: responseError } = await supabase
      .from("responses")
      .upsert(
        {
          review_id: reviewId,
          generated_text: responseText,
          final_text: responseText,
          status: "published",
          published_at: new Date().toISOString(),
        },
        { onConflict: "review_id" },
      )
      .select()
      .single();

    if (responseError) {
      console.error("Failed to save response record:", responseError.message);
    }

    return NextResponse.json({
      success: true,
      message: "Response published successfully",
      response_id: responseRecord?.id,
      published_at: responseRecord?.published_at,
    });
  } catch (error) {
    console.error("Publish response error:", error);
    return NextResponse.json(
      { error: "Failed to publish response" },
      { status: 500 },
    );
  }
}
