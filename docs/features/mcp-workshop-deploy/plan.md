---
started: 2026-05-05
---

# Implementation Plan: Deploy mcp-workshop on its own Lambda

## Overview

Provision a second Lambda + API Gateway + DynamoDB stack for `mcpWorkshop`, mirroring the existing `LwcSpikeStack` but registering the mcp-workshop content instead of sample. End result: two independent stacks, two URLs, two DDB tables. mcp-workshop substrate's `.mcp.json` updated to point at the new URL.

This unblocks chunk 7 (first-user-polish) — once `clerk-deploy-real` also lands, learners can actually walk the mcp-workshop end-to-end.

## Approach: light refactor + duplicate stack

Two refactor moves to keep the duplication minimal:

1. **Extract reusable pieces from `handler.ts`** into `packages/server/src/build-app.ts`. The MCP transport setup, the auth flow, the discovery routes — all generic. Each per-workshop handler becomes a thin entrypoint: `import buildApp; import workshop; export const handler = handle(buildApp({ workshop }))`.
2. **Extract a `WorkshopApiStack` construct** from the existing `LwcSpikeStack` into `packages/infra/lib/workshop-api-stack.ts` (it's already there but only used once). Parameterize it: takes a `workshop: WorkshopDefinition` (or an entry-point path) and a stack-name prefix; produces the Lambda + API + DDB.
3. **Two stacks in `bin/app.ts`:** `LwcSpikeStack` (registers sample) + `LwcMcpWorkshopStack` (registers mcp-workshop).

After this refactor, future workshop #3 deployments are one new line in `bin/app.ts`.

## Implementation Steps

- [x] Step 1: Extract `packages/server/src/build-app.ts`. Generic Hono app builder taking `{ workshop: WorkshopDefinition }`. Handles auth, discovery, MCP transport. Returns a Hono root app.

- [x] Step 2: Refactor existing `packages/server/src/handler.ts` to:
  ```ts
  import { sampleWorkshop } from "@lwc-workshops/sample";
  import { buildApp } from "./build-app.js";
  export const handler = handle(buildApp({ workshop: sampleWorkshop }));
  ```
  Tiny file. All logic moved to build-app.ts.

- [x] Step 3: Create `packages/server/src/handler-mcp-workshop.ts`:
  ```ts
  import { mcpWorkshop } from "@lwc-workshops/mcp-workshop";
  import { buildApp } from "./build-app.js";
  export const handler = handle(buildApp({ workshop: mcpWorkshop }));
  ```

- [x] Step 4: Add `@lwc-workshops/mcp-workshop` to `packages/server/package.json`'s dependencies (file: link, mirrors how sample is wired):
  ```json
  "@lwc-workshops/mcp-workshop": "file:../../../learning-with-court-workshops/workshops/mcp-workshop"
  ```

- [x] Step 5: Refactor `packages/infra/lib/workshop-api-stack.ts` into a parameterized construct. Takes:
  - `stackPrefix: string` (e.g., `"LwcSpike"` or `"LwcMcpWorkshop"`)
  - `entry: string` (path to the Lambda entry handler — `handler.ts` or `handler-mcp-workshop.ts`)
  - Standard CDK `StackProps`

  Produces: DDB table (named `${stackPrefix}-Sessions`), Lambda (named `${stackPrefix}-Mcp`), HTTP API (named `${stackPrefix}-Api`), all the existing CfnOutputs.

- [x] Step 6: Update `bin/app.ts` to instantiate two stacks:
  ```ts
  new WorkshopApiStack(app, "LwcSpikeStack", { ..., entry: "..../handler.ts" });
  new WorkshopApiStack(app, "LwcMcpWorkshopStack", { ..., entry: "..../handler-mcp-workshop.ts" });
  ```

- [x] Step 7: `pnpm typecheck` — must pass for both packages.

- [x] Step 8: `pnpm --filter @lwc/infra synth` — must pass; both stacks rendered in the CDK output.

- [x] Step 9: `AWS_PROFILE=learning-with-court pnpm --filter @lwc/infra cdk deploy --all --require-approval=never` — deploys both stacks. The existing LwcSpikeStack should update (it's now using the refactored handler.ts entry); the new LwcMcpWorkshopStack should create.

- [x] Step 10: Capture the new mcp-workshop API URL from CDK outputs. Should be of the form `https://<id>.execute-api.us-east-1.amazonaws.com`.

- [x] Step 11: Update `learning-with-court-mcp-workshop-substrate/.mcp.json`:
  ```json
  {
    "mcpServers": {
      "lwc-mcp-workshop": {
        "type": "http",
        "url": "https://<new-api-id>.execute-api.us-east-1.amazonaws.com/mcp"
      }
    }
  }
  ```
  Commit + push this update.

- [x] Step 12: Smoke test:
  - `curl <new-host>/health` → 200
  - `curl -i <new-host>/mcp -X POST -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' -H "Content-Type: application/json"` → 401 with WWW-Authenticate (because Clerk URLs are still PENDING; that's clerk-deploy-real's job).
  - `curl <new-host>/.well-known/oauth-protected-resource` → returns valid JSON (with PENDING in `authorization_servers`).

  All four well-known + 401-flow checks should pass against the new URL, just like they pass against the spike URL today.

- [x] Step 13: Smoke test the EXISTING spike stack still works (refactor didn't break it):
  - `curl https://amd1bq5na7.execute-api.us-east-1.amazonaws.com/health` → 200
  - Same 401 + discovery checks against the spike URL.

## Technical Decisions

### Refactor instead of pure-copy

I'm deliberately introducing a small refactor (`build-app.ts` + parameterized `WorkshopApiStack`) rather than copy-pasting the existing handler/stack. Reasons:
- Future workshop #3 should be a one-line addition. Copy-paste-then-modify-handler approach would mean three drifting copies after workshop #4.
- The refactor is low-risk: the LwcSpikeStack continues using the same DDB + Lambda + API names; CloudFormation sees an in-place update, not a replace.
- 30 minutes of refactor saves multiple hours of future divergence.

### Per-workshop DDB tables

Each stack gets its own DDB table (`LwcSpikeStack-Sessions`, `LwcMcpWorkshopStack-Sessions`). State for sample vs. mcp-workshop is naturally isolated. This is the simpler-now answer; if we later want cross-workshop progress (e.g., "you completed mcp-workshop's lesson 5; here's your sample workshop progress"), that's a future feature.

### Stack name convention

`LwcSpikeStack` is now slightly misnamed (not really a spike anymore), but renaming a CDK stack triggers a destroy+recreate cycle — destroys the DDB table, the Lambda, all session state. Not worth it. The new stack is `LwcMcpWorkshopStack` (clean name from the start). Future workshops follow `Lwc<WorkshopName>Stack`.

### Handler entry-point per workshop

Each Lambda's bundled code only includes its own workshop. The bundler (esbuild via `NodejsFunction`) traces from the entry; it doesn't pull in other workshops. This means each Lambda's bundle is smaller and changes to one workshop don't trigger redeploys of the other.

## Risks & Mitigations

### Risk: Refactor breaks the existing spike stack

The refactor touches `handler.ts` and `workshop-api-stack.ts` — both currently in production. **Mitigation:** Step 13 (smoke-test the spike still works post-deploy) is mandatory. If the existing spike stack breaks, roll back via `git revert` + redeploy. Low blast radius — only test users (you) on the spike today.

### Risk: file: dep resolution fails for the new mcp-workshop import

`@lwc-workshops/mcp-workshop` is added to platform/server's deps via file: link. pnpm needs to re-resolve. **Mitigation:** `pnpm install --force` after adding the dep; verify `pnpm-lock.yaml` updates.

### Risk: cdk deploy --all fails partway

If the spike stack updates successfully but the mcp-workshop stack fails to create, we have a half-finished deploy. **Mitigation:** CDK is idempotent — re-running `cdk deploy --all` after fixing whatever broke is safe. Each stack is independent.

### Risk: New Lambda has placeholder Clerk URLs

Same state as spike today — the Lambda will return 401-with-discovery, but the discovery doc points at PENDING. Real Clerk auth doesn't work yet. **Mitigation:** that's `clerk-deploy-real`'s job. This feature ships infrastructure-ready; auth follows.

## Out of scope

- Real Clerk URLs (`clerk-deploy-real` feature).
- E2E walker testing (depends on Clerk + first-user-polish).
- Custom domain on either Lambda.
- Cross-workshop progress sharing.
