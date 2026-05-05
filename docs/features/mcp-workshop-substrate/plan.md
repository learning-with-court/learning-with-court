---
started: 2026-05-05
---

# Implementation Plan: mcp-workshop Substrate Repo

## Overview

Build `learning-with-court-mcp-workshop-substrate` by **copying `~/GitHub/schuettc/claude-code-mcp-workshop`'s existing structure wholesale** and swapping its plugin-driven walker model for our hosted-MCP + hooks model.

mcp-workshop already has:
- All 13 lessons as working pnpm-workspace packages (`workshop/lesson_01_setup/`, ..., `workshop/lesson_13_shipping/`)
- A `workshop/shared/` package (test-client, narrate helpers, OAuth utils)
- Working `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`
- A `scripts/` directory with workshop tooling
- Per-lesson `verify.ts` files and `pnpm --filter @workshop/lesson-NN verify` invocations that already work

We don't need to redesign the source tree. We need to:

1. Copy the existing structure into our new repo.
2. Remove the existing plugin/ + .claude-plugin/ + .claude/settings.json — that was the cloned-repo walker model.
3. Drop in OUR `.claude/` config: level-aware SessionStart hook, PreToolUse edit-block hook (path regex matches `workshop/lesson_[0-9]+_*/src/`).
4. Drop in our `.mcp.json` pointing at the deployed workshop server (initial: `lwc-spike` until the dedicated stack exists).
5. Adjust the README to describe the new model.

The walker prose for each lesson lives in our hosted MCP server (chunks 4-6), not in this substrate. The substrate is "the complete codebase with each lesson's hands-on contribution removed" — but that's already what mcp-workshop's lesson packages do. Each `lesson_NN_*/src/` directory contains the *starter state* learners build from; the verify scripts assert the expected end state.

## Implementation Steps

### Setup

- [ ] Step 1: Create empty private GitHub repo `schuettc/learning-with-court-mcp-workshop-substrate`. (Orchestrator handles this.)
- [ ] Step 2: Clone the empty repo locally to `~/GitHub/schuettc/learning-with-court-mcp-workshop-substrate`.

### Bulk copy + prune

- [ ] Step 3: Copy these from mcp-workshop into the new repo, preserving structure:
  - `workshop/` — all 13 lesson directories + `shared/`
  - `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `tsconfig.base.json`
  - `scripts/` (workshop automation; keep as-is unless something references the old plugin model)
  - `.gitignore` (adjust if needed)
- [ ] Step 4: **Do NOT copy** these from mcp-workshop:
  - `plugin/` — the old cloned-repo walker model. Replaced by our hosted MCP + hooks.
  - `.claude-plugin/` — the old plugin manifest.
  - `.claude/settings.json` — the old enabledPlugins reference. We write our own.
  - `infra/` — mcp-workshop has a CDK app for its Phase C lessons. **Decision needed:** does our substrate ship `infra/` or does the learner create it during lesson 11? Lean toward "include it" since it's part of the cumulative final state. Confirm during execution.
- [ ] Step 5: Adjust the substrate's `package.json`:
  - Rename root from `claude-code-mcp-workshop` to `learning-with-court-mcp-workshop-substrate`.
  - Strip out plugin-related scripts (anything referencing `plugin/`).
  - Keep workspace + lesson scripts intact.
- [ ] Step 6: Adjust the substrate's `README.md`:
  - Drop mcp-workshop's plugin install/usage instructions.
  - Add a section like sample-substrate's README: "this is the substrate for the learning-with-court mcp-workshop. Once you've cloned it, `pnpm install`, then `claude` here. The deployed workshop server walks you through."
  - Document the per-lesson `pnpm --filter @workshop/lesson-NN verify` pattern.

### Layer our config

- [ ] Step 7: Add `.claude/settings.json` with the level-aware SessionStart hook + PreToolUse edit-block hook configuration (lifted from sample-substrate).
- [ ] Step 8: Write `.claude/hooks/session-start.sh`. Start from sample-substrate's post-adaptive-guidance version, but adjust the workshop-specific text:
  - Workshop name: "learning-with-court mcp-workshop"
  - Lesson count: "13 lessons across 3 phases (A: stdio basics, B: auth + HTTP, C: AWS deploy)"
  - Tools available: same as sample (`where_am_i`, `start_lesson`, `submit_verify_output`, `ping`)
  - Workshop rule for src/ edits: enforced via PreToolUse hook on `workshop/lesson_*/src/`
- [ ] Step 9: Write `.claude/hooks/block-edits.sh`. Start from sample-substrate's version, adjust the path regex from `(^|/)src/` to `workshop/lesson_[0-9]+_[^/]+/(src|tests)/` — matches mcp-workshop's existing per-lesson directory layout.
- [ ] Step 10: Make both hook scripts executable (`chmod +x`).
- [ ] Step 11: Add `.mcp.json` at the substrate root. Initial URL: `https://amd1bq5na7.execute-api.us-east-1.amazonaws.com/mcp` (the existing `lwc-spike` endpoint). When the mcp-workshop server gets its own stack, the `.mcp.json` URL gets swapped (separate concern; not this chunk).

### Verification

- [ ] Step 12: `pnpm install` succeeds.
- [ ] Step 13: `pnpm --filter @workshop/lesson-01-setup verify` succeeds (or pick whichever lesson is the simplest baseline — the smoke test is just "the existing verify scripts still work after the copy").
- [ ] Step 14: Run `bash .claude/hooks/session-start.sh` manually; confirm the workshop-orientation text appears, level block is conditional on `.claude/lwc-workshop.local.md`.
- [ ] Step 15: Smoke-test the PreToolUse hook script: feed it stdin simulating an `Edit` on `workshop/lesson_05_prompts/src/server.ts`; confirm it emits the deny block. Feed it a path like `tests/_helpers/foo.ts`; confirm it allows.
- [ ] Step 16: `git add -A && git commit && git push origin main`.

