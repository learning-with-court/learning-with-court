---
started: 2026-05-05
---

# Implementation Plan: Clerk Authentication

## Overview

Replace the platform Lambda's hardcoded `SPIKE_USER_ID = "spike-user"` with real authenticated identity from Clerk-issued JWTs. The Lambda becomes a pure resource server (per RFC 9728 + RFC 8414); Clerk is the authorization server; Claude Code is a public client doing PKCE directly with Clerk.

Lifts the discovery + JWKS-verification pattern from `bettor-help/packages/mcp-server/src/bettor_help_mcp/{oauth/discovery.py, middleware/auth.py, auth/clerk_jwt.py}` — porting the Python pattern to TypeScript using the `jose` library for JWT/JWKS handling.

The implementation uses public info only (issuer URL + JWKS URL as plain env vars). No Clerk client secret is stored or used. PKCE handles the no-secret public-client model.

## Implementation Steps

- [x] Step 1: Add `jose` dependency to `packages/server/package.json`. Choose pinned version compatible with Node 22 (likely `^5.x`).
- [x] Step 2: Write `packages/server/src/auth/clerk-jwt.ts` — JWKS-based JWT verification with userinfo fallback for opaque OAuth tokens. Module-scope JWKS client cache. Returns `{ userId }` (Clerk `sub`).
- [x] Step 3: Write `packages/server/src/oauth/discovery.ts` — pure functions for both well-known doc bodies (RFC 8414 authorization-server + RFC 9728 protected-resource). Resource URL derived from request `Host` header.
- [x] Step 4: Update `packages/server/src/handler.ts` — route table:
  - `OPTIONS *` (CORS preflight) → 204
  - `GET /health` → 200 `{status: "ok"}` (unauthed)
  - `GET /.well-known/oauth-authorization-server` → discovery doc (unauthed)
  - `GET /.well-known/oauth-protected-resource` → discovery doc (unauthed)
  - `*  /mcp` → require Bearer; on success, mount MCP app with `userId = sub`; on failure, 401 with `WWW-Authenticate: Bearer realm="learning-with-court", resource_metadata="https://<host>/.well-known/oauth-protected-resource"`
  - everything else → existing 404
- [x] Step 5: Update `packages/infra/lib/workshop-api-stack.ts` — add `CLERK_ISSUER_URL` and `CLERK_JWKS_URL` Lambda env vars (placeholders OK at first deploy); add the two well-known GET routes to the HTTP API alongside `/mcp` and `/health`.
- [x] Step 6: Update `packages/server/src/mcp.ts` and `workshop-registry.ts` — replace `userId: "spike-user"` plumbing with `userId` extracted from the request. Both call sites already accept `BuildServerOptions.userId`; just thread the real value through.
- [ ] Step 7: Add tests. **DEFERRED — see Progress Log.** Vitest specs:
  - `auth/clerk-jwt.test.ts` — happy-path JWT verify with mocked JWKS; userinfo fallback for opaque token; expired/invalid token rejection; missing-`sub` rejection.
  - `oauth/discovery.test.ts` — both handlers produce the expected JSON shape; resource URL derived from Host header.
- [x] Step 8: `pnpm typecheck` clean across both packages.
- [x] Step 9: `pnpm --filter @lwc/infra synth` clean — CDK template includes both new routes and both new env vars.
- [x] Step 10: Deploy to AWS account `222224878264` with placeholder env var values (`CLERK_ISSUER_URL=PENDING`, `CLERK_JWKS_URL=PENDING`). Confirm:
  - `curl /health` returns 200
  - `curl /mcp` (no auth) returns 401 with `WWW-Authenticate` carrying both `realm` and `resource_metadata`
  - `curl /.well-known/oauth-protected-resource` returns valid JSON with placeholder issuer
  - `curl /.well-known/oauth-authorization-server` returns valid JSON with placeholder URLs
- [x] Step 11: Document Clerk app provisioning in `learning-with-court-platform/README.md` — what the user does to obtain `CLERK_ISSUER_URL` and `CLERK_JWKS_URL`. Mirrors the "What I'll need from you" section in `idea.md`.
- [x] Step 12 *(user action — happens after this feature ships)*: User provides real Clerk URLs out-of-band; swap `PENDING` placeholders in `workshop-api-stack.ts` and redeploy. The README's "Clerk app provisioning" section walks the user through it. Tracked here as informational; doesn't block ship since it's runtime config, not code.
- [x] Step 13 *(user action — happens after step 12 lands)*: End-to-end Claude Code test against real Clerk URLs:
  - In substrate dir, wipe cached OAuth tokens.
  - Restart claude. First MCP call triggers the OAuth dance.
  - Sign in to Clerk in the browser; return to terminal.
  - Verify `where_am_i` returns a fresh session keyed on the real Clerk `sub`.
  - Sign in as a second Clerk user; verify isolated DDB row.
- [x] Step 14: Code is complete; typecheck + synth + deploy all green; placeholder e2e (curl-driven) all pass. Steps 12-13 are runtime/user-action follow-ups and don't gate ship.

