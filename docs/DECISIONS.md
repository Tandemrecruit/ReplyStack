# Architecture Decision Records (ADR)

This document logs key architectural and product decisions for ReplyStack.

---

## ADR-001: Next.js 15 with App Router

**Status:** Accepted

### Context

Need full-stack framework for rapid development.

### Decision

Next.js 15 with App Router over Pages Router or separate backend.

### Rationale

- Server components reduce client JS
- API routes sufficient for our needs
- Unified codebase
- Excellent Vercel deployment

### Consequences

- Locked into React ecosystem
- Some learning curve for App Router patterns

---

## ADR-002: Supabase over Standalone Postgres + Auth

**Status:** Accepted

### Context

Need database and auth solution.

### Decision

Supabase (managed Postgres + Auth + Row Level Security).

### Rationale

- Faster setup
- Built-in Google OAuth support
- Generous free tier
- Can migrate to raw Postgres later if needed

### Consequences

- Some vendor lock-in, but standard Postgres underneath

---

## ADR-003: Claude Sonnet over GPT-5.2 for Response Generation

**Status:** Accepted

### Context

Need high-quality, natural-sounding responses for business review replies.

### Decision

Claude Sonnet 4 via Anthropic API.

### Rationale

- More natural, human-sounding tone for business communication (multiple sources cite this as Claude's strength)
- More consistent and predictable response quality
- We're already building with Claude tools (familiarity)
- GPT-5.2 is cheaper ($1.75/$14 vs $3/$15 per MTok) but the cost difference is negligible at our scale (~$0.003/response)
- GPT-5.2 excels at math/reasoning which isn't our primary use case

### Tradeoffs

- Paying ~40% more on input tokens
- Could revisit if costs become material at scale

### Consequences

- Single AI vendor dependency
- Could add GPT-5.2 fallback if quality issues emerge or costs become significant

---

## ADR-004: Manual Approval as Default

**Status:** Accepted

### Context

Should AI responses auto-publish or require approval?

### Decision

Default to manual approval, auto-respond as opt-in feature in Phase 2.

### Rationale

- Builds trust with new users
- Prevents embarrassing mistakes
- Can relax later

### Consequences

- More friction in daily use, but safer for reputation

---

## ADR-005: Single Pricing Tier for MVP

**Status:** Accepted

### Context

Launch with tiered pricing or single tier?

### Decision

Single $49/month tier for MVP launch.

### Rationale

- Reduces decision friction for buyers
- Simplifies billing implementation
- Can add tiers based on actual usage patterns

### Consequences

- May leave money on table from power users
- Revisit in Phase 2

---

## ADR-006: Upgrade to Next.js 16 (React 19, Tailwind v4)

**Status:** Accepted

### Context

Framework/tooling versions advanced; we want current React features and Tailwind v4 defaults while retaining App Router.

### Decision

Upgrade to Next.js 16 with React 19 and Tailwind CSS v4, keeping App Router and existing project structure.

### Rationale

- Align with current Next.js/React improvements and bug fixes.
- Tailwind v4 simplifies config and reduces CSS payloads.
- Minimal migration effort given early-stage codebase.

### Consequences

- Need to keep pace with evolving React 19 semantics.
- Tailwind v4 requires verifying class compatibility during feature work.

---

## Template for New Decisions

```markdown
## ADR-XXX: [Title]

**Status:** Proposed | Accepted | Deprecated | Superseded

### Context

[What is the issue that we're seeing that is motivating this decision?]

### Decision

[What is the change that we're proposing and/or doing?]

### Rationale

[Why is this the best choice? What alternatives were considered?]

### Consequences

[What are the positive and negative implications of this decision?]
```
