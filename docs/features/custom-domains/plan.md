---
started: 2026-05-06
---

# Implementation Plan: Custom Domains

## Overview

Add custom domain support to `WorkshopApiStack`. Each stack gets:
1. An API Gateway HTTP API custom domain mapping (e.g., `sample-dev.workshop.institute`).
2. A Route 53 A-alias record pointing at the API Gateway domain.

Use a **single wildcard ACM cert** for `*.workshop.institute`. The cert is created once (in a shared "DNS stack") and referenced by all environment+workshop stacks.

Configuration extends per-env config: the `Config` interface gains `domainName` (the workshop-id → fqdn mapping) and `hostedZoneId`/`hostedZoneName`. Stack name suffixes already separate dev/prod; the new piece is naming each stack's custom domain.

## Implementation Steps

### Cert + DNS setup

- [ ] Step 1: Create a new lightweight stack `LwcDnsStack` (or extend an existing utility) that owns the wildcard ACM cert for `*.workshop.institute`. Cert validation: DNS, against zone `Z066768136W6VFQS8UYL5`. The cert lives once per AWS region (us-east-1).
  - Cross-region note: API Gateway HTTP API v2 in us-east-1 uses a regional cert in us-east-1; no CloudFront/edge involved. Single cert, single region.

- [ ] Step 2: Output the cert ARN from `LwcDnsStack` so other stacks can import it. Either via SSM parameter or CfnOutput → cross-stack import.
  - Lean toward SSM param at `/lwc/dns/wildcard-cert-arn` so any future stack can read by name without hard CDK dependency.

### Config plumbing

- [ ] Step 3: Extend `packages/infra/config/index.ts` `Config` interface with:
  - `hostedZoneId: string` — `Z066768136W6VFQS8UYL5`
  - `hostedZoneName: string` — `workshop.institute`
  - `domains: { mcpWorkshop: string }` — fully-qualified domain names per workshop, env-suffixed.

- [ ] Step 4: Populate `dev.ts`:
  ```ts
  hostedZoneId: "Z066768136W6VFQS8UYL5",
  hostedZoneName: "workshop.institute",
  domains: {
    mcpWorkshop: "mcp-dev.workshop.institute",
  },
  ```
  And `prod.ts` (with `mcp.workshop.institute`).

  > Updated 2026-05-06: sample workshop dropped (see `drop-sample-rename-project` feature). Only mcp-workshop receives a custom domain.

### Stack updates

- [ ] Step 5: Add new props to `WorkshopApiStackProps`: `domainName: string`, `hostedZoneId: string`, `hostedZoneName: string`. Read the wildcard cert ARN from SSM.

- [ ] Step 6: In `WorkshopApiStack`, add to the construct after the existing `HttpApi`:
  - `apigwv2.DomainName` from cert + domain name
  - `HttpApi.addStage` or default-stage mapping that wires the domain to the API
  - `route53.ARecord` aliasing `props.domainName` to the new domain (using `ApiGatewayv2DomainProperties` as the alias target)
  - Add a CfnOutput for the custom domain URL so it's easy to find post-deploy

- [ ] Step 7: Pass the new config values from `bin/app.ts` to the mcp-workshop stack instantiation (`config.domains.mcpWorkshop`). The spike stack no longer exists.

### Deploy

- [ ] Step 8: `pnpm typecheck` clean.

- [ ] Step 9: `pnpm --filter @lwc/infra synth -- --context env=dev` clean.

- [ ] Step 10: Deploy the DNS stack first (cert needs to validate before downstream stacks can reference it):
  ```bash
  eval "$(aws configure export-credentials --profile learning-with-court --format env)" && \
  cd packages/infra && \
  pnpm cdk deploy LwcDnsStack --require-approval=never
  ```
  Cert validation via DNS record — typically takes a few minutes. CDK handles this automatically (creates validation records in the same Route 53 zone).

- [ ] Step 11: Once cert is `ISSUED`, deploy the dev workshop stacks:
  ```bash
  pnpm cdk deploy --all --context env=dev --require-approval=never
  ```
  Both dev workshop stacks now have custom domains live.

### Substrate updates

- [ ] Step 12: Update `learning-with-court-mcp-workshop/.mcp.json`:
  ```json
  {
    "mcpServers": {
      "lwc-mcp-workshop": {
        "type": "http",
        "url": "https://mcp-dev.workshop.institute/mcp",
        "oauth": { /* unchanged — clientId, callbackPort, authServerMetadataUrl, scopes */ }
      }
    }
  }
  ```

