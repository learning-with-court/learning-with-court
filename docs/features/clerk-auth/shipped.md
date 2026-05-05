---
shipped: 2026-05-05
pr: https://github.com/schuettc/learning-with-court-platform/pull/1
---

# Shipped: Clerk Authentication

## What landed

- `packages/server/src/auth/clerk-jwt.ts` — jose-based JWKS verification with `/oauth/userinfo` fallback for opaque OAuth tokens. Module-scope JWKS cache. Returns `{ userId }` from `payload.sub`.
- `packages/server/src/oauth/discovery.ts` — pure builder functions for RFC 8414 (`oauth-authorization-server`) and RFC 9728 (`oauth-protected-resource`) discovery doc bodies. Resource URL derived from the request `Host` header.
- `packages/server/src/handler.ts` — route-level bearer enforcement on `/mcp`. Well-known docs and `/health` exempt. 401 carries byte-exact `WWW-Authenticate: Bearer realm="learning-with-court", resource_metadata="..."` per bettor-help's pattern.
- `packages/infra/lib/workshop-api-stack.ts` — added `CLERK_ISSUER_URL` and `CLERK_JWKS_URL` env vars (placeholders); added 2 new GET routes for the well-known docs.
- `packages/server/package.json` — added `jose ^5.9.0`.
- Workspace root `package.json` — hoisted `esbuild ^0.24.0` for CDK bundling.
- `README.md` — new "Clerk app provisioning" section.

## Verification

- `pnpm typecheck` green
- `pnpm --filter @lwc/infra synth` green
- `cdk deploy` succeeded; placeholder env vars deployed; 2 new API routes + Lambda permissions added
- All 4 curl checks pass (health, 401 challenge, both well-known docs)

## What's still pending (user-action follow-ups)

- **Real Clerk URLs.** User provisions a Clerk app, captures `CLERK_ISSUER_URL` and `CLERK_JWKS_URL`, swaps the placeholders, redeploys. Walked in `learning-with-court-platform/README.md` "Clerk app provisioning."
- **End-to-end Claude Code test.** After URL swap, restart Claude Code in a substrate; verify the OAuth dance triggers, sign-in works, two distinct Clerk users get distinct DDB rows.

These are runtime config + manual e2e — no more code work needed.

## Deferred TODOs

- Vitest unit tests for `clerk-jwt.ts` and `discovery.ts` — repo has no vitest setup yet; modules are factored for testability. Backfill before chunk 7 (first-user-polish) so we have regression coverage before real users hit the auth path.

## PR

[#1 — feat(auth): Clerk JWT bearer validation + OAuth discovery routes](https://github.com/schuettc/learning-with-court-platform/pull/1) — merged, branch deleted.

## Unblocks

Every downstream chunk: `adaptive-guidance`, `mcp-workshop-substrate`, `phase-a-walker-port`, `phase-b-walker-port`, `phase-c-walker-port`, `first-user-polish`. The platform now has real per-user identity threaded through to DynamoDB session rows; multi-user is a deploy-config switch away.
