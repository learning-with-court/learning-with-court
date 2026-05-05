---
id: clerk-auth
name: Clerk authentication
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Clerk Authentication

## Problem Statement

Today the deployed workshop platform treats every request as a single hardcoded `spike-user` identity. That was deliberate during validation — it kept the spike's surface small and let us prove the substrate-walker pattern without coupling auth concerns. It's not viable beyond that.

Concrete consequences of the current state:

- Two learners taking the same workshop simultaneously collide on the same DynamoDB row. Lesson completions one user passes wipe out the other user's progress.
- Cross-machine resume works for *one* user, by accident — there's only one identity for the row to be keyed on.
- The MCP `/mcp` endpoint is fully open. Anyone with the URL can drive the workshop, view all server-side state, complete or reset lessons.
- The "What MCP doesn't give us — privacy" framing in `docs/ARCHITECTURE.md` rests on the *protocol* not enforcing privacy; the workshop server is supposed to enforce it via authenticated identity. Without that, even the modest privacy claims (e.g., "your progress is yours") aren't true.

This blocks everything downstream in the v1 plan. Chunks 2-7 of `docs/superpowers/specs/2026-05-05-mcp-workshop-port-design.md` all assume per-user state actually works.

## Why now (and not later)

Clerk is the locked-in choice. Two sibling repos already use it:
- `mixcraft-app` (TypeScript) — uses `@clerk/backend`'s `verifyToken` with a Clerk **secret key**.
- `bettor-help` (Python) — uses pure JWT verification against Clerk's **public JWKS**, no secret key in the Lambda.

We'll lean on the **bettor-help pattern** for our TypeScript Lambda: pure JWKS verification, no Clerk secret in the platform. Reasons in the next section.

## Architecture (the right model — corrected)

The platform is **only a resource server**. Clerk is the authorization server. Claude Code is the public client. PKCE for everything; no client secret anywhere.

The flow:

1. Claude Code starts an MCP session against `/mcp` with no Authorization header.
2. Lambda returns **401** with `WWW-Authenticate: Bearer resource_metadata="https://<host>/.well-known/oauth-protected-resource"` (RFC 9728 §5.1).
3. Claude Code fetches that URL. The doc identifies the Lambda as a resource server and points `authorization_servers` at Clerk's issuer.
4. Claude Code fetches `<clerk-issuer>/.well-known/oauth-authorization-server` (Clerk hosts this), gets Clerk's `/oauth/authorize` and `/oauth/token` endpoints.
5. Claude Code does the PKCE dance directly with Clerk:
   - Browser → `https://<clerk-issuer>/oauth/authorize?response_type=code&code_challenge=<S256>&redirect_uri=<Claude Code's loopback>&...`
   - User signs in to Clerk.
   - Clerk redirects to Claude Code's loopback with auth code.
   - Claude Code POSTs to `https://<clerk-issuer>/oauth/token` with code + verifier.
   - Clerk returns a JWT.
6. Claude Code retries `/mcp` with `Authorization: Bearer <jwt>`.
7. Lambda validates the JWT against **Clerk's JWKS** (public, fetched on cold-start, cached in-process). On success, extracts `sub` as `userId`. On failure, 401 with the same `WWW-Authenticate` header.

What lives where:

| Component | Hosts | Holds |
|---|---|---|
| Clerk | `/oauth/authorize`, `/oauth/token`, `/oauth/userinfo`, `/.well-known/jwks.json`, `/.well-known/oauth-authorization-server` | All user accounts, all secrets, the JWKS signing keys |
| Workshop Lambda | `/mcp`, `/health`, `/.well-known/oauth-authorization-server` (bridge for old clients), `/.well-known/oauth-protected-resource` | Just the issuer URL + JWKS URL as env vars (public info) |
| Claude Code | OAuth loopback callback (configured per-install, not per-workshop) | The user's PKCE verifier per dance, then the resulting JWT |

Reference patterns to lift near-verbatim:

