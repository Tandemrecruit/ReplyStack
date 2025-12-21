# Server Component Templates

Templates for Next.js Server Components with data fetching and authentication.

---

## Dashboard Page with Data Fetching {#server-dashboard}

Template for a Server Component page that fetches data, handles authentication, and renders the UI.

```typescript
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Page Title | ReplyStack",
  description: "Page description",
};

/**
 * Server component that fetches data and renders the page.
 *
 * Automatically redirects unauthenticated users to login.
 *
 * @returns The JSX content for the page
 */
export default async function ResourcePage() {
  const supabase = await createServerSupabaseClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-foreground">Page Title</h1>
        <p className="text-foreground-secondary">
          Please complete your account setup.
        </p>
      </div>
    );
  }

  // Fetch data
  const { data: resources, error } = await supabase
    .from("table_name")
    .select("*")
    .eq("organization_id", userData.organization_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch resources:", error.message);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Page Title</h1>
        <p className="mt-1 text-foreground-secondary">
          Page description text
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {resources && resources.length > 0 ? (
          resources.map((resource) => (
            <div key={resource.id} className="p-4 bg-surface rounded-lg border">
              {/* Render resource */}
            </div>
          ))
        ) : (
          <p className="text-foreground-secondary">No resources found.</p>
        )}
      </div>
    </div>
  );
}
```

**Usage Notes:**
- Replace `ResourcePage` with your page component name
- Update metadata title and description
- Replace `table_name` with your actual table name
- Add additional data fetching queries as needed
- Customize the UI structure for your use case
- Add loading states if needed (use `loading.tsx` file)

**See also:** `pattern-auth-server`, `pattern-auth-org`, `db-org-scoped`
