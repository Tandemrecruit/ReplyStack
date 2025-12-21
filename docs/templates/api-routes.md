# API Route Templates

Templates for Next.js App Router API routes with authentication, validation, and error handling.

---

## Protected GET Endpoint with Pagination {#api-get-paginated}

Template for a GET endpoint that returns paginated, filtered data scoped to the user's organization.

```typescript
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
 * Handle GET /api/resource for the authenticated user's organization.
 *
 * Reads optional URL search parameters to filter and paginate:
 * - filter_param: Filter by specific value
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 *
 * @param request - Incoming NextRequest with optional search params
 * @returns A JSON object with data, total, page, and limit
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

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.organization_id) {
      return NextResponse.json({
        data: [],
        total: 0,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
      });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const filterParam = searchParams.get("filter_param");
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

    // Build query
    let query = supabase
      .from("table_name")
      .select("*", { count: "exact" })
      .eq("organization_id", userData.organization_id)
      .order("created_at", { ascending: false });

    // Apply filters
    if (filterParam) {
      query = query.eq("filter_column", filterParam);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data, count, error } = await query;

    if (error) {
      console.error("Failed to fetch data:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
```

**Usage Notes:**
- Replace `table_name` with your actual table name
- Replace `filter_param` and `filter_column` with your filter logic
- Add additional filters as needed
- Adjust ordering column as needed

**See also:** `pattern-auth-api`, `pattern-error-api`, `db-org-scoped`

---

## Protected POST Endpoint with Validation {#api-post-validated}

Template for a POST endpoint that creates a new resource with validation and organization scoping.

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Handle POST /api/resource to create a new resource.
 *
 * Requires an authenticated user and a JSON body containing required fields.
 *
 * @param request - NextRequest whose JSON body must include required fields
 * @returns On success: a JSON object with the created resource.
 *          On error: a JSON object with `error` and an appropriate HTTP status.
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

    // Parse request body
    const body = await request.json();
    const { requiredField } = body;

    // Validate required fields
    if (!requiredField) {
      return NextResponse.json(
        { error: "requiredField is required" },
        { status: 400 },
      );
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("organization_id, email")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 400 },
      );
    }

    // Verify ownership/permissions if needed
    // (e.g., check if related resource belongs to organization)

    // Create resource
    const { data: newResource, error: createError } = await supabase
      .from("table_name")
      .insert({
        organization_id: userData.organization_id,
        required_field: requiredField,
        // ... other fields
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create resource:", createError.message);
      return NextResponse.json(
        { error: "Failed to create resource" },
        { status: 500 },
      );
    }

    return NextResponse.json(newResource, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 },
    );
  }
}
```

**Usage Notes:**
- Replace `requiredField` with your actual required fields
- Add validation logic for each field
- Replace `table_name` with your actual table name
- Add any additional business logic before/after insert

**See also:** `pattern-auth-api`, `pattern-error-api`, `pattern-auth-org`

---

## Protected PATCH/DELETE Endpoint {#api-patch-delete}

Template for PATCH or DELETE endpoints that update or delete resources with ownership verification.

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Handle PATCH /api/resource/[id] to update a resource.
 *
 * Requires an authenticated user and ownership verification.
 *
 * @param request - NextRequest with JSON body containing update fields
 * @param params - Route params containing resource id
 * @returns On success: updated resource. On error: error object with status.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify resource exists and belongs to organization
    const { data: resource, error: fetchError } = await supabase
      .from("table_name")
      .select("id, organization_id")
      .eq("id", id)
      .single();

    if (fetchError || !resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (resource.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse update body
    const body = await request.json();

    // Update resource
    const { data: updated, error: updateError } = await supabase
      .from("table_name")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update resource:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update resource" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 },
    );
  }
}

/**
 * Handle DELETE /api/resource/[id] to delete a resource.
 *
 * Same pattern as PATCH but uses .delete() instead of .update()
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // ... same auth and ownership verification as PATCH ...

    // Delete resource
    const { error: deleteError } = await supabase
      .from("table_name")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Failed to delete resource:", deleteError.message);
      return NextResponse.json(
        { error: "Failed to delete resource" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 },
    );
  }
}
```

**Usage Notes:**
- For DELETE, remove the `.select().single()` call
- Add any cascade delete logic if needed
- Consider soft deletes (update `deleted_at` instead of delete)

**See also:** `pattern-auth-api`, `pattern-error-api`, `pattern-auth-org`

---

## Cron Job Endpoint {#api-cron-job}

Template for scheduled cron job endpoints that process items in batches.

```typescript
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/server";

/**
 * Maximum number of items to process per cron invocation
 */
const MAX_ITEMS_PER_RUN = 50;

/**
 * Cron job handler for scheduled tasks.
 *
 * Verifies cron secret, processes items in batches, and returns metrics.
 *
 * @param request - NextRequest with optional Bearer token for cron secret
 * @returns JSON with success status, metrics, errors, duration, and timestamp
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results = {
    itemsProcessed: 0,
    errors: [] as string[],
  };

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Fetch items to process
    const { data: items, error: fetchError } = await supabase
      .from("table_name")
      .select("*")
      .eq("is_active", true)
      .limit(MAX_ITEMS_PER_RUN);

    if (fetchError) {
      console.error("Failed to fetch items:", fetchError.message);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No items to process",
        ...results,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Process items
    for (const item of items) {
      try {
        // Process item logic here
        results.itemsProcessed++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Item ${item.id}: ${errorMessage}`);
        console.error(`Failed to process item ${item.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Cron job failed",
        ...results,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
```

**Usage Notes:**
- Use `createAdminSupabaseClient()` for cron jobs (bypasses RLS)
- Adjust `MAX_ITEMS_PER_RUN` based on processing time limits
- Add rate limiting logic if calling external APIs
- Consider using a queue system for large-scale processing

**See also:** `pattern-error-api`
