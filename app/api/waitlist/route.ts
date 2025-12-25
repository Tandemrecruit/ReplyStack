import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Valid review volume options for the waitlist form
 */
const VALID_REVIEW_VOLUMES = [
  "less_than_10",
  "10_to_50",
  "50_to_100",
  "100_plus",
] as const;

type ReviewVolume = (typeof VALID_REVIEW_VOLUMES)[number];

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Handle POST /api/waitlist to add a new waitlist signup.
 *
 * This is a PUBLIC endpoint - no authentication required.
 * Accepts email and review_volume in the request body.
 *
 * @param request - NextRequest with JSON body containing email and review_volume
 * @returns On success: { success: true }
 *          On error: { error: string } with appropriate HTTP status
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Parse request body
    const body = await request.json();
    const { email, review_volume } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    if (!review_volume) {
      return NextResponse.json(
        { error: "Review volume is required" },
        { status: 400 },
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Validate review_volume is one of the allowed values
    if (!VALID_REVIEW_VOLUMES.includes(review_volume as ReviewVolume)) {
      return NextResponse.json(
        { error: "Invalid review volume selection" },
        { status: 400 },
      );
    }

    // Insert into waitlist
    const { error: insertError } = await supabase.from("waitlist").insert({
      email: email.toLowerCase().trim(),
      review_volume,
    });

    if (insertError) {
      // Handle unique constraint violation gracefully (user already on waitlist)
      if (insertError.code === "23505") {
        // Return success - don't reveal if email already exists
        return NextResponse.json({ success: true });
      }

      console.error("Failed to add to waitlist:", insertError.message);
      return NextResponse.json(
        { error: "Failed to join waitlist. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
