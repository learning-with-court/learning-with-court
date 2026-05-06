---
shipped: 2026-05-05
prs:
  - platform: TBD
  - substrate: TBD
  - tracker: TBD
stacks:
  spike: https://amd1bq5na7.execute-api.us-east-1.amazonaws.com
  mcp-workshop: https://rzpsw0r016.execute-api.us-east-1.amazonaws.com
---

# Shipped: Deploy mcp-workshop on its own Lambda

## What landed

Two independent Lambda + API + DDB stacks now serve the two workshops:

| Stack | URL | Workshop | DDB |
|---|---|---|---|
| `LwcSpikeStack` | `https://amd1bq5na7.execute-api.us-east-1.amazonaws.com` | `sampleWorkshop` | `LwcSpike` (preserved) |
| `LwcMcpWorkshopStack` | `https://rzpsw0r016.execute-api.us-east-1.amazonaws.com` | `mcpWorkshop` | `LwcMcpWorkshop-Sessions` |

The refactor was lighter than a pure-copy: a parameterized `WorkshopApiStack` construct + a `buildApp()` factory that takes a `WorkshopDefinition`. Future workshops (workshop #3) are now one new line in `bin/app.ts`.

## Refactor highlights

- **`packages/server/src/build-app.ts`** — generic Hono root app builder; takes `{ workshop }`. Hosts auth, discovery, MCP transport, the route table.
- **`packages/server/src/handler.ts`** — collapsed to 5 lines. Imports `sampleWorkshop` + `buildApp`; exports the Lambda handler.
- **`packages/server/src/handler-mcp-workshop.ts`** — same shape; imports `mcpWorkshop`.
- **`packages/infra/lib/workshop-api-stack.ts`** — `WorkshopApiStack` construct with props `{ stackPrefix, entry, tableName?, functionName?, apiName?, tableConstructId? }`. Defaults derive from `stackPrefix`; the spike stack passes overrides preserving its existing CFN logical IDs (zero-replace deploy).
- **`packages/infra/bin/app.ts`** — instantiates both stacks. Spike stack's overrides keep its CloudFormation footprint identical; new stack uses defaults.

## Verification (all green)

`pnpm typecheck` passes both packages. `cdk synth` renders both stacks. `cdk deploy --all` succeeded — spike updated in-place (only Lambda asset hash + description changed); mcp-workshop newly created.

Smoke tests on both URLs pass identically:
- `GET /health` → 200 `{"status":"ok"}`
- `POST /mcp` (no auth) → 401 with `WWW-Authenticate: Bearer realm="learning-with-court", resource_metadata="..."`
- `GET /.well-known/oauth-protected-resource` → JSON with `authorization_servers: ["PENDING"]`
- `GET /.well-known/oauth-authorization-server` → JSON with `issuer: "PENDING"`

The `PENDING` values are placeholders — real Clerk wiring is `clerk-deploy-real`'s job.

## Substrate URL swap

`learning-with-court-mcp-workshop-substrate/.mcp.json` updated:
- `lwc-mcp-workshop` server: `amd1bq5na7` → `rzpsw0r016`

A learner running Claude Code in the mcp-workshop substrate now talks to the mcp-workshop Lambda (which registers mcp-workshop's tools), not the spike's sample workshop.

## What's still pending

- **Real Clerk URLs.** Both stacks deploy with `CLERK_ISSUER_URL=PENDING` and `CLERK_JWKS_URL=PENDING`. No real auth flow works yet. Captured as `clerk-deploy-real` feature; awaits user-provided URLs.
- **End-to-end Claude Code testing.** Depends on Clerk. Once Clerk URLs are deployed, a substrate clone + `claude` should trigger the OAuth dance and reach mcp-workshop's tools (start_lesson, submit_verify_output, where_am_i).
- **Substrate access for testers.** Still private; testers need collaborator access.

## Pushed branches

- `learning-with-court-platform` `feature/mcp-workshop-deploy` — refactor + new stack (1 commit)
- `learning-with-court-mcp-workshop-substrate` `feature/mcp-workshop-deploy` — `.mcp.json` URL swap (1 commit)
- `learning-with-court` `feature/mcp-workshop-deploy` — plan tracker (1 commit; shipped.md being added now)

## Unblocks

- `clerk-deploy-real` — once you provide URLs, both stacks redeploy together.
- `first-user-polish` — runbook can run once Clerk wiring + tester access land.
- Future workshop #3 — one new `WorkshopApiStack` instantiation in `bin/app.ts`. The pattern is established.
