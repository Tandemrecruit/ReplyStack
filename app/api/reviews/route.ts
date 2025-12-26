import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Location data included in review queries
 */
interface ReviewLocation {
  id: string;
  name: string;
  google_location_id: string;
}

/**
 * Review with joined location data from Supabase query
 */
type Review = Database["public"]["Tables"]["reviews"]["Row"];

type ReviewWithLocation = Review & {
  locations: ReviewLocation | null;
};

/**
 * Valid status filter values
 */
const VALID_STATUSES = ["pending", "responded", "ignored"] as const;

/**
 * Valid sentiment filter values
 */
const VALID_SENTIMENTS = ["positive", "neutral", "negative"] as const;

/**
 * Type guard to validate that a value is a valid ReviewLocation
 */
function isValidReviewLocation(value: unknown): value is ReviewLocation {
  if (!value || typeof value !== "object") return false;
  const loc = value as Record<string, unknown>;
  return (
    typeof loc.id === "string" &&
    typeof loc.name === "string" &&
    typeof loc.google_location_id === "string"
  );
}

/**
 * Type guard to validate that a value is a valid ReviewWithLocation
 */
function isValidReviewWithLocation(
  value: unknown,
): value is ReviewWithLocation {
  if (!value || typeof value !== "object") return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.id === "string" &&
    typeof review.external_review_id === "string" &&
    (review.reviewer_name === null ||
      review.reviewer_name === undefined ||
      typeof review.reviewer_name === "string") &&
    (review.reviewer_photo_url === null ||
      review.reviewer_photo_url === undefined ||
      typeof review.reviewer_photo_url === "string") &&
    (review.rating === null ||
      review.rating === undefined ||
      typeof review.rating === "number") &&
    (review.review_text === null ||
      review.review_text === undefined ||
      typeof review.review_text === "string") &&
    (review.review_date === null ||
      review.review_date === undefined ||
      typeof review.review_date === "string") &&
    (review.has_response === null ||
      review.has_response === undefined ||
      typeof review.has_response === "boolean") &&
    (review.status === null ||
      review.status === undefined ||
      typeof review.status === "string") &&
    (review.sentiment === null ||
      review.sentiment === undefined ||
      typeof review.sentiment === "string") &&
    (review.created_at === null ||
      review.created_at === undefined ||
      typeof review.created_at === "string") &&
    (review.location_id === null ||
      review.location_id === undefined ||
      typeof review.location_id === "string") &&
    (review.platform === null ||
      review.platform === undefined ||
      typeof review.platform === "string") &&
    (review.locations === null ||
      review.locations === undefined ||
      isValidReviewLocation(review.locations))
  );
}

/**
 * Validates a raw Supabase query result and returns specific validation errors
 */
function getValidationErrors(raw: unknown): string[] {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") {
    return ["not an object"];
  }
  const review = raw as Record<string, unknown>;

  if (typeof review.id !== "string") {
    errors.push("missing or invalid id");
  }
  if (typeof review.external_review_id !== "string") {
    errors.push("missing or invalid external_review_id");
  }
  if (
    review.reviewer_name !== null &&
    review.reviewer_name !== undefined &&
    typeof review.reviewer_name !== "string"
  ) {
    errors.push("invalid reviewer_name type");
  }
  if (
    review.reviewer_photo_url !== null &&
    review.reviewer_photo_url !== undefined &&
    typeof review.reviewer_photo_url !== "string"
  ) {
    errors.push("invalid reviewer_photo_url type");
  }
  if (
    review.rating !== null &&
    review.rating !== undefined &&
    typeof review.rating !== "number"
  ) {
    errors.push("invalid rating type");
  }
  if (
    review.review_text !== null &&
    review.review_text !== undefined &&
    typeof review.review_text !== "string"
  ) {
    errors.push("invalid review_text type");
  }
  if (
    review.review_date !== null &&
    review.review_date !== undefined &&
    typeof review.review_date !== "string"
  ) {
    errors.push("invalid review_date type");
  }
  if (
    review.has_response !== null &&
    review.has_response !== undefined &&
    typeof review.has_response !== "boolean"
  ) {
    errors.push("invalid has_response type");
  }
  if (
    review.status !== null &&
    review.status !== undefined &&
    typeof review.status !== "string"
  ) {
    errors.push("invalid status type");
  }
  if (
    review.sentiment !== null &&
    review.sentiment !== undefined &&
    typeof review.sentiment !== "string"
  ) {
    errors.push("invalid sentiment type");
  }
  if (
    review.created_at !== null &&
    review.created_at !== undefined &&
    typeof review.created_at !== "string"
  ) {
    errors.push("invalid created_at type");
  }
  if (
    review.location_id !== null &&
    review.location_id !== undefined &&
    typeof review.location_id !== "string"
  ) {
    errors.push("invalid location_id type");
  }
  if (
    review.platform !== null &&
    review.platform !== undefined &&
    typeof review.platform !== "string"
  ) {
    errors.push("invalid platform type");
  }
  if (
    review.locations !== null &&
    review.locations !== undefined &&
    !isValidReviewLocation(review.locations)
  ) {
    errors.push("invalid locations object");
  }

  return errors;
}

