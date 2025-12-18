import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type VoiceProfileUpdate =
  Database["public"]["Tables"]["voice_profiles"]["Update"];

/**
 * Zod schema for validating PUT /api/voice-profile request body
 */
const updateVoiceProfileSchema = z.object({
  tone: z.string().optional(),
  personality_notes: z.string().optional(),
  sign_off_style: z.string().optional(),
  max_length: z.number().int().positive().optional(),
  words_to_use: z.array(z.string()).optional(),
  words_to_avoid: z.array(z.string()).optional(),
  example_responses: z.array(z.string()).optional(),
});

/**
 * Request body for PUT /api/voice-profile
 */
type UpdateVoiceProfileBody = z.infer<typeof updateVoiceProfileSchema>;

/**
 * Update the voice profile for the authenticated user's organization.
 *
 * If no voice profile exists, creates one. If one exists, updates it.
 *
 * @param request - Request whose JSON body contains voice profile fields to update
 * @returns JSON object with the updated voice profile, or error with appropriate status
 */
export async function PUT(request: NextRequest) {
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

    // Parse and validate request body
    let body: UpdateVoiceProfileBody;
    try {
      const rawBody = await request.json();
      const parseResult = updateVoiceProfileSchema.safeParse(rawBody);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 },
        );
      }
      body = parseResult.data;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body: JSON parsing failed" },
        { status: 400 },
      );
    }

    // Build update object with only provided fields
    const updateData: VoiceProfileUpdate = {};
    if (body.tone !== undefined) updateData.tone = body.tone;
    if (body.personality_notes !== undefined)
      updateData.personality_notes = body.personality_notes;
    if (body.sign_off_style !== undefined)
      updateData.sign_off_style = body.sign_off_style;
    if (body.max_length !== undefined) updateData.max_length = body.max_length;
    if (body.words_to_use !== undefined)
      updateData.words_to_use = body.words_to_use;
    if (body.words_to_avoid !== undefined)
      updateData.words_to_avoid = body.words_to_avoid;
    if (body.example_responses !== undefined)
      updateData.example_responses = body.example_responses;

    // Check if voice profile exists for this organization
    const { data: existingProfile } = await supabase
      .from("voice_profiles")
      .select("id")
      .eq("organization_id", userData.organization_id)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from("voice_profiles")
        .update(updateData)
        .eq("id", existingProfile.id)
        .eq("organization_id", userData.organization_id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating voice profile:", updateError);
        return NextResponse.json(
          { error: "Failed to update voice profile" },
          { status: 500 },
        );
      }

      return NextResponse.json(updatedProfile);
    }

    // Create new profile
    const { data: newProfile, error: createError } = await supabase
      .from("voice_profiles")
      .insert({
        organization_id: userData.organization_id,
        name: "Default",
        ...updateData,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating voice profile:", createError);
      return NextResponse.json(
        { error: "Failed to create voice profile" },
        { status: 500 },
      );
    }

    return NextResponse.json(newProfile);
  } catch (error) {
    console.error("Voice profile PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update voice profile" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/voice-profile - Fetch the voice profile for the authenticated user's organization
 *
 * @returns JSON object with the voice profile, or error with appropriate status
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

    if (userError || !userData || !userData.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Fetch voice profile
    const { data: profile, error: profileError } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("organization_id", userData.organization_id)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching voice profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch voice profile" },
        { status: 500 },
      );
    }

    // Return profile or null if none exists
    return NextResponse.json(profile ?? null);
  } catch (error) {
    console.error("Voice profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice profile" },
      { status: 500 },
    );
  }
}