### Wiring (to be done in a later chunk)

- Walker prose for each lesson — chunks 4, 5, 6 (Phase A/B/C walker ports).
- Lesson `WorkshopDefinition` entries pointing `verifyCommand` at `pnpm --filter @workshop/lesson-NN verify`. Each lesson's `targetFiles` is `workshop/lesson_NN_*/src/*` etc.
- Adjusting `.mcp.json` to point at the dedicated mcp-workshop server stack once that exists. Today's substrate temporarily shares the `lwc-spike` endpoint; learners get the workshop content via the prompt definitions registered in chunks 4-6.

## Technical Decisions

### Keep parallel-packages structure (don't merge into single progressive package)

Earlier session work validated the *progressive* model on the sample workshop (one src/, one tests/, growing codebase). For mcp-workshop, **we keep mcp-workshop's existing 13-parallel-packages structure** because:

1. The existing 13 packages already work — `pnpm --filter @workshop/lesson-NN verify` is the established pattern.
2. Each lesson's package is independently runnable; learners can hop between lessons without reset gymnastics.
3. The "complete working code" property the user wanted is preserved — every lesson's package is complete and verifiable.
4. Re-shaping 13 packages into one progressive codebase is a meaningful redesign that risks breaking what works for marginal architectural cleanliness.

The earlier sample-workshop progressive shape was right *for that specific case* (2 lessons, fresh substrate from scratch). For 13 lessons of existing-and-working content, copy + layer is the right call.

### Path regex change in PreToolUse hook

Sample substrate blocks `(^|/)src/`. mcp-workshop's structure has `src/` inside each lesson's package — so `workshop/lesson_05_prompts/src/server.ts`, etc. The regex updates to `workshop/lesson_[0-9]+_[^/]+/(src|tests)/` to scope blocking to lesson source/tests while leaving `scripts/`, root configs, etc. editable. This matches mcp-workshop's existing `block-walker-actions.sh` pattern (which we're not copying — but the pattern is right).

### `infra/` directory disposition

mcp-workshop's existing `infra/` has the CDK app for Phase C deploy lessons. **Include it in the substrate** (don't strip). Reasons:
- Phase C lessons use it; learners need it present.
- Phase A/B learners ignore it; harmless.
- The "all complete code shipped" guidance suggests including it.

Re-evaluate during execution if there are mcp-workshop-specific elements in `infra/` (e.g., a deployed-stack name) that would conflict with our model.

### `.mcp.json` URL: temporary share with sample workshop

The mcp-workshop substrate's `.mcp.json` initially points at the existing `lwc-spike` Lambda. When chunks 4-6 (walker ports) author the actual mcp-workshop server, they may register the workshop in the existing Lambda OR provision a new stack. That's a chunk-4-onward concern. For chunk 3 alone, sharing the spike endpoint is fine — the substrate's other plumbing works regardless.

## Testing Strategy

Three smoke tests during this chunk:

1. **Existing verify scripts still work** — `pnpm --filter @workshop/lesson-01-setup verify` succeeds in the substrate after the copy. Confirms we didn't break anything during the rename/prune.
2. **SessionStart hook runs cleanly** — manually invoke the hook script; confirm the workshop-orientation block appears.
3. **PreToolUse hook blocks the right paths** — feed simulated Edit events; confirm `workshop/lesson_NN_*/src/*` blocks; confirm `tests/_helpers/*` allows.

End-to-end testing (CC session against the substrate, walker prose driving) is deferred to chunks 4-6 when walker prose exists.

## Risks & Mitigations

### Risk: mcp-workshop's structure has implicit dependencies on its plugin model

The `plugin/` we're not copying may have hooks or configs that lessons rely on (e.g., the existing `block-walker-actions.sh` may be path-equivalent to our new `block-edits.sh`). **Mitigation:** survey mcp-workshop's lesson scripts/configs before pruning; flag any references to `plugin/` or `.claude-plugin/` that need adjustment.

### Risk: `pnpm-lock.yaml` references plugin-related deps

mcp-workshop's lockfile may pin packages only the plugin needed. **Mitigation:** `rm pnpm-lock.yaml && pnpm install` after the copy + prune; let pnpm regenerate based on actual dependencies. If a lesson's tests then fail, that's a real signal of a dropped dep.

### Risk: License / attribution

mcp-workshop is your own private repo, so this is internal-to-internal copy with no license issues. **Mitigation:** none needed.

### Risk: Walker prose authors (chunks 4-6) want a different structure

If during chunk 4 it turns out the parallel-packages structure makes walker prose awkward (e.g., the walker keeps having to say "navigate to workshop/lesson_NN/" which annoys learners), we'd reshape. **Mitigation:** none upfront; we accept the risk in exchange for a much faster chunk 3. Reshape later if real friction surfaces.

## Out of scope (deferred)

- Walker prose (chunks 4-6).
- Provisioning a dedicated mcp-workshop server stack (today: shares `lwc-spike`).
- Changes to `infra/` content for AWS deploy lessons (mcp-workshop's existing CDK is fine; adjustments are a Phase C concern).
- Any redesign of mcp-workshop's existing test infrastructure or shared utilities — those work; leave them alone.
