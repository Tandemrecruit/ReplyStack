import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Manage notification preferences for the authenticated user.
 *
 * GET  /api/notifications -> returns { emailNotifications: boolean }
 * PUT  /api/notifications -> updates email notification preference
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

    const { data, error } = await supabase
      .from("notification_preferences")
      .select("email_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching notification preferences", error);
      return NextResponse.json(
        { error: "Failed to load notification preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      emailNotifications: data?.email_enabled ?? true,
    });
  } catch (error) {
    console.error("Notification preference GET error:", error);
    return NextResponse.json(
      { error: "Failed to load notification preferences" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { emailNotifications } = body as {
      emailNotifications?: unknown;
    };

    if (typeof emailNotifications !== "boolean") {
      return NextResponse.json(
        { error: "emailNotifications must be a boolean" },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        { user_id: user.id, email_enabled: emailNotifications },
        { onConflict: "user_id" },
      );

    if (error) {
      console.error("Error updating notification preferences", error);
      return NextResponse.json(
        { error: "Failed to update notification preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({ emailNotifications });
  } catch (error) {
    console.error("Notification preference PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 },
    );
  }
}

