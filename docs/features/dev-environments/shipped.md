---
shipped: 2026-05-05
stacks:
  - LwcSpikeStack-Dev: https://2u2sjic8hd.execute-api.us-east-1.amazonaws.com
  - LwcMcpWorkshopStack-Dev: https://x6m3w4vs98.execute-api.us-east-1.amazonaws.com
clerk_dev_issuer: https://enjoyed-walrus-25.clerk.accounts.dev
---

# Shipped: Dev/Prod Environment Separation

## What landed

CDK is now environment-aware. `cdk deploy --context env=dev` deploys the dev environment; `--context env=prod` is the future prod path (config exists with PENDING values). Default is `dev` when no env specified.

### Refactor

- **`packages/infra/config/`** — new directory:
  - `dev.ts` — exports `devConfig` with real dev Clerk URLs (`https://enjoyed-walrus-25.clerk.accounts.dev`).
  - `prod.ts` — exports `prodConfig` with `PENDING-PROD` placeholders. Future feature populates.
  - `index.ts` — `loadConfig(envName)` switch + `Config` interface.
- **`bin/app.ts`** — reads `--context env=` (default `dev`); loads config; instantiates `LwcSpikeStack-${EnvCap}` and `LwcMcpWorkshopStack-${EnvCap}` with config-derived URLs. Removed legacy resource-name overrides since the new `-Dev` stacks are fresh.
- **`workshop-api-stack.ts`** — `clerkIssuerUrl` and `clerkJwksUrl` are now required props. Lambda env reads them instead of hardcoded `"PENDING"`.

### Deploy

| Stack | URL | Workshop | DDB |
|---|---|---|---|
| `LwcSpikeStack-Dev` | `https://2u2sjic8hd.execute-api.us-east-1.amazonaws.com` | sample | `LwcSpike-Dev-Sessions` |
| `LwcMcpWorkshopStack-Dev` | `https://x6m3w4vs98.execute-api.us-east-1.amazonaws.com` | mcp-workshop | `LwcMcpWorkshop-Dev-Sessions` |

Both Lambda env vars: `CLERK_ISSUER_URL=https://enjoyed-walrus-25.clerk.accounts.dev`, `CLERK_JWKS_URL=https://enjoyed-walrus-25.clerk.accounts.dev/.well-known/jwks.json`.

### Existing stacks destroyed

`LwcSpikeStack` and `LwcMcpWorkshopStack` (the unsuffixed originals from earlier chunks) gone. Old URLs no longer respond. Both substrates' `.mcp.json` files swapped to the new dev URLs.

### Substrate URL swaps

- `learning-with-court-sample-substrate/.mcp.json` → `https://2u2sjic8hd.execute-api.us-east-1.amazonaws.com/mcp`
- `learning-with-court-mcp-workshop-substrate/.mcp.json` → `https://x6m3w4vs98.execute-api.us-east-1.amazonaws.com/mcp`

## Verification (8/8 smoke checks passed)

For each new dev URL:
- `GET /health` → 200 `{"status":"ok"}`
- `POST /mcp` (no auth) → 401 with `WWW-Authenticate: Bearer realm="learning-with-court", resource_metadata="..."`
- `GET /.well-known/oauth-protected-resource` → JSON with **`authorization_servers: ["https://enjoyed-walrus-25.clerk.accounts.dev"]`** (real, not PENDING)
- `GET /.well-known/oauth-authorization-server` → JSON with **real** Clerk issuer/authorize/token/jwks URLs

The discovery docs are now production-shaped — Claude Code's MCP OAuth client has everything it needs to complete the PKCE dance.

## What this unblocks

- **End-to-end Claude Code testing.** A fresh substrate clone + `claude` should now trigger the OAuth flow against real Clerk dev. User signs in, gets a JWT, JWT validates against JWKS, tool calls land at a real userId-keyed DDB row.
- **First-user-polish.** With real auth, the runbook in `docs/features/first-user-polish/plan.md` is executable. Recruit testers; run sessions.
- **Future prod environment** — one feature away. Provision a prod Clerk app, paste URLs into `config/prod.ts`, `cdk deploy --all --context env=prod` creates parallel `-Prod` stacks.

## Security note

The dev Clerk **client secret** appeared in chat history. Lambda doesn't use it (PKCE = public client), so functionally harmless, but for hygiene: rotate the dev client secret after dev testing wraps. Not critical (dev tenant), low blast radius.

## Pushed

- `learning-with-court-platform` `feature/dev-environments` — refactor + deploy (1 commit)
- `learning-with-court-sample-substrate` `feature/dev-environments` — `.mcp.json` URL swap (1 commit)
- `learning-with-court-mcp-workshop-substrate` `feature/dev-environments` — `.mcp.json` URL swap (1 commit)
- `learning-with-court` `feature/dev-environments` — plan + shipped tracker

## Next obvious step

Test the workshop end-to-end from Claude Code:

```bash
cd ~/GitHub/schuettc/learning-with-court-sample-substrate
git pull   # pull the new .mcp.json URL
claude
```

Type `hi` — first MCP call should trigger Clerk dev OAuth. Sign in with a Clerk dev test user. Subsequent tool calls should succeed with your real Clerk `sub` keying the DDB row. Same drill for `learning-with-court-mcp-workshop-substrate`.

If the OAuth dance fails (e.g., Clerk rejects the redirect URI), capture the error — we may need to add Claude Code's loopback URL to Clerk's allowed redirects.
