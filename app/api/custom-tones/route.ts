import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/custom-tones
 *
 * Fetches all custom tones for the authenticated user's organization.
 *
 * @returns JSON array of custom tones, or error with appropriate status
 */
export async function GET() {
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

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Fetch custom tones for organization
    const { data: customTones, error: tonesError } = await supabase
      .from("custom_tones")
      .select("id, name, description, enhanced_context, created_at")
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false });

    if (tonesError) {
      console.error("Error fetching custom tones:", tonesError);
      return NextResponse.json(
        { error: "Failed to fetch custom tones" },
        { status: 500 },
      );
    }

    // Normalize snake_case to camelCase at API boundary
    const normalizedTones = (customTones ?? []).map((tone) => ({
      id: tone.id,
      name: tone.name,
      description: tone.description,
      enhancedContext: tone.enhanced_context,
      createdAt: tone.created_at,
    }));

    return NextResponse.json(normalizedTones);
  } catch (error) {
    console.error("Custom tones GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom tones" },
      { status: 500 },
    );
  }
}
