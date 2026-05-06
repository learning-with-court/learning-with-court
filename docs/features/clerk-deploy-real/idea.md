---
id: clerk-deploy-real
name: Deploy real Clerk URLs (replace PENDING placeholders)
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Deploy Real Clerk URLs

## Problem Statement

The `clerk-auth` chunk shipped code-complete with placeholder env vars: `CLERK_ISSUER_URL=PENDING`, `CLERK_JWKS_URL=PENDING`. The auth code reads these at runtime, so any real authentication attempt fails (no JWKS to verify against, no userinfo URL to fall back to). Every real workshop request returns 401 with a sensible discovery doc — but the discovery doc itself points at `PENDING` so Claude Code's MCP OAuth client can't actually complete the dance.

Until real Clerk URLs are deployed, no learner can actually take any workshop. This blocks `mcp-workshop-deploy`'s e2e validation and chunk 7 (first-user-polish).

## What I'll need from you

A Clerk app provisioned with these properties (from the `clerk-auth` README's "Clerk app provisioning" section):

- A Clerk app (free tier OK; one app for the platform).
- OAuth Applications enabled in Clerk; an OAuth app created within it for Claude Code:
  - `redirect_uri` matching Claude Code's MCP OAuth client loopback.
  - Token endpoint auth method: `none` (PKCE-only).
  - Grant types: `authorization_code` + `refresh_token`.
  - Scopes: `openid profile email offline_access`.
- Two URLs captured:
  - **Issuer URL** (e.g., `https://<slug>.clerk.accounts.dev` or your prod domain) → becomes `CLERK_ISSUER_URL`.
  - **JWKS URL** (issuer + `/.well-known/jwks.json`) → becomes `CLERK_JWKS_URL`.

Both URLs are public info — fine to drop into chat or a doc. No secrets needed.

## Proposed Solution

Once you provide the URLs:
1. Update CDK to read them from env vars / context at deploy time (or hardcode in the stack — your call; env vars are cleaner).
2. Redeploy `LwcSpikeStack` (and `LwcMcpWorkshopStack` once that exists) with real values.
3. Smoke-test:
   - `curl /.well-known/oauth-authorization-server` returns Clerk's real authorize/token URLs.
   - `curl /.well-known/oauth-protected-resource` returns the real Clerk issuer in `authorization_servers`.
   - From a Claude Code session in a substrate, attempting to use a tool triggers the OAuth dance, opens browser to Clerk, returns a JWT, and subsequent calls succeed.
4. Verify two different Clerk users in two CC sessions get isolated DDB rows.

## Affected Areas

- learning-with-court-platform (CDK env var values; possibly add CDK context plumbing)

## Blocked by

You providing the two URLs.
