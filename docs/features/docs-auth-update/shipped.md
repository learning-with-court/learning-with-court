---
shipped: 2026-05-05
---

# Shipped: Docs + Skill Update for Auth and mcp-workshop

## What landed

Three PRs across three repos updating user-facing docs to match today's reality.

### `learning-with-court` (public, PR #10)

- **README.md:**
  - Added `mcp-workshop` row to the catalog (13 lessons across 3 phases).
  - New "First run: signing in" section explaining the browser OAuth dance, free Clerk sign-up, JWT caching, cross-machine progress preservation.
  - Rewrote Status: two workshops, Clerk auth live, dev environment deployed, prod pending. Dropped "single-user shared identity."
- **plugin/skills/setup-workshop/SKILL.md:**
  - Available workshops section now lists both `sample` and `mcp-workshop`.
  - Step 1 asks the user to clarify when "the workshop" is ambiguous (vs. defaulting to sample).
  - Step 4 introduces a workshop-id → repo-slug lookup so the right substrate gets cloned. Future workshops add one entry.
  - Step 5 handoff includes a first-run notice between "type 'hi'" and "progress is saved server-side" so learners know to expect the browser opening for sign-in.
- **`.claude-plugin/marketplace.json`** description rewritten from sample-only to catalog-aware.

### `learning-with-court-sample-substrate` (PR #5)

- **README.md:** replaced the misleading "no further setup needed" line with an accurate Clerk first-run callout (mentions the pre-configured oauth client_id, callback port 8080, browser sign-in, JWT caching).

### `learning-with-court-mcp-workshop-substrate` (PR #5)

- **README.md:** same Clerk first-run callout.

## What this prevents

Without these updates, a brand-new learner following the docs would:

- Think there's only one workshop (sample), missing the larger mcp-workshop curriculum.
- Be surprised when a browser opens unexpectedly on first claude run.
- Hit the OAuth flow without context — wonder if they need a Clerk account, where to sign up, what's expected.
- See an outdated Status section claiming auth and multi-tenant don't exist yet.

Now those gaps are closed. Anyone who reads the public README before starting will know the journey.

## What's still pending

- **Walking mcp-workshop end-to-end** (the `mcp-workshop-validation` feature). Server-side smoke tests passed; content-side e2e walk by you is still the validation.
- **Prod environment** (the `prod-environment` feature). Plan ready; awaits Clerk prod app provisioning.

Both unrelated to docs; this feature is closed.

## Pushed

- `learning-with-court` PR #10 (merged)
- `learning-with-court-sample-substrate` PR #5 (merged)
- `learning-with-court-mcp-workshop-substrate` PR #5 (merged)
