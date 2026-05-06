---
shipped: 2026-05-05
---

# Shipped: Dynamic Registration Shim

## What landed

- New `POST /register` route on the platform Lambda. Ignores request body; returns the pre-configured Clerk client_id with PKCE-friendly metadata. Unauthenticated route (RFC 7591 expects no bearer for registration).
- `/.well-known/oauth-authorization-server` now advertises `registration_endpoint: "https://<host>/register"` alongside its existing fields.
- `clerkClientId` field added to per-env config (`dev: "mVzUb7YhlarIGlLD"`, `prod: "PENDING-PROD"`); plumbed through CDK stack props → Lambda env (`CLERK_CLIENT_ID`).

## Verification (6/6 green)

For both `LwcSpikeStack-Dev` (`2u2sjic8hd...`) and `LwcMcpWorkshopStack-Dev` (`x6m3w4vs98...`):

- `GET /.well-known/oauth-authorization-server` → JSON includes `registration_endpoint`
- `POST /register` → returns `{ client_id: "mVzUb7YhlarIGlLD", token_endpoint_auth_method: "none", grant_types: [...], response_types: ["code"], redirect_uris: [] }`
- `/.well-known/oauth-protected-resource` and `/health` unchanged (no regressions)

## How this unblocks Claude Code's MCP OAuth client

Previously: CC fetched `/.well-known/oauth-authorization-server`, saw no `registration_endpoint`, bailed with "does not support dynamic client registration."

Now: CC sees `registration_endpoint`, POSTs to `/register`, gets back `mVzUb7YhlarIGlLD`, uses that client_id for the rest of the PKCE flow against Clerk's real authorize/token endpoints. Clerk accepts because the client_id is pre-registered in the Clerk dashboard. CC never knows it wasn't a "real" registration.

## Pushed

`learning-with-court-platform` `feature/dynamic-registration-shim` — 2 commits.

## Next step (you)

Retry the workshop from a fresh Claude Code session in either substrate:

```bash
cd ~/GitHub/schuettc/learning-with-court-sample-substrate
git pull   # already pointing at the right URL
claude
```

Type `hi`. The OAuth dance should now proceed:
1. CC fetches `/.well-known/oauth-protected-resource` → finds Clerk as AS
2. CC fetches `/.well-known/oauth-authorization-server` → finds `registration_endpoint`
3. CC POSTs `/register` → gets `client_id: mVzUb7YhlarIGlLD`
4. CC opens browser to Clerk's authorize URL with PKCE + that client_id
5. You sign in to Clerk dev
6. Browser redirects to CC's loopback
7. CC exchanges code for JWT
8. Tool calls succeed

If Clerk rejects the redirect_uri, capture it from the error and add it to the Clerk OAuth app's allowed redirect URIs.
