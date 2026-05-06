---
shipped: 2026-05-06
---

# Shipped: Drop sample, rename mcp-workshop project repo, retire "substrate" wording

## What landed

Three concurrent cleanups, one feature:

1. **Sample workshop dropped entirely.**
   - `learning-with-court-sample-substrate` GH repo archived (read-only, ARCHIVED.md banner).
   - `learning-with-court-workshops/workshops/sample/` content deleted.
   - `LwcSpikeStack-Dev` CDK stack deleted via direct `aws cloudformation delete-stack` (cdk destroy couldn't see it after `bin/app.ts` was already cleaned). Old API URL `2u2sjic8hd.execute-api…` now NXDOMAIN.
   - Sample dep + handler entry + stack instantiation removed from `learning-with-court-platform`.

2. **mcp-workshop project repo renamed.**
   - GH: `learning-with-court-mcp-workshop-substrate` → `learning-with-court-mcp-workshop` (GitHub auto-redirects from old URL).
   - Local clone dir mv'd; `origin` remote URL updated; `git fetch` confirmed.
   - Repo description updated to drop "substrate" jargon.
   - mcp-workshop content's `companionRepo` (the lesson-content metadata that lives in `learning-with-court-workshops`) updated to point at the new name.

3. **Vocabulary sweep "substrate" → "project".**
   - Files updated: `learning-with-court/README.md`, `plugin/skills/setup-workshop/SKILL.md`, `.claude-plugin/marketplace.json`, `plugin/.claude-plugin/plugin.json`, `learning-with-court-mcp-workshop/README.md`, `learning-with-court-platform/README.md`.
   - `docs/features/*/` historical docs left alone (they reflect what was true at planning time).
   - Post-sweep `grep -i substrate` against user-facing files returns nothing.

## Concurrent adjustment

`docs/features/custom-domains/` plan + idea trimmed to drop the sample side. When custom-domains executes, only `mcp-dev.workshop.institute` (dev) and `mcp.workshop.institute` (prod) need to be wired.

## Verification

- **CloudFormation**: only `LwcMcpWorkshopStack-Dev` remains in dev.
- **Old sample URL**: `curl https://2u2sjic8hd.execute-api…/health` → DNS NXDOMAIN.
- **mcp-workshop URL**: `curl https://x6m3w4vs98.execute-api…/health` → 200.
- **GH repos**: sample-substrate `isArchived: true`; mcp-workshop-substrate redirects to mcp-workshop on view.
- **Type checks**: `pnpm typecheck` clean across platform after sample dep removal.

## Notes

- `cdk destroy` couldn't reach `LwcSpikeStack-Dev` because we already removed its instantiation from `bin/app.ts` before destroying. Direct `aws cloudformation delete-stack` is the right path when an in-CFN stack has been orphaned from its CDK app. Lesson for future cleanups: destroy via CDK *before* removing from `bin/app.ts`, or use direct CFN delete.
- The local `~/GitHub/schuettc/learning-with-court-sample-substrate/` clone is preserved on disk for reference. The user can delete it manually if/when they want.
