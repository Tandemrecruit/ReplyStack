# Changelog

## 2025-12-17

- Wrapped `docs/SETUP.md` to satisfy MD013/MD032/MD012 and documented the setup
  lint convention in ADR-007.
- Document refresh to reflect scaffolding state: architecture, roadmap, spec.
- Added setup runbook, API overview, and changelog.
- Added ADR-006 for Next.js 16 / React 19 / Tailwind v4.
- Clarified README with development status and docs links.
- Removed decorative SVG title from reviews empty state to avoid redundant accessible name.
- Cleaned live demo star icons: rely on parent aria-hidden without per-star titles.
- Fixed MD031 in docstrings guide by adding blank lines before fenced code blocks.
- DRYed poll-reviews tests by centralizing CRON_SECRET save/restore in hooks.
- Simplified live demo tests by replacing redundant toBeTruthy assertions.
- Made live demo sample assertions use toBeInTheDocument for clarity.
- Added VoiceEditor tests for max_length initial value, updates, and edge cases.
- Replaced unsafe casts in Claude client test with typed Review/VoiceProfile fixtures.
- Tightened Google client test warn payload to match expected API base object.
- DRYed supabase middleware tests by centralizing env setup/teardown in hooks.
- Removed trailing blank line from smoke test to align with EOF conventions.
- Added new rules covering performance monitoring, accessibility, secrets, testing, migrations, feature flags, and architecture docs.