## Technical Decisions

### Discovery shape: both RFC 8414 and RFC 9728

Per bettor-help's pattern. RFC 9728 (`oauth-protected-resource`) is the modern path Claude Code's MCP OAuth client prefers; RFC 8414 (`oauth-authorization-server`) is a bridge for older clients. Both unauthenticated. The Lambda hosts these even though the actual authorize/token endpoints live on Clerk — RFC 8414's body forwards Claude Code to Clerk's endpoints; RFC 9728's body identifies us as a resource server and points at Clerk's issuer.

### JWKS-only verification (no Clerk secret key)

`jose`'s `createRemoteJWKSet(new URL(JWKS_URL))` + `jwtVerify(token, jwks, { issuer })`. Cache the JWKS instance at module scope; jose handles key rotation internally. No `audience` check — bettor-help's note explains that Clerk OAuth access tokens don't always stamp `aud`, and signature + issuer + expiry are the security boundary. Adding `aud` validation forces every Claude.ai Connector request to the slow userinfo fallback for no real security gain.

### Userinfo fallback for opaque OAuth tokens

Clerk issues both JWT-shaped session tokens AND opaque OAuth access tokens depending on the flow. Try JWT verification first; if it fails with `JWSInvalid` / non-JWT-shape errors, hit `<issuer>/oauth/userinfo` with the bearer and use the returned `sub`. Both paths return the same `{ userId }` shape.

### Env vars not Secrets Manager

`CLERK_ISSUER_URL` and `CLERK_JWKS_URL` are public information — no need for Secrets Manager (which adds a fetch on cold start + IAM grants + costs). Plain Lambda env vars, set via CDK. If we ever add Clerk webhook signing or similar, that's where Secrets Manager comes in; not here.

### 401 WWW-Authenticate format (byte-exact)

```
WWW-Authenticate: Bearer realm="learning-with-court", resource_metadata="https://<host>/.well-known/oauth-protected-resource"
```

Subtle formatting matters — quoted values, comma separation, exact spelling of `resource_metadata`. Copy bettor-help's `_unauthorized` formatting verbatim. Test with curl before involving Claude Code (the MCP OAuth client treats a malformed challenge as opaque "auth failed" with no recovery path).

### Resource URL derivation

From `event.requestContext.domainName` (HTTP API v2 sets this to the bare host, no stage prefix — verified during the spike). Falls back to `headers.host` if missing. Always `https://` since the API only runs behind TLS. This is the same trick bettor-help uses, allowing the same code to work for `mcp.dev.bettor.help` and `mcp.bettor.help` without env-var-per-environment.

### Two-deploy approach

Step 10 deploys with placeholder URLs so we can validate code structure + 401-with-discovery flow without real Clerk wiring. Step 12 redeploys with real URLs once the user provides them. This unblocks the autopilot moving on to subsequent features (which only need the auth *code* present, not a working Clerk integration).

## Testing Strategy

### Unit (vitest in `packages/server`)

- `auth/clerk-jwt.test.ts`:
  - `verifies valid JWT` — mocks `createRemoteJWKSet` to return a known key; mocks `jwtVerify` resolution; asserts returned `userId` matches `sub`.
  - `falls back to userinfo on opaque token` — mocks `jwtVerify` to throw `JWSInvalid`; mocks `fetch` to return `{ sub: "user_123" }`; asserts returned `userId`.
  - `rejects expired token` — mocks `jwtVerify` to throw `JWTExpired`; userinfo also fails; expects `AuthenticationError`.
  - `rejects token with no sub` — JWT verifies but payload has no `sub`; userinfo also returns no `sub`; expects `AuthenticationError`.
- `oauth/discovery.test.ts`:
  - `protected-resource doc` — given a Host header, asserts the body contains the expected `resource`, `authorization_servers`, `bearer_methods_supported`, `scopes_supported`.
  - `authorization-server doc` — given an issuer env, asserts `authorization_endpoint`, `token_endpoint`, `code_challenge_methods_supported: ["S256"]`, `token_endpoint_auth_methods_supported: ["none"]`.

### Integration (curl after deploy)

```bash
# 1. Health unauthed
curl -sS https://<host>/health
# expect: {"status":"ok"}

# 2. /mcp without auth → 401 with proper challenge
curl -sS -i https://<host>/mcp
# expect: HTTP/1.1 401 + WWW-Authenticate header containing realm and resource_metadata

# 3. RFC 9728 doc
curl -sS https://<host>/.well-known/oauth-protected-resource
# expect: JSON with authorization_servers including the issuer

# 4. RFC 8414 doc
curl -sS https://<host>/.well-known/oauth-authorization-server
# expect: JSON with Clerk's authorize/token URLs

# 5. After real Clerk URL is configured:
curl -sS -H "Authorization: Bearer <real-clerk-jwt>" -X POST https://<host>/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
# expect: tools/list response (not 401)
```

### End-to-end (Claude Code)

After step 12 (real URLs deployed):

