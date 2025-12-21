# Code Templates Index

## Usage

Before implementing a new feature, check this index to find relevant templates.
Read only the specific template file you need - do not load all templates.

**Workflow:**
1. Scan this index to find the template you need
2. Read only the specific template file (e.g., `docs/templates/api-routes.md`)
3. Navigate to the specific template section using the anchor link
4. Adapt the template for your use case

## Available Templates

| ID | Category | Description | File |
|---|---|---|---|
| `api-get-paginated` | API Routes | Protected GET endpoint with pagination and filtering | [api-routes.md](api-routes.md#api-get-paginated) |
| `api-post-validated` | API Routes | Protected POST endpoint with validation and auth | [api-routes.md](api-routes.md#api-post-validated) |
| `api-patch-delete` | API Routes | Protected PATCH/DELETE endpoint with ownership verification | [api-routes.md](api-routes.md#api-patch-delete) |
| `api-cron-job` | API Routes | Cron job endpoint with batch processing and metrics | [api-routes.md](api-routes.md#api-cron-job) |
| `component-form` | Components | Form component with validation and error handling | [components.md](components.md#component-form) |
| `component-display` | Components | Interactive display component with actions | [components.md](components.md#component-display) |
| `server-dashboard` | Server Components | Dashboard page with data fetching and auth redirect | [server-components.md](server-components.md#server-dashboard) |
| `db-org-scoped` | Database | Organization-scoped query pattern | [database.md](database.md#db-org-scoped) |
| `db-joined` | Database | Joined query with type safety | [database.md](database.md#db-joined) |
| `db-upsert` | Database | Upsert pattern for create/update operations | [database.md](database.md#db-upsert) |
| `pattern-error-api` | Patterns | API route error handling pattern | [patterns.md](patterns.md#pattern-error-api) |
| `pattern-error-client` | Patterns | Client component error handling pattern | [patterns.md](patterns.md#pattern-error-client) |
| `pattern-auth-api` | Patterns | Authentication verification in API routes | [patterns.md](patterns.md#pattern-auth-api) |
| `pattern-auth-server` | Patterns | Authentication verification in Server Components | [patterns.md](patterns.md#pattern-auth-server) |
| `pattern-auth-org` | Patterns | Get user organization pattern | [patterns.md](patterns.md#pattern-auth-org) |
| `pattern-constants` | Patterns | Common constants (pagination, status enums) | [patterns.md](patterns.md#pattern-constants) |
| `pattern-types` | Patterns | Common type definitions | [patterns.md](patterns.md#pattern-types) |

## Quick Reference by Use Case

### Building an API Route
- **GET with pagination**: `api-get-paginated`
- **POST with validation**: `api-post-validated`
- **PATCH/DELETE**: `api-patch-delete`
- **Cron job**: `api-cron-job`
- **Error handling**: `pattern-error-api`
- **Auth check**: `pattern-auth-api`

### Building a Form Component
- **Form with validation**: `component-form`
- **Error handling**: `pattern-error-client`

### Building a Dashboard Page
- **Server component**: `server-dashboard`
- **Auth redirect**: `pattern-auth-server`
- **Data fetching**: `db-org-scoped`

### Database Queries
- **Organization filtering**: `db-org-scoped`
- **Joins with types**: `db-joined`
- **Create or update**: `db-upsert`

## Notes

- All templates follow existing codebase patterns (Supabase, Next.js App Router, TypeScript)
- Templates include error handling, validation, and security patterns
- Replace placeholder names (e.g., `table_name`, `ResourceForm`) with actual names
- Maintain the structure - keep error handling, auth checks, and validation patterns
- Update JSDoc comments to reflect your specific implementation
