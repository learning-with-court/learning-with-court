---
id: prod-environment
name: Deploy -Prod stacks with real prod Clerk
type: Feature
priority: P1
effort: Small
impact: Medium
created: 2026-05-05
---

# Deploy -Prod Stacks

## Problem Statement

The `dev-environments` feature established CDK env-awareness. Today only `-Dev` stacks exist; `config/prod.ts` has `PENDING-PROD` placeholders. To "promote to prod" we need:

1. A Clerk **prod app** (separate from dev — different users, different signing keys, different OAuth client).
2. `config/prod.ts` populated with the prod app's issuer/JWKS/clientId.
3. `cdk deploy --all --context env=prod` creating `LwcSpikeStack-Prod` + `LwcMcpWorkshopStack-Prod` alongside the dev stacks.
4. A way for substrate `.mcp.json` files to point at prod URLs when a learner is taking the workshop "for real" (vs. test-driving via dev).

Items 1 and 2 are user-action. Items 3 and 4 are mechanical once the URLs land.

## Substrate URL handling

Open question. Today the substrate `.mcp.json` files hardcode the dev URL. Two reasonable answers for prod:

- **One substrate, env-var URL:** `.mcp.json` uses `${LWC_WORKSHOP_URL}` (CC supports env expansion). User sets the env var to dev or prod URL before running `claude`. Most flexible.
- **Two `.mcp.json` files in the substrate:** `mcp-dev.json` / `mcp-prod.json`; CC reads `.mcp.json` so the learner symlinks the right one. Heavier.

Lean toward env-var. Cleanest. Document in substrate README.

## What I'll need from you

1. **Provision a Clerk prod app** following the same shape as the dev one:
   - OAuth Application enabled
   - PKCE-only (`token_endpoint_auth_methods: none`)
   - Redirect URI: `http://localhost:8080/callback`
   - Scopes: `openid profile email offline_access`
2. **Capture three values** from the prod Clerk app:
   - Prod issuer URL
   - Prod JWKS URL (`<issuer>/.well-known/jwks.json`)
   - Prod client_id

Drop them in chat when ready. I'll do the deploy + substrate updates from there.

## Proposed Solution (server side)

1. Update `packages/infra/config/prod.ts` with the three real values (replace `PENDING-PROD`).
2. `cdk deploy --all --context env=prod --require-approval=never` from the platform repo.
3. Capture both new prod stack URLs.
4. Update both substrates' `.mcp.json` to use env-var URL handling (add `${LWC_WORKSHOP_URL}` placeholder; document the env var in README).
5. Smoke test prod stacks (same 4 curl checks per stack, same shape as dev).

## Affected Areas

- learning-with-court-platform (config/prod.ts populate; deploy command)
- learning-with-court-sample-substrate (`.mcp.json` env-var refactor + README)
- learning-with-court-mcp-workshop-substrate (same)

## Blocked by

You providing the three prod Clerk URLs/IDs.
