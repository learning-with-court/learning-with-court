---
started: 2026-05-05
---

# Implementation Plan: Dev/Prod Environment Separation

## Overview

Refactor `learning-with-court-platform/packages/infra/` to be environment-aware. CDK app reads `env` from `--context env=...` (default `dev`); per-env config files (`config/dev.ts`, `config/prod.ts`) hold Clerk URLs + AWS account/region. Stack names suffix per environment so dev + prod coexist in one AWS account.

End state of this feature:
- Existing unsuffixed stacks destroyed.
- `LwcSpikeStack-Dev` and `LwcMcpWorkshopStack-Dev` deployed with placeholder Clerk URLs.
- Both substrates' `.mcp.json` files point at the new dev URLs.
- `prod` config file exists with PENDING values; prod stacks aren't deployed (future feature).
- When user provides dev Clerk URLs, swap them into `config/dev.ts` and redeploy.

## Implementation Steps

### CDK refactor

- [ ] Step 1: Create `packages/infra/config/` directory with two files:
  - `dev.ts` — exports `{ env: "dev", account: "222224878264", region: "us-east-1", clerkIssuerUrl: "PENDING-DEV", clerkJwksUrl: "PENDING-DEV" }`. Real URLs swap in step 9.
  - `prod.ts` — exports same shape with `env: "prod"`, all PENDING-PROD. Future feature populates these.
  - `index.ts` — exports `loadConfig(envName: string)` returning the right config based on string.

- [ ] Step 2: Refactor `packages/infra/bin/app.ts`:
  - Read `env` from `app.node.tryGetContext("env")`. Default to `"dev"`.
  - Load config via `loadConfig(env)`.
  - Instantiate two stacks per env: `LwcSpikeStack-${capitalizedEnv}` and `LwcMcpWorkshopStack-${capitalizedEnv}`.
  - Pass config's `clerkIssuerUrl` and `clerkJwksUrl` as stack props (they're not secrets; CDK env vars at synth time are fine).

- [ ] Step 3: Refactor `packages/infra/lib/workshop-api-stack.ts`:
  - Add `clerkIssuerUrl: string` and `clerkJwksUrl: string` to the stack props.
  - Use them in the Lambda's `environment:` block instead of the hardcoded `"PENDING"`.
  - Stack/resource names already use `stackPrefix`; no changes needed there beyond ensuring callers pass env-aware prefixes.

- [ ] Step 4: `pnpm typecheck` from platform repo root — must pass.

- [ ] Step 5: `pnpm --filter @lwc/infra synth -- --context env=dev` — should produce two stacks: `LwcSpikeStack-Dev`, `LwcMcpWorkshopStack-Dev`. Both with `CLERK_ISSUER_URL=PENDING-DEV` and `CLERK_JWKS_URL=PENDING-DEV` in their Lambda env.

### Deploy

- [ ] Step 6: Destroy existing unsuffixed stacks:
  ```bash
  eval "$(aws configure export-credentials --profile learning-with-court --format env)" && \
  cd packages/infra && \
  pnpm cdk destroy LwcSpikeStack LwcMcpWorkshopStack --force
  ```
  Both stacks get destroyed; DDB tables and Lambda functions go with them.

- [ ] Step 7: Deploy new dev stacks:
  ```bash
  eval "$(aws configure export-credentials --profile learning-with-court --format env)" && \
  cd packages/infra && \
  pnpm cdk deploy --all --context env=dev --require-approval=never
  ```
  Capture the new ApiUrl outputs for both stacks. Will be different from the old URLs (new API Gateway IDs).

- [ ] Step 8: Smoke test the dev stacks (same checks as `mcp-workshop-deploy`):
  - `curl <new-spike-host>/health` → 200
  - `curl <new-mcp-workshop-host>/health` → 200
  - Both return 401 + WWW-Authenticate on `POST /mcp` with no auth.
  - Both have working discovery docs (with PENDING-DEV).

### Substrate URL updates

- [ ] Step 9: Update `learning-with-court-sample-substrate/.mcp.json` to point at `LwcSpikeStack-Dev`'s new URL.

- [ ] Step 10: Update `learning-with-court-mcp-workshop-substrate/.mcp.json` to point at `LwcMcpWorkshopStack-Dev`'s new URL.

