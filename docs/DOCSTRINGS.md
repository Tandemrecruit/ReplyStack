# Docstring Standards & Coverage (TS/JS)

Purpose: keep exported/public code self-documenting and maintain at least 85% docstring coverage across TypeScript/JavaScript. Enforcement is documentation-only (no CI failure), but teams should run the coverage checks below before merging.

## Scope & Coverage Rules
- Counted items: exported functions, classes, class methods, hooks, React components (server/client), API route handlers, and utilities.
- Target: 85% of counted items carry a docstring that follows the language style below.
- Exclusions: trivial re-exports, test helpers inside `__tests__`/`tests`, and generated code.

## TypeScript/JavaScript Standard (TSDoc)
- Use `/** ... */` blocks immediately above the declaration.
- First line: short imperative summary (≤90 chars). Add a blank line before longer details.
- Tags:
  - `@param name - description` (match the identifier; note optional/nullable behavior).
  - `@returns description` (omit when return type is `void`).
  - `@throws` when relevant.
  - `@remarks` for behavior/edge cases; `@example` for usage.
  - Prefer describing business behavior; avoid restating types.
- React components: describe purpose, key props, and side effects; mention server vs client when relevant.
- API handlers: document auth expectations, inputs (body/query), key side effects, and response shape/status.

### TS Examples

Utility (`lib/utils` style):

```ts
/**
 * Formats a review score into a human label.
 *
 * @param score - Rating from 1 to 5 (values outside range are clamped).
 * @returns Label such as "Excellent (5/5)".
 */
export function formatScore(score: number): string {
  const bounded = Math.min(Math.max(score, 1), 5);
  const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
  return `${labels[bounded - 1]} (${bounded}/5)`;
}
```

API route handler (`app/api/reviews/route.ts` pattern):

```ts
/**
 * Creates or updates a review record for the signed-in organization.
 *
 * Auth: Supabase session required; rejects anonymous requests.
 * Input (JSON body): { id?: string; rating: number; reviewer_name?: string; review_text?: string }
 * Side effects: Upserts Supabase row and triggers Claude prompt generation.
 *
+ * @returns JSON response with the persisted review.
 */
export async function POST(req: Request): Promise<Response> {
  // ...
}
```

React client component (props-focused):

```ts
/**
 * Renders a review card with sentiment-aware styling.
 *
 * @param review - Review to display, including rating and text.
 * @param onSelect - Invoked when the card is clicked.
 */
export function ReviewCard({ review, onSelect }: ReviewCardProps) {
  // ...
}
```

## Coverage Measurement (docs-only)
- Target: ≥85% docstring coverage across TS/JS. Run locally; not enforced in CI.

### TypeScript/JavaScript quick check (heuristic script)
Run a lightweight scan for exported symbols missing TSDoc (no deps required):

```bash
node - <<'NODE'
import fs from "fs";
import path from "path";

const roots = ["app", "components", "lib"];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      files.push(full);
    }
  }
}

roots.filter(fs.existsSync).forEach(walk);

let total = 0;
let documented = 0;

const docRegex = /\/\*\*[\s\S]*?\*\/\s*(export\s+)?(async\s+)?(function|const|class)/g;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const matches = [...src.matchAll(/(export\s+(async\s+)?function|export\s+class|export\s+const\s+\w+\s*=\s*(async\s*)?\(|export\s+default\s+function)/g)];
  total += matches.length;
  documented += [...src.matchAll(docRegex)].length;
}

const coverage = total ? Math.min(100, (documented / total) * 100) : 100;
console.log(`Docstring coverage: ${coverage.toFixed(1)}% (${documented}/${total})`);
NODE
```
Treat this as guidance—inspect files called out as missing docs and update them.

## Quick Checklist before merging
- TS/JS exported items have TSDoc blocks with summary, params, returns, and remarks for edge cases.
- API handlers describe auth, inputs, side effects, and response shape.
- Added/changed code keeps overall coverage ≥85% (run checks above).

