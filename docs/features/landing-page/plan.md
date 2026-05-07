---
started: 2026-05-06
---

# Implementation Plan: Public Landing Page at workshop.institute

## Overview

A static marketing site at `workshop.institute` (prod) and `dev.workshop.institute` (dev). Drives Clerk sign-up/sign-in before learners ever touch Claude Code, lists the workshop catalog, and shows the 4-line install path. Ships from S3 + CloudFront, fronted by the wildcard cert already in `LwcDnsStack`.

The landing page does NOT call the MCP API. Its only auth dependency is the Clerk-hosted account portal at `accounts.workshop.institute` (already DNS-wired during `prod-environment`).

## Tech choices (no need to discuss before implementing)

- **Astro** — static-first, minimal runtime, simple Clerk integration via `@clerk/astro` (or just direct links to Clerk's hosted portal — the simpler route).
- **Tailwind** — drop-in CSS, looks polished without a designer round trip.
- **Static-only output** (`astro build` → `dist/`) — no SSR, no edge functions. Sign-in is a button that redirects to Clerk's hosted portal, so we don't need Astro's server runtime at all.
- **One Astro project, two CDK stacks** — same source, different env config (prod points at prod Clerk's portal, dev at dev Clerk's portal). Per-env `PUBLIC_*` env vars at build time pick the right Clerk URL.
- **Hosting**: S3 + CloudFront + Route 53 alias. CloudFront uses the existing wildcard cert via SSM ARN.
- **CDK stack name**: `LwcLandingStack-${EnvCap}` (Dev/Prod).
- **Domains**:
  - prod → `workshop.institute` (apex; A-alias to CloudFront)
  - dev → `dev.workshop.institute` (subdomain; same shape)

## End-state shape

```
learning-with-court-platform/
├── packages/
│   ├── infra/
│   │   ├── bin/app.ts                    ← also instantiates LwcLandingStack
│   │   └── lib/
│   │       ├── dns-stack.ts              ← unchanged (already covers apex)
│   │       ├── workshop-api-stack.ts     ← unchanged
│   │       └── landing-stack.ts          ← NEW
│   ├── server/                           ← unchanged
│   └── landing/                          ← NEW
│       ├── package.json                  ← @lwc/landing
│       ├── astro.config.mjs
│       ├── tailwind.config.mjs
│       ├── tsconfig.json
│       └── src/
│           ├── pages/index.astro         ← single-page landing
│           ├── components/
│           │   ├── Hero.astro
│           │   ├── HowItWorks.astro
│           │   ├── Catalog.astro
│           │   ├── Install.astro
│           │   └── Footer.astro
│           ├── styles/global.css
│           └── env.d.ts
```

## Page structure (single Astro page)

1. **Hero**
   - Title: "Hosted MCP workshops for Claude Code"
   - Subtitle: "Take real, deployed workshops without setting up servers, schemas, or auth yourself."
   - CTA buttons: "Sign in / sign up" (links to Clerk account portal), "View on GitHub" (links to the platform repo).

2. **How it works** (2 short paragraphs)
   - Workshops live as deployed MCP servers we host. You install our Claude Code plugin, pick a workshop, clone the project, and the server walks you through.
   - Server-side state means progress survives across machines and sessions.

3. **Available workshops**
   - Card grid (currently one card: mcp-workshop). Each card: title, lesson count, phase count, "View on GitHub" link.
   - "More workshops coming soon" footer line.

4. **Install in 30 seconds**
   - Code block (copy button on hover):
     ```
     /plugin marketplace add schuettc/learning-with-court
     /plugin install learning-with-court
     /reload-plugins
     set up the mcp workshop
     ```
   - Note that `set up the mcp workshop` is what you say to Claude Code in plain English.
   - "Sign in first" callout — pushes users to sign up before installing so the OAuth dance on first run is faster.

5. **Footer**
   - Links: GitHub repos (platform, mcp-workshop, workshops content), workshop catalog, status page (none today, link to platform README).
   - Copyright + author.

## CDK: LandingStack

```
LwcLandingStack-${EnvCap}
├── S3 Bucket (private, OAC-restricted to CloudFront)
├── BucketDeployment (uploads packages/landing/dist/)
├── CloudFront Distribution
│   ├── Origin: S3 via OriginAccessControl
│   ├── Default behavior: cache static, redirect to /index.html
│   ├── Domain aliases: [config.domains.landing] (single domain)
│   └── Certificate: imported from /lwc/dns/wildcard-cert-arn (us-east-1)
├── Route 53 ARecord (alias to CloudFront)
└── Outputs: BucketName, DistributionId, DomainUrl
```

Notes:
- CloudFront cert must be in us-east-1 (already is — wildcard cert deployed in us-east-1).
- For the apex (`workshop.institute`), Route 53 A-alias is the right shape (CNAMEs at apex are illegal).
- BucketDeployment runs `astro build` upstream (via CDK build hook or pre-built in `dist/`). Cleanest: build before `cdk deploy` runs, then BucketDeployment uploads `dist/`.
- CloudFront default-root-object: `index.html`.

## Config additions

`config/index.ts` `Config` interface gets `domains.landing: string`.

`config/dev.ts` adds `domains.landing: "dev.workshop.institute"`.
`config/prod.ts` adds `domains.landing: "workshop.institute"`.

## Clerk wiring

The landing page's sign-in button is just a link to the Clerk-hosted account portal:
- prod → `https://accounts.workshop.institute/sign-up` and `https://accounts.workshop.institute/sign-in`
- dev → `https://accounts.enjoyed-walrus-25.clerk.accounts.dev/sign-up` (or the equivalent dev portal URL)

No Clerk SDK or React component needed for v1 — just hyperlinks. Faster to ship, no PII handling on our static site, Clerk's portal does the heavy lifting.

If we want sign-in *embedded* on the landing page later (so the user never leaves workshop.institute), we'd add `@clerk/astro` and Clerk's React component. Defer to a follow-up.

## Implementation Steps

- [ ] Step 1: Scaffold `packages/landing` — Astro + Tailwind + TypeScript. `package.json` with build/dev scripts. Add to pnpm workspace.
- [ ] Step 2: Build the 5 components + index page. Tailwind for styling. Single page, no router needed.
- [ ] Step 3: `pnpm --filter @lwc/landing build` produces `dist/`. Verify in browser via `pnpm --filter @lwc/landing dev`.
- [ ] Step 4: Add `LwcLandingStack` (CDK). Reads cert ARN from SSM, hosted zone from SSM, landing domain from props. S3 + OAC + CloudFront + alias.
- [ ] Step 5: Extend `Config` with `domains.landing`; populate dev + prod configs.
- [ ] Step 6: `bin/app.ts` instantiates `LwcLandingStack-${EnvCap}` alongside `LwcMcpWorkshopStack-${EnvCap}`.
- [ ] Step 7: `pnpm typecheck` clean. `pnpm cdk synth --context env=dev` and `--context env=prod` clean.
- [ ] Step 8: Deploy dev: `pnpm cdk deploy LwcLandingStack-Dev --context env=dev --require-approval=never`. CloudFront propagation ~5–15 min; smoke test `https://dev.workshop.institute` returns the page.
- [ ] Step 9: Deploy prod: same with `--context env=prod`. Smoke test `https://workshop.institute`.
- [ ] Step 10: Update `learning-with-court/README.md` to link to `https://workshop.institute` as the primary entry point. Marketplace.json description tweak if needed.
- [ ] Step 11: Write `shipped.md`. Open PR feature/landing-page → main, merge.

## Verification

- `curl -sS https://dev.workshop.institute` returns HTML with the hero text.
- `curl -sS https://workshop.institute` returns HTML.
- Both use the wildcard cert (TLS verifies cleanly).
- Sign-in button on prod redirects to `accounts.workshop.institute/sign-up` (or whatever Clerk's portal URL is).
- Visual check in a browser: hero, install code block, workshop card all render correctly.

## Risks & Mitigations

- **CloudFront cache fronting stale content** — On every deploy, invalidate `/*` so visitors see the new build. CDK's BucketDeployment can call invalidation automatically; wire that in.
- **Apex A-alias to CloudFront limitations** — Route 53 alias records to CloudFront work fine; not a CNAME-at-apex problem. No mitigation needed.
- **Clerk portal URL** — confirm exact path during step 8. May be `accounts.workshop.institute/sign-up` or could be `/portal` or root-redirect; check Clerk dashboard for the canonical URL.
- **Static rebuild needed when copy changes** — Edits to copy require `cdk deploy` (rebuild + reupload). Acceptable for a low-frequency-change site; revisit if we add CMS-style content.

## Out of scope (deferred)

- Embedded Clerk sign-in/up component (defer to landing-v2 if needed).
- Workshop progress dashboard for signed-in users.
- Marketing analytics, A/B testing.
- Blog or changelog.
- i18n.
