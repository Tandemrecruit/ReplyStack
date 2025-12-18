import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

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
interface ReviewWithLocation {
  id: string;
  external_review_id: string;
  reviewer_name: string | null;
  reviewer_photo_url: string | null;
  rating: number | null;
  review_text: string | null;
  review_date: string | null;
  has_response: boolean;
  status: string;
  sentiment: string | null;
  created_at: string;
  location_id: string | null;
  locations: ReviewLocation | null;
}

/**
 * Valid status filter values
 */
const VALID_STATUSES = ["pending", "responded", "ignored"] as const;

/**
 * Valid sentiment filter values
 */
const VALID_SENTIMENTS = ["positive", "neutral", "negative"] as const;

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

    // Type the reviews result
    const typedReviews: ReviewWithLocation[] | null = reviews;

    if (reviewsError) {
      console.error("Failed to fetch reviews:", reviewsError.message);
      return NextResponse.json(
        { error: "Failed to fetch reviews" },
        { status: 500 },
      );
    }

    // Transform reviews to include location name
    const transformedReviews = (typedReviews ?? []).map((review) => {
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
