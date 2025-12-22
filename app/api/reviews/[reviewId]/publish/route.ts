import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { decryptToken, TokenDecryptionError } from "@/lib/crypto/encryption";
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
    let body: PublishRequestBody;
    try {
      body = (await request.json()) as PublishRequestBody;
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

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

    // Decrypt and get access token
    let accessToken: string;
    try {
      let decryptedToken: string;
      try {
        decryptedToken = decryptToken(userData.google_refresh_token);
      } catch (error) {
        if (error instanceof TokenDecryptionError) {
          console.error(
            "Failed to decrypt Google refresh token for user:",
            user.id,
            error.message,
          );
          // Clear the corrupted token
          await supabase
            .from("users")
            .update({ google_refresh_token: null })
            .eq("id", user.id);

          return NextResponse.json(
            {
              error:
                "Google authentication data corrupted. Please reconnect your account.",
              code: "GOOGLE_AUTH_EXPIRED",
            },
            { status: 401 },
          );
        }
        throw error;
      }

      accessToken = await refreshAccessToken(decryptedToken);
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

    // Check for existing response to preserve generated_text
    const { data: existingResponse } = await supabase
      .from("responses")
      .select("id, generated_text")
      .eq("review_id", reviewId)
      .maybeSingle();

    const now = new Date().toISOString();

    // Determine if text was edited (only set edited_text if different from generated)
    const wasEdited = existingResponse
      ? responseText !== existingResponse.generated_text
      : false;

    // Update existing response or insert new one
    const { data: responseRecord, error: responseError } = existingResponse
      ? // Update existing response - preserve generated_text
        await supabase
          .from("responses")
          .update({
            edited_text: wasEdited ? responseText : null,
            final_text: responseText,
            status: "published",
            published_at: now,
          })
          .eq("id", existingResponse.id)
          .select()
          .single()
      : // Insert new response (edge case: direct publish without generate)
        await supabase
          .from("responses")
          .insert({
            review_id: reviewId,
            generated_text: responseText,
            final_text: responseText,
            status: "published",
            published_at: now,
          })
          .select()
          .single();

    if (responseError) {
      console.error("Failed to save response record:", responseError.message);
    }

    // Check for database update failures after successful Google publish
    const dbErrors: string[] = [];
    if (updateReviewError) {
      dbErrors.push("Failed to update review status");
    }
    if (responseError) {
      dbErrors.push("Failed to save response record");
    }

    if (dbErrors.length > 0) {
      // Response published to Google but database sync failed
      return NextResponse.json(
        {
          success: true,
          message: "Response published to Google, but database sync failed",
          warning: `Database inconsistency: ${dbErrors.join("; ")}. The response was published to Google but may not be reflected in the local database.`,
          response_id: responseRecord?.id,
          published_at: responseRecord?.published_at,
        },
        { status: 200 },
      );
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
