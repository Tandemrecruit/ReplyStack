import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  fetchAccounts,
  fetchLocations,
  GoogleAPIError,
  refreshAccessToken,
} from "@/lib/google/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { LocationInsert } from "@/lib/supabase/types";

/**
 * Location data returned from the API with sync status
 */
interface LocationWithStatus {
  google_account_id: string;
  google_location_id: string;
  name: string;
  address: string;
  account_name: string;
  is_synced: boolean;
}

/**
 * GET /api/locations - Fetch available Google Business Profile locations
 *
 * Returns all locations from the user's connected Google accounts,
 * along with their sync status in the database.
 *
 * @returns JSON with `locations` array, or error with appropriate status
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

    // Get user's refresh token from database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("google_refresh_token, organization_id")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.google_refresh_token) {
      return NextResponse.json(
        {
          error: "Google account not connected",
          code: "GOOGLE_NOT_CONNECTED",
        },
        { status: 400 },
      );
    }

    // Get access token
    const accessToken = await refreshAccessToken(userData.google_refresh_token);

    // Fetch accounts from Google
    const accounts = await fetchAccounts(accessToken);

    // Fetch locations for each account
    const allLocations: LocationWithStatus[] = [];

    for (const account of accounts) {
      const locations = await fetchLocations(accessToken, account.accountId);

      for (const location of locations) {
        allLocations.push({
          google_account_id: location.google_account_id ?? account.accountId,
          google_location_id: location.google_location_id ?? "",
          name: location.name ?? "",
          address: location.address ?? "",
          account_name: account.name,
          is_synced: false,
        });
      }
    }

    // Check which locations are already synced
    if (userData.organization_id && allLocations.length > 0) {
      const { data: syncedLocations } = await supabase
        .from("locations")
        .select("google_location_id")
        .eq("organization_id", userData.organization_id)
        .eq("is_active", true);

      const syncedIds = new Set(
        syncedLocations?.map((l) => l.google_location_id) ?? [],
      );

      for (const location of allLocations) {
        location.is_synced = syncedIds.has(location.google_location_id);
      }
    }

    return NextResponse.json({ locations: allLocations });
  } catch (error) {
    if (error instanceof GoogleAPIError) {
      if (error.status === 401) {
        return NextResponse.json(
          {
            error: error.message,
            code: "GOOGLE_AUTH_EXPIRED",
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("Locations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

/**
 * Request body for POST /api/locations
 */
interface SaveLocationsBody {
  locations: Array<{
    google_account_id: string;
    google_location_id: string;
    name: string;
    address?: string;
  }>;
}

/**
 * POST /api/locations - Save selected locations to the database
 *
 * Upserts the provided locations into the database, linking them
 * to the user's organization.
 *
 * @param request - Request with JSON body containing locations array
 * @returns JSON with `saved` count and `locations` array, or error
 */
export async function POST(request: NextRequest) {
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

    // Create organization if user doesn't have one
    let organizationId = userData.organization_id;

    if (!organizationId) {
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: user.email ?? "My Organization" })
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("Failed to create organization:", orgError?.message);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 },
        );
      }

      organizationId = newOrg.id;

      // Link user to organization
      await supabase
        .from("users")
        .update({ organization_id: organizationId })
        .eq("id", user.id);
    }

    // Parse request body
    const body = (await request.json()) as SaveLocationsBody;

    if (!body.locations || !Array.isArray(body.locations)) {
      return NextResponse.json(
        { error: "Invalid request body: locations array required" },
        { status: 400 },
      );
    }

    // Prepare locations for upsert
    const locationsToSave: LocationInsert[] = body.locations.map((loc) => ({
      organization_id: organizationId,
      google_account_id: loc.google_account_id,
      google_location_id: loc.google_location_id,
      name: loc.name,
      address: loc.address ?? null,
      is_active: true,
    }));

    // Upsert locations (update if google_location_id exists for this org)
    const { data: savedLocations, error: saveError } = await supabase
      .from("locations")
      .upsert(locationsToSave, {
        onConflict: "organization_id,google_location_id",
        ignoreDuplicates: false,
      })
      .select();

    if (saveError) {
      console.error("Failed to save locations:", saveError.message);
      return NextResponse.json(
        { error: "Failed to save locations" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      saved: savedLocations?.length ?? 0,
      locations: savedLocations ?? [],
    });
  } catch (error) {
    console.error("Locations POST error:", error);
    return NextResponse.json(
      { error: "Failed to save locations" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/locations - Deactivate a location
 *
 * Sets is_active to false for the specified location.
 *
 * @param request - Request with JSON body containing location_id
 * @returns JSON with success status or error
 */
export async function DELETE(request: NextRequest) {
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

    if (userError || !userData?.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    // Parse request body
    const body = (await request.json()) as { location_id: string };

    if (!body.location_id) {
      return NextResponse.json(
        { error: "location_id required" },
        { status: 400 },
      );
    }

    // Deactivate the location
    const { error: updateError } = await supabase
      .from("locations")
      .update({ is_active: false })
      .eq("id", body.location_id)
      .eq("organization_id", userData.organization_id);

    if (updateError) {
      console.error("Failed to deactivate location:", updateError.message);
      return NextResponse.json(
        { error: "Failed to deactivate location" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Locations DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate location" },
      { status: 500 },
    );
  }
}