- [ ] Step 11: Commit + push both substrate updates on feature branches.

### Real URL swap (gated on user-provided URLs)

- [ ] Step 12 *(awaits user)*: Once you provide the real dev Clerk Issuer URL and JWKS URL, update `packages/infra/config/dev.ts`:
  - `clerkIssuerUrl: "https://<your-dev-slug>.clerk.accounts.dev"` (or whatever the real value is)
  - `clerkJwksUrl: "https://<your-dev-slug>.clerk.accounts.dev/.well-known/jwks.json"`

- [ ] Step 13 *(awaits user, after step 12)*: Redeploy dev stacks:
  ```bash
  cdk deploy --all --context env=dev --require-approval=never
  ```
  Both Lambdas pick up the new env vars on the next cold start.

- [ ] Step 14 *(awaits user, after step 13)*: Smoke test that discovery docs now point at real Clerk:
  - `curl <spike-host>/.well-known/oauth-protected-resource` → JSON with real Clerk issuer in `authorization_servers`.
  - End-to-end test from substrate: `claude` → tool call → OAuth dance → Clerk sign-in → JWT received → tool succeeds.

## Technical Decisions

### Single AWS account for both dev and prod

Multi-account separation (one AWS account per env) is best-practice for cost/audit isolation, but adds setup overhead — separate CDK bootstrapping, IAM cross-account roles, etc. For v1 with one developer, single AWS account is fine. Stack name suffixes give logical separation. Multi-account is a future feature.

### Stack name capitalization

Convention: `LwcSpikeStack-${EnvCapitalized}` (e.g., `-Dev`, `-Prod`). Capitalized to match CDK's stack-naming idioms (PascalCase ID). Inside the stack, resource names use lowercased prefixes (`LwcSpike-Dev` for the DDB table) to match CFN/AWS resource-naming conventions.

### Config files in TypeScript, not YAML

Per-env config is in `.ts` files because they're small, type-safe, and CDK's runtime is already TypeScript. YAML would add a parsing dependency for no real gain. The config files are committed to git — Clerk URLs are non-secret; nothing in this design needs Secrets Manager.

### Default env: dev

If you `cdk deploy` without `--context env=...`, you get dev. Less footgun than defaulting to prod or requiring explicit specification every time. Prod requires `--context env=prod` deliberately.

### Destroying existing stacks is OK

The existing stacks have:
- `LwcSpike` DDB table — only test data (spike-user rows from validation runs).
- `LwcMcpWorkshop-Sessions` DDB table — empty (no real users have used the mcp-workshop endpoint).

Destroying them costs nothing real. The new `-Dev` stacks replace them with the right naming.

### URL changes propagate to substrates as part of this feature

When the new dev stacks come up, their API Gateway URLs are new (different IDs). Both substrates' `.mcp.json` files need the new URLs. This is part of the same feature — don't ship dev stacks without updating substrate references.

## Risks & Mitigations

### Risk: cdk destroy fails on a stack with active resources

Some CFN stacks resist destroy (e.g., S3 buckets with content, IAM roles in use). **Mitigation:** the existing stacks are simple — Lambda + API Gateway + DDB. None should have hold-out resources. If destroy fails, troubleshoot resource-by-resource via the AWS console.

### Risk: We break the spike's existing URL while the user is mid-something

The spike URL we've been using throughout the session changes. **Mitigation:** the user's only active "use" was the e2e workshop validation in earlier chunks. No production users. Brief downtime is fine.

### Risk: Forgetting to update substrate .mcp.json

If `.mcp.json` still points at old URLs, the substrate session connects to nothing (or to a 404). **Mitigation:** steps 9 and 10 are mandatory before this feature ships. Smoke test from each substrate after the URL swap to confirm.

### Risk: Future prod feature needs different infrastructure

Prod might want VPCs, custom domains, multi-region — things beyond a simple suffix. **Mitigation:** today's parameterized `WorkshopApiStack` accepts overrides; prod-specific concerns can pass extra props when they arise. The env-aware skeleton doesn't lock us in.

## Out of scope (deferred)

- Provisioning the prod Clerk app.
- Deploying prod stacks (`--context env=prod`).
- Multi-AWS-account separation.
- Custom domains per env.
- Cross-env data migration (dev → prod promotion of any DB content).
