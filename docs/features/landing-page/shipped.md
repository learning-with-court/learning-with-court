---
shipped: 2026-05-06
---

# Shipped: Public landing page at workshop.institute

## What landed

A static marketing site for the platform. Two envs, same source, friendly URLs:

| Env | URL | Distribution |
|---|---|---|
| dev | `https://dev.workshop.institute` | CloudFront `E2WQD28W4F3ABJ` |
| prod | `https://workshop.institute` | CloudFront `E28I2GW5570ML3` |

Both live, HTTP 200, rendering correctly with sub-300ms response. Pre-warmed CloudFront edges in `PRICE_CLASS_100` (US/EU).

## Architecture

```
packages/landing/   ← Astro 5 + Tailwind 3 + Clerk hosted portal
└── dist/           ← astro build output, uploaded to S3 by CDK BucketDeployment

packages/infra/lib/landing-stack.ts
├── S3 Bucket (private, OAC-restricted, autoDeleteObjects on)
├── CloudFront Distribution
│   ├── Origin: S3 via OriginAccessControl
│   ├── Default behavior: redirect HTTP→HTTPS, CACHING_OPTIMIZED, gzip
│   ├── Error responses: 403/404 → 200 + /index.html (SPA-like fallback)
│   ├── Domain alias: config.domains.landing
│   └── Cert: imported from /lwc/dns/wildcard-cert-arn (covers apex + *.workshop.institute)
├── BucketDeployment (uploads dist/, invalidates /* on deploy)
└── Route 53 ARecord (alias to CloudFront)
```

The same wildcard cert from `LwcDnsStack` covers both apex and subdomain — no new ACM cert needed for this feature.

## Page sections

1. **Hero** — title, subtitle, "Sign up — free" + "Sign in" + "View on GitHub" CTAs. Dev shows a yellow pill banner so it's never confused with prod.
2. **How it works** — three numbered cards explaining install → pick → walk.
3. **Available workshops** — card grid (currently one card: mcp-workshop). Each card links to its project repo.
4. **Install in 30 seconds** — copy-pasteable code block with the four slash commands + per-line notes.
5. **Footer** — links to platform repos, workshop repos, sign-in/sign-up.

## Auth pattern (no SDK)

Sign-in/sign-up buttons are **plain hyperlinks to Clerk's hosted account portal**:
- prod → `https://accounts.workshop.institute/sign-{in,up}`
- dev → `https://accounts.enjoyed-walrus-25.clerk.accounts.dev/sign-{in,up}`

Build-time `PUBLIC_CLERK_ACCOUNT_PORTAL` env var picks the right URL. No Clerk SDK, no CORS, no iframes — Clerk's portal handles all the PII collection on its own domain. Embedded sign-in is a deferred follow-up.

## Verification

```
=== https://dev.workshop.institute ===
  status: HTTP 200, time 0.217s
  title: workshop.institute — hosted MCP workshops (dev)
  hero text: present (2 occurrences)

=== https://workshop.institute ===
  status: HTTP 200, time 0.190s
  title: workshop.institute — hosted MCP workshops
  hero text: present (2 occurrences)
```

Both certs verify against the Route 53 wildcard. Apex A-alias resolves correctly.

## Decisions worth capturing

- **Astro over Next.js / plain HTML** — static-only output, no JS framework runtime needed for a page that's mostly text + hyperlinks. Tailwind + Astro's component model = fast first paint, easy maintenance.
- **No Clerk SDK on landing page** — direct links to Clerk's portal sidesteps the entire CORS/origin/iframe problem. Embedded sign-in stays a follow-up if conversion data ever shows the redirect hop hurts.
- **Apex via Route 53 alias** — Route 53 alias records work fine at apex (CNAMEs don't), so we can `workshop.institute` → CloudFront directly without a redirect.
- **Wildcard cert reuse** — already covers apex + `dev.workshop.institute`; no per-stack cert.

## Out of scope (deferred)

- Embedded Clerk `<SignIn />` component — defer until the redirect hop becomes a conversion problem.
- Workshop progress dashboard for signed-in users.
- Marketing analytics, A/B testing, conversion tracking.
- Blog or changelog.
- i18n.