- `~/GitHub/schuettc/bettor-help/packages/mcp-server/src/bettor_help_mcp/oauth/discovery.py` — both `/.well-known/*` route handlers.
- `~/GitHub/schuettc/bettor-help/packages/mcp-server/src/bettor_help_mcp/middleware/auth.py` — the auth middleware shape (extract bearer, validate, set userId on context, exempt well-known paths).
- `~/GitHub/schuettc/bettor-help/packages/mcp-server/src/bettor_help_mcp/auth/clerk_jwt.py` — JWKS-based verification (port from PyJWT to `jose` in Node).

## Proposed solution (high-level — plan.md refines)

In `learning-with-court-platform/packages/server/src/`:

1. Add `auth/clerk-jwt.ts` — uses `jose` library's `createRemoteJWKSet` + `jwtVerify` against `CLERK_JWKS_URL`. Returns `{ userId }` from `payload.sub`. Mirrors bettor-help's structure (try JWT first; fall back to userinfo for opaque OAuth tokens — Clerk issues both shapes depending on flow).
2. Add `oauth/discovery.ts` — both well-known routes, derives the resource URL from the request `Host` header.
3. Update `handler.ts`:
   - Add the two well-known routes (exempt from auth).
   - Replace the `SPIKE_USER_ID` constant with bearer extraction + `validateClerkJwt`.
   - On extraction failure or validation failure, return 401 with the proper `WWW-Authenticate` challenge.

In `learning-with-court-platform/packages/infra/lib/workshop-api-stack.ts`:

- Add env vars to the Lambda: `CLERK_ISSUER_URL`, `CLERK_JWKS_URL`. Both are non-secret — fine to read from CDK context or hardcode-per-env. Kept as env vars (not Secrets Manager) precisely because there's no secret involved.
- Add the well-known routes to the API Gateway HTTP API.

## What I'll need from you

Just one thing — provision a Clerk app. Specifically:

1. **Sign up / log in to Clerk** and create an app (free tier is fine; one app for the whole platform).
2. **Enable "OAuth Applications"** for the app — this is what makes Clerk act as a public-OAuth authorization server (vs. just Clerk's own session model). On the free tier, this should be available; on paid tiers, sometimes called "Connections" or "OAuth Apps." If you can't find it, screenshot what you see and I'll guide.
3. **Within OAuth Applications, create a new OAuth app** for Claude Code:
   - Set `redirect_uri` to whatever Claude Code's MCP OAuth client uses for the loopback callback. I'll need to look this up from Claude Code's docs / observed behavior; rough guess is `http://localhost:<dynamic-port>/callback` or a fixed loopback URL. The CC-side install does the actual binding; the Clerk app just has to allow that URI.
   - Token endpoint auth method: `none` (PKCE-only, no client secret).
   - Grant types: `authorization_code` + `refresh_token`.
   - Scopes: `openid profile email offline_access`.
4. **Capture two URLs:**
   - **Issuer URL** — the Clerk app's OIDC issuer (looks like `https://<slug>.clerk.accounts.dev` for a dev tenant, or your custom domain for prod). I'll need this as the `CLERK_ISSUER_URL` env var.
   - **JWKS URL** — issuer + `/.well-known/jwks.json` (Clerk auto-hosts this). I'll need this as `CLERK_JWKS_URL`.

That's it. **No client secret. No keys for me to put in Secrets Manager.** Public info only.

You can do this in parallel while I'm in `/feature-plan`. By the time the plan is ready for `/feature-implement`, you should have the two URLs. Drop them in chat or in a doc when ready.

## Who benefits

- The author (immediately): can have multiple test identities without polluting state.
- Future learners: per-user progress that's actually theirs.
- Every downstream chunk: builds on a real auth substrate.

## Affected Areas

- platform-server (new auth + discovery modules; handler update)
- platform-infra (env vars wired to Lambda, well-known routes added to API Gateway)
- auth (the new module itself)
- workshop-session-state (now keyed on real user ids)

## Blocked by

Nothing — this is the first chunk. Everything else is blocked by this.
