---
shipped: 2026-05-06
---

# Shipped: Deploy -Prod stacks with real prod Clerk

## What landed

Production environment is live. `LwcMcpWorkshopStack-Prod` deployed alongside the dev stack in the same AWS account, backed by a separate Clerk prod tenant on `clerk.workshop.institute`.

## Clerk prod app provisioning (user-action, completed)

User created a new Clerk prod app `learning-with-court`:
- OAuth Application enabled, **Public** (PKCE-only, `token_endpoint_auth_methods: none`).
- Scopes: `openid profile email offline_access` (plus `public_metadata`, unused by us).
- Redirect URI: `http://localhost:8080/callback` for Claude Code's loopback callback.
- Frontend API: `clerk.workshop.institute` (custom domain — see Clerk DNS records added during this feature).
- Account portal: `accounts.workshop.institute`.
- DKIM + email DNS records: `clk._domainkey`, `clk2._domainkey`, `clkmail` — all verified.

## DNS records added

Five Route 53 CNAME records added to the `workshop.institute` zone (`Z066768136W6VFQS8UYL5`) for Clerk's hosted account portal + frontend API + email DKIM:

| Host | Target |
|---|---|
| `accounts.workshop.institute` | `accounts.clerk.services` |
| `clerk.workshop.institute` | `frontend-api.clerk.services` |
| `clk._domainkey.workshop.institute` | `dkim1.uhclczessgcc.clerk.services` |
| `clk2._domainkey.workshop.institute` | `dkim2.uhclczessgcc.clerk.services` |
| `clkmail.workshop.institute` | `mail.uhclczessgcc.clerk.services` |

All five propagated within minutes (verified via `dig @1.1.1.1`); Clerk's verification dashboard went green for all entries.

## Platform changes

- `config/prod.ts` populated:
  - `clerkIssuerUrl: "https://clerk.workshop.institute"`
  - `clerkJwksUrl: "https://clerk.workshop.institute/.well-known/jwks.json"`
  - `clerkClientId: "WJmjQU1SDxwBBFyl"`
- `cdk deploy --context env=prod` created `LwcMcpWorkshopStack-Prod`:
  - Lambda `LwcMcpWorkshop-Prod-Mcp`
  - DDB `LwcMcpWorkshop-Prod-Sessions`
  - HTTP API at `https://vtgpgw552k.execute-api.us-east-1.amazonaws.com` (initial)
  - Custom domain `https://mcp.workshop.institute` (added in same turn via `custom-domains` feature)

## Substrate URL handling

The open question from idea.md ("env-var URL vs two .mcp.json files") was resolved by **hardcoding prod as the default** in `learning-with-court-mcp-workshop/.mcp.json`. Rationale:
- Real learners take the workshop against prod; that's the canonical experience.
- Env-var URL switching needs 3 coherent vars (URL + clientId + Clerk metadata URL since dev/prod use different Clerk tenants) — too clunky for the "share with others" goal.
- Platform developers testing against dev edit `.mcp.json` locally per a documented override path in the project README. Don't commit the dev edits.

## Verification

Same 4-curl smoke shape as dev passed cleanly on prod (custom domain):

```
=== https://mcp.workshop.institute ===
  /health: 200
  POST /mcp (no auth): 401   (with proper WWW-Authenticate)
  resource: https://mcp.workshop.institute
  auth_servers: ['https://mcp.workshop.institute']
  issuer: https://clerk.workshop.institute
```

Discovery doc shows correct prod Clerk issuer; dynamic-registration shim points at `https://mcp.workshop.institute/register`.

End-to-end Claude Code OAuth dance (sign-in + token issuance + tool call) is **not yet validated** against prod — that's the next mcp-workshop-validation walk. Stack is ready to be exercised; no known reasons it wouldn't work.

## Side note

User pasted the prod client_secret in chat during provisioning. Since the OAuth app is Public/PKCE-only, the secret is genuinely never used — Lambda doesn't store it, substrate doesn't reference it. Suggest rotating it at user's leisure as basic hygiene; not security-critical.
