import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { decryptToken, TokenDecryptionError } from "@/lib/crypto/encryption";
import {
  fetchReviews,
  GoogleAPIError,
  refreshAccessToken,
} from "@/lib/google/client";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import { typedUpdate, typedUpsert } from "@/lib/supabase/typed-helpers";
import type { Database, ReviewInsert } from "@/lib/supabase/types";

/**
 * Maximum number of locations to process per cron invocation
 * to stay within rate limits and timeout constraints
 */
const MAX_LOCATIONS_PER_RUN = 50;

/**
 * Valid sentiment values for reviews
 */
type Sentiment = "positive" | "neutral" | "negative";

/**
 * Location data from database query
 */
interface LocationQueryResult {
  id: string;
  google_account_id: string;
  google_location_id: string;
  name: string;
  organization_id: string | null;
}

/**
 * User data from database query
 */
interface UserQueryResult {
  id: string;
  organization_id: string | null;
  google_refresh_token: string | null;
}

/**
 * Location with user data for polling
 */
interface LocationWithUser {
  id: string;
  google_account_id: string;
  google_location_id: string;
  name: string;
  user_id: string;
  google_refresh_token: string;
}

/**
 * Polls Google Business Profile for new reviews for active locations and upserts them into the database.
 *
 * This handler is intended to run as a cron job (configured to run regularly) and will:
 * - verify an optional cron secret for authorization,
 * - fetch active locations and associated users with Google refresh tokens,
 * - refresh access tokens per user and fetch reviews for each of their locations,
 * - upsert retrieved reviews (deduplicated by external_review_id) and infer sentiment from rating,
 * - clear expired refresh tokens for users if detected, and
 * - return accumulated metrics and any errors encountered.
 *
 * @returns A JSON NextResponse containing either a success payload with metrics (`locationsProcessed`, `reviewsProcessed`), `errors`, `duration`, and `timestamp`, or an error payload with an appropriate HTTP status (401 for unauthorized, 500 for failures).
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results = {
    locationsProcessed: 0,
    reviewsProcessed: 0,
    errors: [] as string[],
  };

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase: SupabaseClient<Database> = createAdminSupabaseClient();

    // Get all active locations with their users' refresh tokens
    // Join through organizations to get user data
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select(`
        id,
        google_account_id,
        google_location_id,
        name,
        organization_id
      `)
      .eq("is_active", true)
      .limit(MAX_LOCATIONS_PER_RUN);

    if (locationsError) {
      console.error("Failed to fetch locations:", locationsError.message);
      return NextResponse.json(
        { error: "Failed to fetch locations" },
        { status: 500 },
      );
    }

    if (!locations || locations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active locations to poll",
        ...results,
        duration: Date.now() - startTime,
      });
    }

    // Type assertion: locations is an array of LocationQueryResult
    const typedLocations = locations as LocationQueryResult[];

    // Get unique organization IDs
    const orgIds = [
      ...new Set(typedLocations.map((l) => l.organization_id).filter(Boolean)),
    ];

    // Get users with refresh tokens for these organizations
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, organization_id, google_refresh_token")
      .in("organization_id", orgIds)
      .not("google_refresh_token", "is", null);

    if (usersError) {
      console.error("Failed to fetch users:", usersError.message);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    // Type assertion: users is an array of UserQueryResult
    const typedUsers = (users ?? []) as UserQueryResult[];

    // Create a map of organization_id to user with refresh token
    // Keep the first user found per organization (deterministic behavior)
    const orgToUser = new Map<
      string,
      { id: string; google_refresh_token: string }
    >();
    for (const user of typedUsers) {
      if (user.organization_id && user.google_refresh_token) {
        if (!orgToUser.has(user.organization_id)) {
          orgToUser.set(user.organization_id, {
            id: user.id,
            google_refresh_token: user.google_refresh_token,
          });
        }
      }
    }

    // Build list of locations with user data
    const locationsWithUsers: LocationWithUser[] = [];
    for (const location of typedLocations) {
      if (!location.organization_id) continue;
      const user = orgToUser.get(location.organization_id);
      if (!user) continue;

      locationsWithUsers.push({
        id: location.id,
        google_account_id: location.google_account_id,
        google_location_id: location.google_location_id,
        name: location.name,
        user_id: user.id,
        google_refresh_token: user.google_refresh_token,
      });
    }

    // Group locations by user to minimize token refreshes
    const locationsByUser = new Map<string, LocationWithUser[]>();
    for (const location of locationsWithUsers) {
      const existing = locationsByUser.get(location.user_id) ?? [];
      existing.push(location);
      locationsByUser.set(location.user_id, existing);
    }

    // Process each user's locations
    for (const [userId, userLocations] of locationsByUser) {
      const firstLocation = userLocations[0];
      if (!firstLocation) continue;

      let accessToken: string;

      try {
        // Decrypt the stored refresh token
        let decryptedToken: string;
        try {
          decryptedToken = decryptToken(firstLocation.google_refresh_token);
        } catch (error: unknown) {
          if (error instanceof TokenDecryptionError) {
            console.error(
              `Failed to decrypt Google refresh token for user ${userId}:`,
              error.message,
            );
            results.errors.push(
              `User ${userId}: Token decryption failed - data may be corrupted`,
            );
            // Clear the corrupted token
            await typedUpdate(supabase, "users", {
              google_refresh_token: null,
            }).eq("id", userId);
            continue;
          }
          throw error;
        }

        // Get fresh access token for this user
        accessToken = await refreshAccessToken(decryptedToken);
      } catch (error: unknown) {
        const message =
          error instanceof GoogleAPIError
            ? error.message
            : "Token refresh failed";
        results.errors.push(`User ${userId}: ${message}`);

        // If token is expired, clear it from database
        if (error instanceof GoogleAPIError && error.status === 401) {
          await typedUpdate(supabase, "users", {
            google_refresh_token: null,
          }).eq("id", userId);
        }
        continue;
      }

      // Poll reviews for each location
      for (const location of userLocations) {
        try {
          const { reviews } = await fetchReviews(
            accessToken,
            location.google_account_id,
            location.google_location_id,
          );

          results.locationsProcessed++;

          if (reviews.length === 0) continue;

          // Prepare reviews for upsert with validation for external_review_id
          const reviewsToInsert: ReviewInsert[] = [];
          let skippedCount = 0;
          let syntheticIdCount = 0;

          for (const review of reviews) {
            let externalReviewId = review.external_review_id;

            // If external_review_id is missing, generate a stable unique ID
            if (!externalReviewId || externalReviewId.trim() === "") {
              // Require location_id, reviewer_name, and review_date to generate unique ID
              if (
                !location.id ||
                !review.reviewer_name ||
                !review.review_date
              ) {
                skippedCount++;
                console.warn(
                  `Skipping review for location ${location.name}: missing external_review_id and insufficient data to generate synthetic ID (location_id: ${location.id}, reviewer_name: ${review.reviewer_name ?? "null"}, review_date: ${review.review_date ?? "null"})`,
                );
                continue;
              }

              // Generate stable synthetic ID
              externalReviewId = generateSyntheticReviewId(
                location.id,
                review.reviewer_name,
                review.review_date,
              );
              syntheticIdCount++;
              console.log(
                `Generated synthetic external_review_id for review at location ${location.name}: ${externalReviewId}`,
              );
            }

            reviewsToInsert.push({
              location_id: location.id,
              platform: "google",
              external_review_id: externalReviewId,
              reviewer_name: review.reviewer_name ?? null,
              reviewer_photo_url: review.reviewer_photo_url ?? null,
              rating: review.rating ?? null,
              review_text: review.review_text ?? null,
              review_date: review.review_date ?? null,
              has_response: review.has_response ?? false,
              status: review.status ?? "pending",
              sentiment:
                review.rating != null
                  ? determineSentiment(review.rating)
                  : null,
            });
          }

          // Log summary if any reviews were skipped or got synthetic IDs
          if (skippedCount > 0 || syntheticIdCount > 0) {
            console.log(
              `Location ${location.name}: ${syntheticIdCount} reviews with synthetic IDs, ${skippedCount} reviews skipped`,
            );
          }

          // Skip upsert if no valid reviews to insert
          if (reviewsToInsert.length === 0) {
            continue;
          }

          // Upsert reviews (dedupe by external_review_id)
          const { data: upsertedReviews, error: upsertError } =
            await typedUpsert(supabase, "reviews", reviewsToInsert, {
              onConflict: "external_review_id",
              ignoreDuplicates: false,
            }).select("id");

          if (upsertError) {
            console.error(
              `Failed to upsert reviews for location ${location.id}:`,
              upsertError.message,
            );
            results.errors.push(
              `Location ${location.name}: Failed to save reviews`,
            );
          } else {
            // Count all processed reviews (includes both inserts and updates)
            results.reviewsProcessed += upsertedReviews?.length ?? 0;
          }
        } catch (error: unknown) {
          const message =
            error instanceof GoogleAPIError
              ? error.message
              : "Failed to fetch reviews";
          results.errors.push(`Location ${location.name}: ${message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Poll reviews cron job completed",
      ...results,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Poll reviews cron error:", error);
    return NextResponse.json(
      {
        error: "Cron job failed",
        ...results,
        duration: Date.now() - startTime,
      },
      { status: 500 },
    );
  }
}

/**
 * Generate a stable unique ID for a review missing external_review_id.
 * Uses SHA-256 hash of location_id + reviewer_name + review_date.
 *
 * @param locationId - The location ID
 * @param reviewerName - The reviewer's name (can be null)
 * @param reviewDate - The review date (can be null)
 * @returns A stable unique identifier prefixed with "synthetic_"
 */
function generateSyntheticReviewId(
  locationId: string,
  reviewerName: string | null | undefined,
  reviewDate: string | null | undefined,
): string {
  // Use length-prefixed encoding to avoid separator collisions
  // Each component is encoded as "<length>:<value>" and concatenated
  const components = [locationId ?? "", reviewerName ?? "", reviewDate ?? ""]
    .map((comp) => `${comp.length}:${comp}`)
    .join("");
  const hash = createHash("sha256").update(components).digest("hex");
  // Use first 32 chars of hash for readability, prefixed to indicate synthetic
  return `synthetic_${hash.slice(0, 32)}`;
}

/**
 * Map a numeric star rating to a sentiment label.
 *
 * @param rating - Star rating (typically 1–5)
 * @returns `"positive"` if `rating` is greater than or equal to 4, `"neutral"` if `rating` is greater than or equal to 3, `"negative"` otherwise
 */
function determineSentiment(rating: number): Sentiment {
  if (rating >= 4) return "positive";
  if (rating >= 3) return "neutral";
  return "negative";
}