- [ ] Step 13: Commit + push the project repo on `feature/custom-domains` branch.

### Verify

- [ ] Step 14: Smoke-test the new domain:
  - `curl https://mcp-dev.workshop.institute/health` → 200
  - `curl https://mcp-dev.workshop.institute/.well-known/oauth-protected-resource` → resource = `https://mcp-dev.workshop.institute`
  - Stack returns 401 + WWW-Authenticate on `POST /mcp` with no auth.

- [ ] Step 15: End-to-end Claude Code test. From a fresh project clone (after the .mcp.json swap), confirm OAuth dance still works via the new URL.

## Technical Decisions

### Single wildcard cert in one DNS stack

ACM wildcards are cheap (free), single-level (`*.workshop.institute` covers `sample-dev.workshop.institute` etc.), and fast to validate via DNS-01 in the owned zone. One cert serving all stacks > per-stack certs (cleaner, no duplication, fewer validation records).

### Env in leaf, not in subdomain hierarchy

`sample-dev.workshop.institute` (this design) vs `sample.dev.workshop.institute` (alternative): the leaf-suffix design keeps everything one DNS level under the base, which means one wildcard cert covers both dev and prod. Multi-level hierarchy needs two certs (`*.workshop.institute` and `*.dev.workshop.institute`) or a multi-domain cert. Saving complexity for one developer.

Naming discipline: workshop IDs reserved from ending with `-dev` to avoid ambiguity. Document this convention in the platform README.

### Route 53 zone shared across envs

The Route 53 hosted zone is one and only one — the user owns `workshop.institute` and there's one zone. Both dev and prod records live in the same zone. A-aliases per stack resolve to the right API Gateway domain.

### Default endpoint (`*.execute-api.amazonaws.com`) coexists

API Gateway HTTP API v2 keeps the default endpoint working when a custom domain is added. We don't disable it. Substrates point at the custom domain; the default endpoint stays as a fallback / debugging path.

### SSM for cert ARN cross-stack

Using SSM parameter store at `/lwc/dns/wildcard-cert-arn` decouples downstream stacks from the DNS stack at deploy time — no CloudFormation cross-stack export imports needed (those create deletion-order dependencies that complicate later teardowns). SSM is read at synth-time, fetched at deploy-time.

## Risks & Mitigations

### Risk: Cert validation fails or is slow

DNS validation typically completes in 1-5 min, but can hang if Route 53 zone is misconfigured. **Mitigation:** if cert stays `PENDING_VALIDATION` past 30 min, manually inspect the validation CNAME records in Route 53. They should be auto-created by CDK.

### Risk: API Gateway domain mapping conflicts on existing URLs

Custom domains can be added to existing HTTP APIs without disruption. **Mitigation:** default endpoint stays live; if mapping breaks, we can roll back the domain stack without affecting the API itself.

### Risk: Substrates' `.mcp.json` URL swap requires git pull on existing clones

User has live substrate clones today. After we update `.mcp.json` on `main` and push, existing clones will still point at the old execute-api URL until they `git pull`. **Mitigation:** old URL keeps working (default endpoint coexists). Eventually-consistent migration is fine.

### Risk: Missed cleanup of old URLs in docs

Old execute-api URLs may be referenced in shipped.md files, READMEs, plan docs. **Mitigation:** sweep with `grep -r "execute-api"` after the swap; update what's still relevant.

### Risk: Future workshop ID ending in `-dev`

The naming convention reserves `-dev` as the env suffix. **Mitigation:** document in platform README; enforce in workshop authoring docs.

## Out of scope (deferred)

- Prod stack deployment (separate `prod-environment` feature; will reuse this feature's domain config).
- Custom domain for the `/register` shim or any other path-rooted service (the Lambda's whole API is at the same domain).
- HTTP/2 push or other API Gateway tuning.
- DNS-based traffic shifting (e.g., dev → staging → prod canaries).
- WAF or Shield on the custom domains.

## What you'll need from me, in order

1. The naming convention sign-off (done if proceeding with the plan).
2. The Route 53 hosted zone ID — already provided: `Z066768136W6VFQS8UYL5`.
3. After deploy, no further Clerk-side changes (callback URI is loopback, unaffected by our domain change).
