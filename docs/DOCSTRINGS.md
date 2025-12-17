# Docstring Standards & Coverage (TS/JS + Python)

Purpose: keep exported/public code self-documenting and maintain at least 85% docstring coverage across TypeScript/JavaScript and Python. Enforcement is documentation-only (no CI failure), but teams should run the coverage checks below before merging.

## Scope & Coverage Rules
- Counted items: exported functions, classes, class methods, hooks, React components (server/client), API route handlers, utilities, and Python modules/classes/functions/methods.
- Target: 85% of counted items carry a docstring that follows the language style below.
- Exclusions: trivial re-exports, test helpers inside `__tests__`/`tests`, generated code, and private helpers marked with a leading underscore in Python.

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

## Python Standard (Google Style)
- Triple double quotes `"""` on functions, methods, classes, and modules.
- Structure:
  - Summary line (imperative).
  - Optional blank line + context/behavior notes.
  - Sections in order: Args, Returns, Raises, Examples (as needed).
- Keep descriptions behavioral; avoid restating types already present via hints.

### Python Examples

Utility (`python/src/example_module.py` pattern):
```python
def normalize(values: list[float]) -> list[float]:
    """Scale numeric values into 0..1; constant inputs map to zeros.

    Args:
        values: Sequence of numbers to scale.

    Returns:
        List of scaled values between 0.0 and 1.0 (empty list if input is empty).
    """
    ...
```

Class with methods:
```python
class ReviewFormatter:
    """Formats review data for downstream rendering."""

    def format(self, review: dict[str, str]) -> str:
        """Build a single-line summary of a review.

        Args:
            review: Mapping with keys 'rating' and 'text'.

        Returns:
            Summary string like "5★ — Great service".
        """
```

## Coverage Measurement (docs-only)
- Target: ≥85% docstring coverage across TS/JS and Python. Run locally; not enforced in CI.

### Python quick check (interrogate)
```bash
pip install --upgrade interrogate
interrogate python/src python/automation -c 85 --fail-under 0
```
`-c 85` highlights gaps; `--fail-under 0` keeps it informational.

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
- Python modules/classes/functions use Google-style docstrings with Args/Returns/Raises as needed.
- API handlers describe auth, inputs, side effects, and response shape.
- Added/changed code keeps overall coverage ≥85% (run checks above).

