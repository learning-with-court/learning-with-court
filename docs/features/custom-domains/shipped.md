---
shipped: 2026-05-06
---

# Shipped: Custom domains for workshop URLs

## What landed

Friendly URLs replace the auto-generated execute-api hostnames. Both envs now serve the same MCP API at clean domains:

| Env | Custom domain | Backed by |
|---|---|---|
| dev | `mcp-dev.workshop.institute` | `LwcMcpWorkshopStack-Dev` |
| prod | `mcp.workshop.institute` | `LwcMcpWorkshopStack-Prod` |

## How it's wired

**New `LwcDnsStack`** (account-wide, env-agnostic):
- One ACM cert for `workshop.institute` + `*.workshop.institute` (apex SAN included so the future landing page at `workshop.institute` reuses the same cert).
- DNS-validated against the existing Route 53 zone `Z066768136W6VFQS8UYL5` — CDK auto-created the validation CNAME, cert reached `ISSUED` in ~2 min.
- Cert ARN published to SSM at `/lwc/dns/wildcard-cert-arn` (plus `/lwc/dns/hosted-zone-id` and `/lwc/dns/hosted-zone-name` for downstream stacks).
- Decoupled from CFN cross-stack exports — downstream stacks read the SSM param, no hard CFN dependency, cleaner teardown ordering.

**`WorkshopApiStack` extended** with optional custom-domain plumbing:
- New props: `customDomainName`, `hostedZoneId`, `hostedZoneName`.
- When set, creates `apigwv2.DomainName` + `ApiMapping` against the API's default stage, plus a Route 53 ARecord aliasing the friendly host to the regional endpoint.
- Default execute-api endpoint stays live alongside the custom domain — both URLs reach the same Lambda, useful for fallback/debugging.

**Config changes**:
- `Config` interface gained `hostedZoneId`, `hostedZoneName`, `domains.mcpWorkshop`.
- `dev.ts` → `mcp-dev.workshop.institute`; `prod.ts` → `mcp.workshop.institute`.

**Substrate `.mcp.json`** (the project repo learners clone):
- `learning-with-court-mcp-workshop/.mcp.json` now points at `https://mcp.workshop.institute/mcp` with the prod Clerk wiring as defaults.
- README documents the local-edit override for platform developers testing against dev.

## Verification

All four checks pass on both domains, and discovery docs self-reference the correct hostnames:

```
=== https://mcp-dev.workshop.institute ===
  /health: 200
  POST /mcp (no auth): 401
  resource: https://mcp-dev.workshop.institute
  auth_servers: ['https://mcp-dev.workshop.institute']
  issuer: https://enjoyed-walrus-25.clerk.accounts.dev   (dev Clerk)

=== https://mcp.workshop.institute ===
  /health: 200
  POST /mcp (no auth): 401
  resource: https://mcp.workshop.institute
  auth_servers: ['https://mcp.workshop.institute']
  issuer: https://clerk.workshop.institute               (prod Clerk)
```

Discovery docs rely on the request `Host` header, so requests through the friendly domain auto-self-reference correctly without any env-var override.

## Decisions worth capturing

- **Apex in the cert** — `workshop.institute` (not just `*.workshop.institute`) added as a Subject Alternative Name during this feature, anticipating the `landing-page` feature (captured separately) that needs apex coverage. Wildcard certs in ACM don't cover the apex, so requesting both upfront avoided a future cert re-issue.
- **SSM > CfnOutput cross-stack imports** — SSM params decouple the workshop stacks from the DNS stack, which means we can `cdk destroy` workshop stacks independently. CfnOutput-based imports refuse to delete an exporter while any importer remains.
- **`.mcp.json` defaults to prod** — chose hardcoded prod (with documented dev-override edit path) over env-var URL switching. Env-var switching (`${LWC_WORKSHOP_URL}` etc.) would need 3 vars to be coherent — too much friction for the "share-with-others" use case where prod is canonical.

## Risks observed (and didn't materialize)

- **Cert validation slow** — completed in ~2 min; no Route 53 misconfigure issues.
- **Existing workshop stacks broke from custom-domain addition** — clean update; default execute-api endpoint kept working throughout.

## Out of scope (deferred)

- Wildcard renewal monitoring / CloudWatch alarms — ACM auto-renews; revisit if it ever fails.
- HTTP/2 push or other API Gateway tuning.
- Path-based routing for additional services on the same domain.
