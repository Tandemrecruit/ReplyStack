import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GenerateResponseButton } from "@/components/reviews/generate-response-button";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewsFilters } from "@/components/reviews/reviews-filters";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Reviews | ReplyStack",
  description: "View and respond to your Google Business reviews",
};

/**
 * Empty state icon for reviews page
 */
function EmptyStateIcon() {
  return (
    <div className="w-12 h-12 mx-auto rounded-full bg-background-secondary flex items-center justify-center">
      <svg
        className="w-6 h-6 text-foreground-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        role="img"
        aria-label="No reviews icon"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    </div>
  );
}

/**
 * Valid status filter values
 */
const VALID_STATUSES = ["pending", "responded", "ignored"] as const;

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
  has_response: boolean | null;
  status: string | null;
  sentiment: string | null;
  created_at: string | null;
  location_id: string | null;
  platform: string | null;
  locations: ReviewLocation | null;
}

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
      typeof review.reviewer_name === "string") &&
    (review.reviewer_photo_url === null ||
      typeof review.reviewer_photo_url === "string") &&
    (review.rating === null || typeof review.rating === "number") &&
    (review.review_text === null || typeof review.review_text === "string") &&
    (review.review_date === null || typeof review.review_date === "string") &&
    (review.has_response === null ||
      typeof review.has_response === "boolean") &&
    (review.status === null || typeof review.status === "string") &&
    (review.sentiment === null || typeof review.sentiment === "string") &&
    (review.created_at === null || typeof review.created_at === "string") &&
    (review.location_id === null || typeof review.location_id === "string") &&
    (review.platform === null || typeof review.platform === "string") &&
    (review.locations === null || isValidReviewLocation(review.locations))
  );
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
    reviewer_name: raw.reviewer_name,
    reviewer_photo_url: raw.reviewer_photo_url,
    rating: raw.rating,
    review_text: raw.review_text,
    review_date: raw.review_date,
    has_response: raw.has_response,
    status: raw.status,
    sentiment: raw.sentiment,
    created_at: raw.created_at,
    location_id: raw.location_id,
    platform: raw.platform,
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
 * Reviews page Server Component that fetches and displays Google Business reviews.
 *
 * Fetches reviews from Supabase filtered by the user's organization and optional
 * URL search params (status, rating). Renders ReviewCard components for each review
 * and provides functional filters via ReviewsFilters client component.
 *
 * @param searchParams - URL search parameters for filtering (status, rating)
 * @returns The JSX element representing the Reviews page
 */
export default async function ReviewsPage({
  searchParams,
}: {
  searchParams:
    | Promise<{ status?: string; rating?: string }>
    | { status?: string; rating?: string };
}) {
  const supabase = await createServerSupabaseClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  // Handle user lookup failures
  if (userError || !userData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-foreground-secondary">
          Unable to load your account information. Please try again later.
        </p>
      </div>
    );
  }

  // Handle case where user exists but has no organization yet
  if (!userData.organization_id) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-foreground-secondary">
          Please complete your account setup to view reviews.
        </p>
      </div>
    );
  }

  // Parse search params (handle both Promise and object for Next.js compatibility)
  const params =
    searchParams instanceof Promise ? await searchParams : searchParams;
  const status = params.status;
  const rating = params.rating;

  // Get location IDs for this organization
  const { data: locations, error: locationsError } = await supabase
    .from("locations")
    .select("id")
    .eq("organization_id", userData.organization_id)
    .eq("is_active", true);

  if (locationsError) {
    console.error("Failed to fetch locations:", locationsError.message);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-foreground-secondary">
          Failed to load locations. Please try again later.
        </p>
      </div>
    );
  }

  const locationIds = locations?.map((l) => l.id) ?? [];

  // If no active locations, return empty state early
  if (locationIds.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
            <p className="mt-1 text-foreground-secondary">
              View and respond to your Google Business reviews
            </p>
          </div>
          <ReviewsFilters
            currentStatus={status ?? null}
            currentRating={rating ?? null}
          />
        </div>
        <div className="p-12 bg-surface rounded-lg border border-border text-center">
          <EmptyStateIcon />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No reviews yet
          </h3>
          <p className="mt-2 text-foreground-secondary">
            Connect your Google Business Profile to start seeing reviews here.
          </p>
        </div>
      </div>
    );
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

  // Execute query
  const { data: reviews, error: reviewsError } = await query;

  if (reviewsError) {
    console.error("Failed to fetch reviews:", reviewsError.message);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
        <p className="text-foreground-secondary">
          Failed to load reviews. Please try again later.
        </p>
      </div>
    );
  }

  // Map and validate reviews from Supabase query result
  const typedReviews: ReviewWithLocation[] = (reviews ?? [])
    .map(mapToReviewWithLocation)
    .filter((review): review is ReviewWithLocation => review !== null);

  // Transform reviews to match Review type (remove location_name if present)
  const transformedReviews: Review[] = typedReviews.map((review) => ({
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
  }));

  const hasActiveFilters = Boolean(status || rating);
  const hasReviews = transformedReviews.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="mt-1 text-foreground-secondary">
            View and respond to your Google Business reviews
          </p>
        </div>

        {/* Filters */}
        <ReviewsFilters currentStatus={status} currentRating={rating} />
      </div>

      {/* Reviews List or Empty State */}
      {hasReviews ? (
        <div className="space-y-4">
          {transformedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              generateResponseButton={
                (review.status ?? "pending") === "pending" ? (
                  <GenerateResponseButton reviewId={review.id} />
                ) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="p-12 bg-surface rounded-lg border border-border text-center">
          <EmptyStateIcon />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {hasActiveFilters
              ? "No reviews match your filters"
              : "No reviews yet"}
          </h3>
          <p className="mt-2 text-foreground-secondary">
            {hasActiveFilters
              ? "Try adjusting your filters to see more reviews."
              : "Reviews will appear here once they are fetched from Google."}
          </p>
        </div>
      )}
    </div>
  );
}
