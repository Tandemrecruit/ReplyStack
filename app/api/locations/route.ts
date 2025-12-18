import type { SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  fetchAccounts,
  fetchLocations,
  GoogleAPIError,
  refreshAccessToken,
} from "@/lib/google/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Database,
  LocationInsert,
  LocationUpdate,
  OrganizationInsert,
  UserUpdate,
} from "@/lib/supabase/types";

/**
 * Location data returned from the API with sync status
 */
interface LocationWithStatus {
  id?: string;
  google_account_id: string;
  google_location_id: string;
  name: string;
  address: string;
  account_name: string;
  is_synced: boolean;
}

/**
 * User data with Google refresh token and organization ID
 */
interface UserData {
  google_refresh_token: string | null;
  organization_id: string | null;
}

/**
 * User data with organization ID only
 */
interface UserOrgData {
  organization_id: string | null;
}

/**
 * Synced location data from database
 */
interface SyncedLocation {
  id: string;
  google_location_id: string;
}

/**
 * New organization data
 */
interface NewOrg {
  id: string;
}

/**
 * Typed helper for Supabase insert operations.
 * Uses type assertion internally to work around Supabase's complex generic inference limitations.
 */
function typedInsert<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  values: Database["public"]["Tables"][T]["Insert"],
) {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Supabase's complex generic inference
  return supabase.from(table).insert(values as any);
}

/**
 * Typed helper for Supabase update operations.
 * Uses type assertion internally to work around Supabase's complex generic inference limitations.
 */
function typedUpdate<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  values: Database["public"]["Tables"][T]["Update"],
) {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Supabase's complex generic inference
  return supabase.from(table).update(values as any);
}

/**
 * Typed helper for Supabase upsert operations.
 * Uses type assertion internally to work around Supabase's complex generic inference limitations.
 */
function typedUpsert<T extends keyof Database["public"]["Tables"]>(
  supabase: SupabaseClient<Database>,
  table: T,
  values:
    | Database["public"]["Tables"][T]["Insert"]
    | Database["public"]["Tables"][T]["Insert"][],
  options?: { onConflict?: string; ignoreDuplicates?: boolean },
) {
  // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed due to Supabase's complex generic inference
  return supabase.from(table).upsert(values as any, options);
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

    // Type assertion: userData is guaranteed to exist after the check above
    const typedUserData = userData as UserData;

    if (!typedUserData.google_refresh_token) {
      return NextResponse.json(
        {
          error: "Google account not connected",
          code: "GOOGLE_NOT_CONNECTED",
        },
        { status: 400 },
      );
    }

    // Get access token
    const accessToken = await refreshAccessToken(
      typedUserData.google_refresh_token,
    );

    // Fetch accounts from Google
    const accounts = await fetchAccounts(accessToken);

    // Fetch locations for each account
    const allLocations: LocationWithStatus[] = [];

    const locationResults = await Promise.allSettled(
      accounts.map((account) => fetchLocations(accessToken, account.accountId)),
    );

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      if (!account) continue;
      const result = locationResults[i];
      if (!result || result.status !== "fulfilled") continue;
      for (const location of result.value) {
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
    if (typedUserData.organization_id && allLocations.length > 0) {
      const { data: syncedLocations } = await supabase
        .from("locations")
        .select("id, google_location_id")
        .eq("organization_id", typedUserData.organization_id)
        .eq("is_active", true);

      // Type assertion: syncedLocations is an array of objects with id and google_location_id
      const typedSyncedLocations = (syncedLocations ?? []) as SyncedLocation[];

      const syncedMap = new Map<string, string>();
      for (const loc of typedSyncedLocations) {
        syncedMap.set(loc.google_location_id, loc.id);
      }

      for (const location of allLocations) {
        const dbId = syncedMap.get(location.google_location_id);
        if (dbId) {
          location.is_synced = true;
          location.id = dbId;
        }
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
 * Upserts the provided locations into the user's organization and returns the saved records.
 *
 * If the authenticated user has no organization, one is created and the user is associated with it.
 *
 * @param request - Request whose JSON body must contain a `locations` array of location objects to save
 * @returns JSON object with `saved` (number of saved locations) and `locations` (array of saved location records)
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

    // Parse and validate request body before any organization creation
    let body: SaveLocationsBody;
    try {
      body = (await request.json()) as SaveLocationsBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body: JSON parsing failed" },
        { status: 400 },
      );
    }

    if (!body || !body.locations || !Array.isArray(body.locations)) {
      return NextResponse.json(
        { error: "Invalid request body: locations array required" },
        { status: 400 },
      );
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

    // Type assertion: userData is guaranteed to exist after the check above
    const typedUserData = userData as UserOrgData;

    // Create organization if user doesn't have one (only after validation passes)
    let organizationId = typedUserData.organization_id;

    if (!organizationId) {
      const orgData: OrganizationInsert = {
        name: user.email ?? "My Organization",
      };
      const { data: newOrg, error: orgError } = await typedInsert(
        supabase,
        "organizations",
        orgData,
      )
        .select("id")
        .single();

      if (orgError || !newOrg) {
        console.error("Failed to create organization:", orgError?.message);
        return NextResponse.json(
          { error: "Failed to create organization" },
          { status: 500 },
        );
      }

      // Type assertion: newOrg is guaranteed to exist after the check above
      const typedNewOrg = newOrg as NewOrg;
      organizationId = typedNewOrg.id;

      // Link user to organization
      const { error: updateError } = await typedUpdate(supabase, "users", {
        organization_id: organizationId,
      } satisfies UserUpdate).eq("id", user.id);

      if (updateError) {
        console.error(
          "Failed to link user to organization:",
          updateError.message,
          { organizationId, userId: user.id },
        );

        // Roll back: delete the created organization
        const { error: deleteError } = await supabase
          .from("organizations")
          .delete()
          .eq("id", organizationId);

        if (deleteError) {
          console.error(
            "Failed to roll back organization creation:",
            deleteError.message,
            { organizationId },
          );
        }

        return NextResponse.json(
          { error: "Failed to link user to organization" },
          { status: 500 },
        );
      }
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
    const { data: savedLocations, error: saveError } = await typedUpsert(
      supabase,
      "locations",
      locationsToSave,
      {
        onConflict: "organization_id,google_location_id",
        ignoreDuplicates: false,
      },
    ).select();

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
 * Deactivate a location associated with the authenticated user's organization.
 *
 * Expects a JSON body with a `location_id` string and sets `is_active` to `false`
 * for that location within the user's organization.
 *
 * @param request - Request whose JSON body must include `{ location_id: string }`
 * @returns `{ success: true }` on success; on failure returns an error message and an appropriate HTTP status:
 * - 401 if the user is not authenticated
 * - 404 if the user's organization is not found or the location doesn't exist or doesn't belong to the organization
 * - 400 if `location_id` is missing
 * - 500 for database or unexpected server errors
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

    // Type assertion: userData type not properly inferred from Supabase query
    const typedUserData = userData as UserOrgData | null;

    if (userError || !typedUserData?.organization_id) {
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

    // Verify location exists and belongs to the organization
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id")
      .eq("id", body.location_id)
      .eq("organization_id", typedUserData.organization_id)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    // Deactivate the location
    const { error: updateError } = await typedUpdate(supabase, "locations", {
      is_active: false,
    } satisfies LocationUpdate)
      .eq("id", body.location_id)
      .eq("organization_id", typedUserData.organization_id);

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
