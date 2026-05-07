---
id: drop-sample-rename-project
name: Drop sample workshop, rename mcp-workshop project repo, retire "substrate" wording
type: Tech Debt
priority: P1
effort: Small
impact: Medium
created: 2026-05-06
---

# Drop sample, rename mcp-workshop project repo, retire "substrate" wording

## Problem Statement

Three small-but-related muddles in the platform's repo layout:

1. **Sample workshop has served its purpose.** It was the spike that proved the hosted-MCP + Clerk auth shape end-to-end. Going forward, mcp-workshop is the real workshop. Keeping sample around adds catalog clutter, an extra CDK stack, an extra GH repo, and a sample row in the setup-workshop catalog that confuses learners.

2. **Project repo has a confusing suffix.** `learning-with-court-mcp-workshop-substrate` reads as "the substrate of the mcp-workshop." But the repo *is* the mcp-workshop project — there's no separate "non-substrate" mcp-workshop. Naming it `learning-with-court-mcp-workshop` matches what it actually is.

3. **"Substrate" is jargon.** Across READMEs, the setup-workshop skill, and marketplace metadata, we lean on the word "substrate" to describe the project a learner clones. It's a confusing word for a non-technical learner. "Project" (or "workshop project") is clearer.

## Proposed Solution

Three concurrent cleanups:

1. **Drop sample entirely** — archive `learning-with-court-sample-substrate` GH repo; delete `workshops/sample/` content; destroy `LwcSpikeStack-Dev`; drop sample dep + import + stack instantiation from the platform; drop sample row from public README + setup-workshop catalog.
2. **Rename project repo** — `gh repo rename` from `-substrate` to `learning-with-court-mcp-workshop`; update local clone dir; update remote URL; sweep path references.
3. **Vocabulary sweep** — replace "substrate" with "project" (or "workshop project") in user-facing docs only. Internal architecture docs in `docs/features/*/` keep historical wording.

Custom-domains (in-progress) gets a small concurrent adjustment: drop the sample side from its plan; only mcp-workshop side remains.

## What I'll need from you

A fresh `aws sso login --profile learning-with-court` so the cdk destroy can run. The destroy is destructive (sample's Lambda + DDB table) but no production data lives there.

## Affected Areas

- `learning-with-court-sample-substrate` (archive)
- `learning-with-court-mcp-workshop-substrate` → `learning-with-court-mcp-workshop` (rename)
- `learning-with-court-platform` (drop sample dep, handler.ts, stack)
- `learning-with-court-workshops` (drop `workshops/sample/`, update mcp-workshop content's companionRepo refs)
- `learning-with-court` (README, setup-workshop SKILL, marketplace.json, plugin.json — vocabulary)
- `learning-with-court/docs/features/custom-domains/` (drop sample side from plan)

## Blocked by

User running `aws sso login` for the cdk destroy step.
