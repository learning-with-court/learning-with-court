---
id: dev-environments
name: Dev/prod environment separation (Clerk + CDK)
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Dev/Prod Environment Separation

## Problem Statement

Today's deployed infrastructure has a single naming dimension: `LwcSpikeStack` (sample workshop) and `LwcMcpWorkshopStack` (mcp-workshop). Both have placeholder Clerk URLs. There's no separation between "experimental / breakable" and "stable / known-good."

Clerk supports separate dev and prod **app instances** — different sets of users, different OAuth client configurations, different signing keys. The right way to use Clerk is two apps: a dev app for development testing and a prod app for the production user base. Mirror that on our side: two environments of every stack.

This unblocks:
- Risk-free testing of Clerk wiring (dev app only; mistakes don't affect prod users).
- Risk-free testing of new walker prose (dev environment serves it; prod stays on the last known-good content).
- Eventual promotion path: when a workshop change passes dev validation, deploy the same code with prod-environment config.

## Proposed Solution

Refactor the CDK app to be environment-aware. Convention: `--context env=dev` (default) or `--context env=prod`. Each environment gets its own:

- Stacks (suffix-named: `LwcSpikeStack-Dev`, `LwcSpikeStack-Prod`, etc.).
- Clerk URLs (from per-env config files: `packages/infra/config/dev.ts`, `prod.ts`).
- DDB tables (named to include env: `LwcSpike-Dev`, `LwcSpike-Prod`).
- Lambda functions / API Gateways (likewise env-suffixed).
- API endpoints (separate URLs per env).

This feature ships the **dev environment** working end-to-end — env-aware CDK + dev stacks deployed + dev Clerk URLs wired in. Prod is a future feature: when we want to promote, we'll provision a prod Clerk app, populate the prod config, and deploy with `--context env=prod`.

## Scope

**In scope:**
- Refactor `bin/app.ts` to read `env` from CDK context.
- Add `packages/infra/config/dev.ts` and `packages/infra/config/prod.ts` (prod with PENDING values).
- Stack-name-suffix per env so dev and prod can coexist in the same AWS account.
- Destroy the existing unsuffixed stacks (`LwcSpikeStack`, `LwcMcpWorkshopStack`) — they're being replaced by `-Dev` versions.
- Deploy the new `-Dev` stacks with PENDING Clerk URLs first; swap in real URLs once user provides.
- Update both substrates' `.mcp.json` files to point at the new dev URLs.

**Out of scope:**
- Provisioning the prod Clerk app or deploying prod stacks.
- Multi-account separation (dev and prod in different AWS accounts) — this is single-account-with-suffix-naming for v1. Multi-account is a future feature when audit/cost separation matters.

## What I'll need from you

Two things, both happening in parallel:

1. **Clerk dev app provisioning** (you said you're doing this now):
   - Create a Clerk app in dev mode.
   - Enable OAuth Applications; create one for Claude Code (PKCE-only, redirect_uri TBD on first auth attempt).
   - Capture: dev **Issuer URL** + dev **JWKS URL** (issuer + `/.well-known/jwks.json`).
   - Drop them in chat when ready.

2. **Confirm OK to destroy existing stacks**: `LwcSpikeStack` and `LwcMcpWorkshopStack` get replaced by `-Dev` variants. The DDB tables get destroyed (no real data; only spike-user test rows). Existing API URLs change. Substrate `.mcp.json` files get updated to the new URLs as part of this feature.

I'll proceed with the CDK refactor + dev stack deploy (placeholder URLs) while you provision Clerk. When your URLs land, I swap them in and redeploy.

## Affected Areas

- learning-with-court-platform (CDK refactor; new config files; stack destroys + recreates)
- learning-with-court-sample-substrate (`.mcp.json` URL update)
- learning-with-court-mcp-workshop-substrate (`.mcp.json` URL update)

## Blocked by

- Nothing for the CDK refactor + dev placeholder deploy.
- Real-URL swap is gated on you providing the dev Clerk URLs.
- Prod environment deployment is its own future feature.
