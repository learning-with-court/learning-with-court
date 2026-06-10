---
id: single-plugin-consolidation
name: Consolidate the marketplace to a single plugin (fold setup-workshop into lwc)
type: Tech Debt
priority: P1
effort: Small
impact: High
created: 2026-06-10
---

# Consolidate the marketplace to a single plugin

## Problem Statement

The marketplace carries two plugins — `lwc` (workshop runtime, both surfaces) and `learning-with-court` (Code entry: setup-workshop). The split is inherited history from when they were two repos; the 2026-06-09 marketplace consolidation moved them verbatim into one marketplace without merging them.

The split buys exactly one thing: Cowork users who enable `lwc` never see setup-workshop, a skill that drives the host CLI and can't run in Cowork's sandbox. The cost is two plugins listed on every surface, "which one do I enable?" confusion, and doubled install copy.

## Proposed Solution

One plugin: `lwc`, carrying all three skills (setup-workshop, workshop-orchestrator, lesson-runner) plus the existing connector guidance.

- Move `plugins/learning-with-court/skills/setup-workshop/` → `plugins/lwc-workshops/skills/`
- Make setup-workshop **surface-aware**: in Cowork it redirects to the connector/orchestrator flow instead of walking the learner into host CLI commands
- Carry the old plugin's `permissions.allow` block into `lwc`'s plugin.json (setup-workshop's Bash steps need it)
- Delete `plugins/learning-with-court/`; remove its marketplace.json entry
- `lwc` → 0.6.0, marketplace metadata → 0.7.0
- Update README install copy (`/plugin install lwc@learning-with-court`)

Keep the name `lwc` (not `learning-with-court`): it's the plugin already enabled + connected in existing Cowork installs, so consolidating into it is the least disruptive direction.

## Validation

- `node scripts/validate-plugin.mjs` passes
- `validate` check green on the dev→main promotion PR
- Code: marketplace refresh shows one plugin (`lwc` 0.6.0) with three skills
- Cowork: marketplace re-sync shows one plugin; setup-workshop present but redirects

## Out of scope

- Landing-site copy (already single-plugin shaped: Cowork tab mentions only `lwc`; Code tab is CLI-only)
- Renaming the surviving plugin
