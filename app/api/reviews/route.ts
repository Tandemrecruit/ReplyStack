import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Handle GET /api/reviews for the authenticated user's organization.
 *
 * Reads optional URL search parameters (`status`, `rating`, `page`, `limit`) to filter and paginate reviews.
 *
 * @param request - Incoming NextRequest; its URL may include `status`, `rating`, `page`, and `limit` search params.
 * @returns A JSON object with `reviews` (array), `total` (number), `page` (number), and `limit` (number). On failure or when unauthenticated, returns a JSON `{ error: string }` with an appropriate HTTP status.
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

    // TODO: Implement review fetching with filters
    // Parse query params: status, rating, page, limit
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const rating = searchParams.get("rating");

    console.warn("Reviews API not yet implemented", { status, rating });

    return NextResponse.json({
      reviews: [],
      total: 0,
      page: 1,
      limit: 20,
    });
  } catch (error) {
    console.error("Reviews API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