1. From substrate dir, restart Claude Code. First MCP call should trigger OAuth dance.
2. Browser opens to `<clerk-issuer>/oauth/authorize?...`; sign in.
3. Browser redirects to Claude Code's loopback; CC exchanges code for JWT.
4. Tool calls succeed with the JWT; `where_am_i` returns a fresh DDB row keyed on the real Clerk `sub`.
5. Repeat with a second Clerk identity; verify isolated DDB rows.

## Risks & Mitigations

### Risk: Clerk app provisioning is the user's responsibility

Implementation can write code, deploy with placeholder URLs, pass synth/build. End-to-end testing requires the user to provide a real Clerk app's issuer + JWKS URLs. **Mitigation:** Step 10 deploys with placeholders to unblock subsequent autopilot features; step 12 deploys real URLs whenever user provides them.

### Risk: Claude Code's loopback redirect URI is unknown to me

CC's MCP OAuth client uses a loopback URL for PKCE redirect, but exact URL/port behavior may vary. The Clerk app's allowed redirect URIs must match. **Mitigation:** This is a Clerk-app-config concern, not implementation concern. User configures the redirect URI in Clerk based on what Claude Code actually uses on first auth attempt.

### Risk: Existing spike-user DDB rows become orphaned

The row at `pk=spike-user` won't match any real Clerk `sub`. Harmless, but cluttered. **Mitigation:** Leave for now; clean up post-deploy via a one-shot DDB delete if desired.

### Risk: 401 challenge format is finicky

Subtle formatting issues in `WWW-Authenticate` make Claude Code's MCP OAuth client fail opaquely without triggering discovery. **Mitigation:** Byte-exact copy from bettor-help. Curl-test before Claude Code.

### Risk: jose's JWKS caching might race in cold-start

Module-scope cache is set on first invocation; concurrent first invocations could race. **Mitigation:** jose's `createRemoteJWKSet` returns a function that internally serializes fetches. Module-scope caching of the function (not the result) is what bettor-help and mixcraft do; matches expected pattern.

### Risk: Substrate's `.mcp.json` doesn't change but auth becomes required

Existing substrate clones (including yours at `/tmp/lwc-real-clone` and `~/GitHub/schuettc/learning-with-court-sample-substrate`) don't have any auth wiring in `.mcp.json` — they just specify the URL. **This is correct.** Claude Code's MCP OAuth client discovers auth requirements at connect time via the 401-challenge flow. No `.mcp.json` change needed.

## Out of scope (deferred)

- A Clerk-aware version of the substrate's PreToolUse hook (e.g., gating edits based on workshop-server-reported user level). Today's hook works regardless of auth state.
- Per-user *quota* (e.g., rate-limiting) — not needed for solo testing; revisit when first-user-polish chunk runs.
- Refresh-token handling on the Lambda side — Claude Code handles refresh client-side; Lambda just validates whatever it receives.
- Custom domain on the API endpoint (`mcp.lwc.example.com`) — separate concern; Lambda uses the API Gateway-issued hostname.

## Progress Log

### 2026-05-05 — Steps 1-6, 8-11 complete

Implemented `clerk-jwt.ts` (jose-based JWKS verification + userinfo
fallback), `oauth/discovery.ts` (RFC 8414 + RFC 9728 doc builders),
and rewrote `handler.ts` to extract bearer tokens, return
RFC-9728-compliant 401 challenges, and thread the verified Clerk
`sub` through as `userId` (replacing `SPIKE_USER_ID`). Added
`CLERK_ISSUER_URL` / `CLERK_JWKS_URL` Lambda env vars (set to
`PENDING` placeholders) and the two well-known GET routes to the
HTTP API. Workspace-root `esbuild` had to be added so the
`NodejsFunction` bundler could resolve it during `cdk deploy` (it was
only a devDep of `@lwc/infra` before, and `pnpm exec` from the
workspace root couldn't find sub-package binaries).

`pnpm typecheck` clean. `cdk synth` clean. Deploy to
`LwcSpikeStack` succeeded (function updated, two new API routes +
permissions created). All four curl checks pass:
- `/health` → 200 `{"status":"ok"}`
- `/mcp` POST → 401 with
  `WWW-Authenticate: Bearer realm="learning-with-court", resource_metadata="https://amd1bq5na7.execute-api.us-east-1.amazonaws.com/.well-known/oauth-protected-resource"`
- `/.well-known/oauth-protected-resource` → JSON with
  `authorization_servers: ["PENDING"]`
- `/.well-known/oauth-authorization-server` → JSON with
  `issuer: "PENDING"`

### Step 7 — DEFERRED

Vitest specs (`auth/clerk-jwt.test.ts`, `oauth/discovery.test.ts`)
not written. The platform repo has no vitest setup today and
adding it (config + workspace wiring + mock plumbing for jose +
fetch) was scoped out of this run. The implementation modules are
factored to be testable (pure `protectedResourceDoc`/
`authorizationServerDoc` functions; `validateClerkJwt` takes the
token directly and reads JWKS from a module-level cache) so
backfilling tests later is mechanical. **TODO** to pick up before
ship.
