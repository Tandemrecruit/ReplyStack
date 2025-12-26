# Database Query Templates

Templates for common Supabase database query patterns with organization scoping and type safety.

---

## Organization-Scoped Query {#db-org-scoped}

Template for querying data scoped to the user's organization.

```typescript
// Always verify user belongs to organization
const { data: userData } = await supabase
  .from("users")
  .select("organization_id")
  .eq("id", user.id)
  .single();

if (!userData?.organization_id) {
  // Handle no organization
}

// Query with organization filter
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("organization_id", userData.organization_id);
```

**Usage Notes:**
- Always filter by `organization_id` for multi-tenant data
- Use `.single()` when expecting one result
- Add additional filters, ordering, and pagination as needed
- Handle the case where user has no organization

**See also:** `pattern-auth-org`, `api-get-paginated`

---

## Joined Query with Type Safety {#db-joined}

Template for queries that join related tables with proper TypeScript typing.

```typescript
interface JoinedResource {
  id: string;
  name: string;
  related_table: {
    id: string;
    name: string;
  } | null;
}

const { data, error } = await supabase
  .from("table_name")
  .select(`
    id,
    name,
    related_table!left (
      id,
      name
    )
  `)
  .eq("organization_id", userData.organization_id)
  .single();

const typedData: JoinedResource | null = data;
```

**Usage Notes:**
- Use `!left` for left joins (optional relation)
- Use `!inner` for inner joins (required relation)
- Define TypeScript interfaces for joined data
- Use type assertion to get proper typing
- Adjust join type based on whether relation is required

**See also:** `db-org-scoped`

---

## Upsert Pattern {#db-upsert}

Template for create-or-update operations using upsert.

```typescript
const { data, error } = await supabase
  .from("table_name")
  .upsert(
    {
      id: existingId, // Include for update, omit for insert
      field1: value1,
      field2: value2,
    },
    {
      onConflict: "unique_field", // Column name for conflict resolution
    },
  )
  .select()
  .single();
```

**Usage Notes:**
- Include `id` in upsert data to update existing record
- Omit `id` to create new record
- Specify `onConflict` column for conflict resolution
- Use `.select().single()` to return the upserted record
- Consider using `typedUpsert` helper if available

**See also:** `api-post-validated`, `api-patch-delete`
