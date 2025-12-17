import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Voice profile API: fetch and update the authenticated user's organization voice profile.
 *
 * GET  /api/voice-profile -> returns the current voice profile (or defaults when none exist)
 * PUT  /api/voice-profile -> upserts tone/personality/sign-off/max_length for the org
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      console.error("Failed to load user organization", userError);
      return NextResponse.json(
        { error: "Failed to load organization" },
        { status: 500 },
      );
    }

    if (!userRow?.organization_id) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 400 },
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("organization_id", userRow.organization_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load voice profile", profileError);
      return NextResponse.json(
        { error: "Failed to load voice profile" },
        { status: 500 },
      );
    }

    const fallback = {
      tone: "friendly",
      personality_notes: "",
      sign_off_style: "",
      max_length: 150,
    };

    return NextResponse.json({ profile: profile ?? fallback });
  } catch (error) {
    console.error("Voice profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to load voice profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      tone,
      personality_notes,
      sign_off_style,
      max_length,
    } = body as Record<string, unknown>;

    if (typeof tone !== "string" || !tone.trim()) {
      return NextResponse.json(
        { error: "tone is required" },
        { status: 400 },
      );
    }

    if (
      personality_notes !== undefined &&
      typeof personality_notes !== "string"
    ) {
      return NextResponse.json(
        { error: "personality_notes must be a string" },
        { status: 400 },
      );
    }

    if (sign_off_style !== undefined && typeof sign_off_style !== "string") {
      return NextResponse.json(
        { error: "sign_off_style must be a string" },
        { status: 400 },
      );
    }

    if (
      max_length !== undefined &&
      (typeof max_length !== "number" || !Number.isFinite(max_length))
    ) {
      return NextResponse.json(
        { error: "max_length must be a number" },
        { status: 400 },
      );
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (userError) {
      console.error("Failed to load user organization", userError);
      return NextResponse.json(
        { error: "Failed to load organization" },
        { status: 500 },
      );
    }

    if (!userRow?.organization_id) {
      return NextResponse.json(
        { error: "No organization found for user" },
        { status: 400 },
      );
    }

    const { data: existing, error: fetchProfileError } = await supabase
      .from("voice_profiles")
      .select("id")
      .eq("organization_id", userRow.organization_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fetchProfileError) {
      console.error("Failed to load voice profile", fetchProfileError);
      return NextResponse.json(
        { error: "Failed to load voice profile" },
        { status: 500 },
      );
    }

    const payload = {
      id: existing?.id,
      organization_id: userRow.organization_id,
      tone: tone.trim(),
      personality_notes: personality_notes?.toString() ?? "",
      sign_off_style: sign_off_style?.toString() ?? "",
      max_length: typeof max_length === "number" ? max_length : 150,
      name: "Default",
    };

    const { data: upserted, error: upsertError } = await supabase
      .from("voice_profiles")
      .upsert(payload)
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (upsertError) {
      console.error("Failed to upsert voice profile", upsertError);
      return NextResponse.json(
        { error: "Failed to save voice profile" },
        { status: 500 },
      );
    }

    return NextResponse.json({ profile: upserted ?? payload });
  } catch (error) {
    console.error("Voice profile PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save voice profile" },
      { status: 500 },
    );
  }
}

