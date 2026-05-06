---
id: dynamic-registration-shim
name: /register endpoint that returns pre-configured Clerk client_id
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Dynamic Registration Shim

## Problem Statement

Claude Code's MCP OAuth client requires the auth server to support **RFC 7591 dynamic client registration** — i.e., advertise a `registration_endpoint` in the OAuth metadata, and accept a POST that returns a fresh `client_id` per client. Clerk doesn't do this; Clerk requires OAuth clients to be pre-registered manually in the dashboard.

Confirmed via claude-code-guide: Claude Code's `.mcp.json` schema doesn't support a static client_id field. The only ways forward are (a) header-based pre-fetched tokens (poor ergonomics, manual refresh) or (b) **server-side dynamic-registration shim** — our Lambda implements `/register` and returns the pre-registered Clerk client_id as if it had just minted one.

Light path. No new packages, no proxy CLI. Just one Lambda route + one discovery-doc field.

## Proposed Solution

Add a `POST /register` handler to the platform Lambda. It ignores the request body (RFC 7591 normally has client metadata in the body) and returns:

```json
{
  "client_id": "<pre-registered-clerk-client-id>",
  "token_endpoint_auth_method": "none",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "redirect_uris": []
}
```

Update `/.well-known/oauth-authorization-server` to advertise `registration_endpoint: "https://<host>/register"`. From Claude Code's perspective, dynamic registration "worked" — the returned client_id is then used for the rest of the PKCE flow against Clerk's real authorize/token endpoints.

The Clerk client_id ships as a Lambda env var (`CLERK_CLIENT_ID`), populated from the per-env config files (alongside the existing `CLERK_ISSUER_URL` and `CLERK_JWKS_URL`).

## Why this works

The OAuth dance is between Claude Code and Clerk; our Lambda is just the resource server. Clerk doesn't care where CC got the client_id from, as long as it matches a real registered client. CC asks our `/register` for one; we hand back the pre-registered one; CC uses it; Clerk accepts. PKCE handles the no-secret public-client side; CC never sees a client_secret.

## What I'll need from you

The Clerk client_id you already provided: `mVzUb7YhlarIGlLD`. Goes in `config/dev.ts` as `clerkClientId`. Already in chat. No new info needed.

## Affected Areas

- learning-with-court-platform (small Lambda change; redeploy)
- (Substrates unchanged — `.mcp.json` URLs already point at the dev Lambdas)

## Blocked by

Nothing.