/**
 * Maps raw Supabase query result to ReviewWithLocation with validation
 */
function mapToReviewWithLocation(raw: unknown): ReviewWithLocation | null {
  if (!isValidReviewWithLocation(raw)) {
    return null;
  }
  return {
    id: raw.id,
    external_review_id: raw.external_review_id,
    reviewer_name: raw.reviewer_name ?? null,
    reviewer_photo_url: raw.reviewer_photo_url ?? null,
    rating: raw.rating ?? null,
    review_text: raw.review_text ?? null,
    review_date: raw.review_date ?? null,
    has_response: raw.has_response ?? null,
    status: raw.status ?? null,
    sentiment: raw.sentiment ?? null,
    created_at: raw.created_at ?? null,
    location_id: raw.location_id ?? null,
    platform: raw.platform ?? null,
    locations: raw.locations
      ? {
          id: raw.locations.id,
          name: raw.locations.name,
          google_location_id: raw.locations.google_location_id,
        }
      : null,
  };
}

/**
 * Handle GET /api/reviews for the authenticated user's organization.
 *
 * Reads optional URL search parameters to filter and paginate reviews:
 * - status: Filter by review status (pending, responded, ignored)
 * - rating: Filter by star rating (1-5)
 * - sentiment: Filter by sentiment (positive, neutral, negative)
 * - location_id: Filter by specific location
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 *
 * @param request - Incoming NextRequest with optional search params
 * @returns A JSON object with reviews, total, page, and limit
 */
export async function GET(request: NextRequest) {
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

    // Handle user lookup failures
    if (userError) {
      console.error("Failed to lookup user:", userError.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle case where user doesn't exist in users table
    if (!userData) {
      console.error("User data not found for authenticated user:", user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle case where user exists but has no organization yet
    if (!userData.organization_id) {
      return NextResponse.json({
        reviews: [],
        total: 0,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
      });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const rating = searchParams.get("rating");
    const sentiment = searchParams.get("sentiment");
    const locationId = searchParams.get("location_id");
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "", 10) || DEFAULT_PAGE,
    );
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") ?? "", 10) || DEFAULT_LIMIT,
      ),
    );

    // Get location IDs for this organization
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("id")
      .eq("organization_id", userData.organization_id)
      .eq("is_active", true);

    if (locationsError) {
      console.error("Failed to fetch locations:", locationsError.message);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    const locationIds = locations?.map((l) => l.id) ?? [];

    if (locationIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        total: 0,
        page,
        limit,
      });
    }

    // Build query for reviews
    let query = supabase
      .from("reviews")
      .select(
        `
        id,
        external_review_id,
        reviewer_name,
        reviewer_photo_url,
        rating,
        review_text,
        review_date,
        has_response,
        status,
        sentiment,
        created_at,
        location_id,
        platform,
        locations!inner (
          id,
          name,
          google_location_id
        )
      `,
        { count: "exact" },
      )
      .in("location_id", locationIds)
      .order("review_date", { ascending: false, nullsFirst: false });

    // Apply filters
    if (
      status &&
      VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      query = query.eq("status", status);
    }

    if (rating) {
      const ratingNum = Number.parseInt(rating, 10);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query = query.eq("rating", ratingNum);
      }
    }

    if (
      sentiment &&
      VALID_SENTIMENTS.includes(sentiment as (typeof VALID_SENTIMENTS)[number])
    ) {
      query = query.eq("sentiment", sentiment);
    }

    if (locationId && locationIds.includes(locationId)) {
      query = query.eq("location_id", locationId);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: reviews, count, error: reviewsError } = await query;

    if (reviewsError) {
      console.error("Failed to fetch reviews:", reviewsError.message);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    // Map and validate reviews from Supabase query result
    const typedReviews: ReviewWithLocation[] = (reviews ?? [])
      .map((raw, index) => {
        const validationErrors = getValidationErrors(raw);
        if (validationErrors.length > 0) {
          // Extract safe identifiers (avoid logging sensitive content)
          const rawRow = raw as Record<string, unknown>;
          const reviewId =
            typeof rawRow.id === "string" ? rawRow.id : "unknown";
          const externalReviewId =
            typeof rawRow.external_review_id === "string"
              ? rawRow.external_review_id
              : "unknown";
          console.error(
            `Review validation failed [row ${index}, table: reviews, id: ${reviewId}, external_review_id: ${externalReviewId}]: ${validationErrors.join(", ")}`,
          );
          return null;
        }
        return mapToReviewWithLocation(raw);
      })
      .filter((review): review is ReviewWithLocation => review !== null);

    // Transform reviews to include location name
    const transformedReviews = typedReviews.map((review) => {
      return {
        id: review.id,
        external_review_id: review.external_review_id,
        reviewer_name: review.reviewer_name,
        reviewer_photo_url: review.reviewer_photo_url,
        rating: review.rating,
        review_text: review.review_text,
        review_date: review.review_date,
        has_response: review.has_response,
        status: review.status,
        sentiment: review.sentiment,
        created_at: review.created_at,
        location_id: review.location_id,
        platform: review.platform ?? "google",
        location_name: review.locations?.name ?? "Unknown Location",
      };
    });

    return NextResponse.json({
      reviews: transformedReviews,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Reviews API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
