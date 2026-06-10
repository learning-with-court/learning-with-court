---
started: 2026-06-10
---

# Implementation Plan: Single-plugin consolidation

## Overview

Fold the `learning-with-court` plugin (setup-workshop) into `lwc`, making setup-workshop surface-aware so it behaves correctly when the unified plugin is enabled in Cowork.

## Implementation Steps

- [ ] Move `plugins/learning-with-court/skills/setup-workshop/` into `plugins/lwc-workshops/skills/`
- [ ] Add a Cowork surface guard to setup-workshop SKILL.md (frontmatter description + body section): in Cowork, redirect to the connector + workshop-orchestrator flow
- [ ] Merge `permissions.allow` from the old plugin.json into `plugins/lwc-workshops/.claude-plugin/plugin.json`; bump to 0.6.0; update description
- [ ] Delete `plugins/learning-with-court/`
- [ ] marketplace.json: remove the `learning-with-court` entry, bump `lwc` to 0.6.0 + description, metadata.version → 0.7.0
- [ ] Update README.md (plugin table, Code install step, repo layout section) and plugins/lwc-workshops/README.md (three skills)
- [ ] `node scripts/validate-plugin.mjs` green
- [ ] PR → dev, merge; dev→main promotion PR (validate runs here), merge
- [ ] Update workspace CLAUDE.md marketplace section (workspace repo, separate commit)

## Technical Decisions

- Surviving plugin is `lwc` — it's the one already enabled and connector-paired in existing Cowork installs; removing the never-enabled-in-Cowork plugin is the least disruptive direction.
- Surface-awareness is prose-level (the skill instructs the model to detect a sandboxed/Cowork environment and redirect), not code — there is no programmatic surface API in skills.

## Testing Strategy

Validator locally + the `validate` required check on the promotion PR; manual surface checks (Code `/plugin` refresh, Cowork marketplace re-sync) by Court after merge.

## Risks & Mitigations

- Existing Code install of the removed `learning-with-court` plugin goes orphaned on refresh → uninstall it; `lwc` 0.6.0 carries the same skill.
- setup-workshop triggering in Cowork ("I'd like to learn X") → the new guard makes that a feature: it routes the learner to the correct Cowork flow instead of being silently absent.
