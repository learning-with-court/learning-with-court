---
shipped: 2026-06-10
---

# Shipped: Single-plugin consolidation

One marketplace, one plugin. `setup-workshop` folded into `lwc` (now 3 skills: setup-workshop, workshop-orchestrator, lesson-runner); `plugins/learning-with-court/` deleted.

- PR #26 (feature → dev), PR #27 (dev → main promotion, `validate` green). Verified main serves `[('lwc', '0.6.0')]`, marketplace metadata 0.7.0.
- setup-workshop gained a **surface check**: in Cowork it routes the learner to the connector + workshop-orchestrator flow (never shell prose); Code behavior unchanged. Its frontmatter description now states the per-surface behavior.
- `lwc` plugin.json carries the `permissions.allow` block setup-workshop's Bash steps need.
- Code install copy is now `/plugin install lwc@learning-with-court` (README); landing copy needed no change (already single-plugin shaped).
- Workspace CLAUDE.md marketplace section updated in the workspace repo.

Operator follow-up (manual): refresh the marketplace in Code (`/plugin`), uninstall the orphaned `learning-with-court` plugin, install/keep `lwc`; re-sync the marketplace in Cowork and confirm one plugin with three skills.
