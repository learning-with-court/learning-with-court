---
id: docs-auth-update
name: Update READMEs + setup-workshop skill for Clerk auth + mcp-workshop
type: Enhancement
priority: P1
effort: Small
impact: Medium
created: 2026-05-05
---

# Docs + Skill Update for Auth and mcp-workshop

## Problem Statement

Four docs were authored before Clerk auth landed and before mcp-workshop was added to the catalog. They tell a now-incorrect story:

1. **Public README** — catalog lists only `sample`; status section says "single-user shared identity" (false now); doesn't mention the Clerk sign-in flow.
2. **Sample substrate README** — claims "no further setup needed" after `claude`; doesn't warn about the browser opening for OAuth.
3. **mcp-workshop substrate README** — same omissions.
4. **setup-workshop SKILL.md** — catalog lists only `sample`; the clone command is hardcoded for sample; the handoff doesn't tell the learner that a browser will open on first claude run.

A learner who follows current docs will:
- Think there's only one workshop.
- Be surprised when a browser opens.
- Wonder if they need a Clerk account (they do; sign-up is free on dev tenant).
- Have no easy reference for what's expected on first run.

## Proposed Solution

Five mechanical doc updates:

1. **Public README** (`learning-with-court/README.md`):
   - Add `mcp-workshop` row to the catalog table (13 lessons across 3 phases; substrate `schuettc/learning-with-court-mcp-workshop-substrate`).
   - Add a "First run: signing in" mini-section explaining what happens when they `claude` for the first time in any substrate (browser opens, Clerk sign-in/sign-up, JWT cached, subsequent sessions skip the dance until expiry).
   - Update the Status section to reflect today's reality: two workshops, Clerk auth live, dev environment running, prod environment pending.

2. **Sample substrate README** — add a one-paragraph "First run: signing in" subsection to the Setup section. Replace the misleading "no further setup needed" with accurate phrasing ("the workshop server requires sign-in via Clerk; CC will open a browser the first time you run a workshop tool").

3. **mcp-workshop substrate README** — same callout.

4. **setup-workshop SKILL.md**:
   - Update the workshop catalog (Step 1) to list both `sample` and `mcp-workshop`.
   - Make the clone command per-workshop via a small lookup table (workshop-id → repo-slug). Future workshops add one entry.
   - Add a single sentence in the Step 5 handoff: "the first time you run claude in the substrate, a browser will open for you to sign in to the workshop server (Clerk)."
   - Tweak the "Available workshops" section to include mcp-workshop's description (13 lessons, 3 phases).

5. **`learning-with-court/.claude-plugin/marketplace.json`** — update plugin description if it says "one workshop." (Quick check; trivial fix if needed.)

## Affected Areas

- `learning-with-court/README.md`
- `learning-with-court/plugin/skills/setup-workshop/SKILL.md`
- `learning-with-court/.claude-plugin/marketplace.json` (maybe)
- `learning-with-court-sample-substrate/README.md`
- `learning-with-court-mcp-workshop-substrate/README.md`

## What I'll need from you

Nothing. Pure documentation cleanup; no auth or infra changes.

## Blocked by

Nothing.
