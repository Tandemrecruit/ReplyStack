# Common Patterns

Templates for error handling, authentication, constants, and type definitions.

---

## Error Handling Patterns

### API Route Error Handling {#pattern-error-api}

Template for error handling in API routes.

```typescript
try {
  // ... logic ...
} catch (error) {
  console.error("Operation failed:", error);
  return NextResponse.json(
    { error: "User-friendly error message" },
    { status: 500 },
  );
}
```

**Usage Notes:**
- Always log errors server-side with `console.error`
- Return user-friendly error messages (no stack traces)
- Use appropriate HTTP status codes
- Include context in error logs for debugging

**See also:** `api-get-paginated`, `api-post-validated`

---

### Client Component Error Handling {#pattern-error-client}

Template for error handling in client components.

```typescript
try {
  const response = await fetch("/api/endpoint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    setGeneralError(result.error || "An error occurred");
    return;
  }

  // Handle success
} catch {
  setGeneralError("An unexpected error occurred. Please try again.");
}
```

**Usage Notes:**
- Always check `response.ok` before processing
- Display user-friendly error messages
- Use state to manage error display
- Provide fallback error message for network errors

**See also:** `component-form`

---

## Authentication Patterns

### Verify Auth in API Route {#pattern-auth-api}

Template for verifying authentication in API routes.

```typescript
const supabase = await createServerSupabaseClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

**Usage Notes:**
- Always use `createServerSupabaseClient()` in API routes
- Return 401 status for unauthenticated requests
- Check auth before any business logic

**See also:** `api-get-paginated`, `api-post-validated`

---

### Verify Auth in Server Component {#pattern-auth-server}

Template for verifying authentication in Server Components.

```typescript
const supabase = await createServerSupabaseClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  redirect("/login");
}
```

**Usage Notes:**
- Always use `createServerSupabaseClient()` in Server Components
- Use `redirect()` from `next/navigation` for unauthenticated users
- Check auth before data fetching

**See also:** `server-dashboard`

---

### Get User Organization {#pattern-auth-org}

Template for getting the user's organization.

```typescript
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
```

**Usage Notes:**
- Always check for user existence
- Handle case where user has no organization
- Include `email` in select if needed for other operations
- Use appropriate error status codes

**See also:** `db-org-scoped`, `api-get-paginated`

---

## Common Constants {#pattern-constants}

Template for common constants used across the codebase.

```typescript
/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Valid status filter values
 */
const VALID_STATUSES = ["pending", "responded", "ignored"] as const;

/**
 * Valid sentiment filter values
 */
const VALID_SENTIMENTS = ["positive", "neutral", "negative"] as const;
```

**Usage Notes:**
- Use `as const` for literal type arrays
- Document constants with JSDoc comments
- Keep constants at the top of the file
- Use descriptive names

**See also:** `api-get-paginated`

---

## Type Definitions {#pattern-types}

Template for common type definitions.

```typescript
/**
 * Paginated API response type
 */
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Error response type
 */
interface ErrorResponse {
  error: string;
}

/**
 * Database query result with joined relation
 */
interface ResourceWithRelation {
  id: string;
  name: string;
  relation: {
    id: string;
    name: string;
  } | null;
}
```

**Usage Notes:**
- Use `interface` for object types
- Use generic types for reusable patterns (e.g., `PaginatedResponse<T>`)
- Document types with JSDoc comments
- Keep types in a shared location if used across files

**See also:** `db-joined`, `api-get-paginated`
