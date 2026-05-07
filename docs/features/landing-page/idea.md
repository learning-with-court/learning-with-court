---
id: landing-page
name: Public landing page at workshop.institute (and dev.workshop.institute)
type: Feature
priority: P1
effort: Medium
impact: High
created: 2026-05-06
---

# Public Landing Page at workshop.institute

## Problem Statement

Today the only public surface for learning-with-court is a GitHub README and the marketplace.json plugin description. To onboard new learners, the user has to ship them a curated message: "go to this GitHub repo, run these slash commands, sign in to Clerk when the browser pops up." Friction-y, hard to share, hard to remember.

The user owns `workshop.institute` (Route 53 zone). The apex (`workshop.institute`) and `dev.workshop.institute` are unused. A landing page there gives:
- A single shareable URL ("check out workshop.institute") that opens up a Mixcraft-style intro.
- Clerk sign-up driven from the page so users provision their account before they ever run `claude` — kills the "browser pops up unexpectedly" surprise on first run.
- Step-by-step install + config instructions visible without cloning anything.
- A canonical place to list the workshop catalog as it grows.

## Proposed Solution

Static (or static-ish) site, S3 + CloudFront + Route 53 alias, ACM cert covers apex + `dev.workshop.institute` (so the wildcard `*.workshop.institute` from the custom-domains feature gets siblinged with cert SANs for the apex too).

Two environments, same shape:
- `workshop.institute` (prod) — points at the prod Clerk tenant
- `dev.workshop.institute` (dev) — points at the dev Clerk tenant

Page sections (rough):
1. **Hero** — "Hosted MCP workshops for Claude Code." One-line value prop. CTA: "Sign in / sign up" via Clerk.
2. **How it works (one paragraph)** — same pitch as the README's "How it works" section.
3. **Available workshops** — table from public README, link to the workshop's project repo.
4. **Install in 30 seconds** — copy-pasteable code block mirroring README steps:
   ```
   /plugin marketplace add schuettc/learning-with-court
   /plugin install learning-with-court
   /reload-plugins
   set up the mcp workshop
   ```
5. **Sign in / account** — Clerk-hosted account portal at `accounts.workshop.institute` (already DNS-wired). Lets returning users manage their account.
6. **Footer** — links to GitHub repos, status, owner.

Tech shape (lean toward simplicity):
- **Static page** built with whatever the user prefers (Astro / Next.js static export / plain HTML+Tailwind). Clerk's drop-in React component handles sign-in/sign-up.
- **Hosting**: S3 + CloudFront, Route 53 alias.
- **Single CDK stack** (`LwcLandingStack-${EnvCap}`) parameterized by env, just like the workshop API stacks.
- The landing page does NOT talk to the MCP API directly — its only auth dependency is the Clerk frontend at `clerk.workshop.institute`. It exists to drive sign-up, not to interact with workshop content.

## Affected Areas

- `learning-with-court-platform` (new `LwcLandingStack` + `packages/landing` source)
- `learning-with-court` README (link to workshop.institute as primary entry point; install commands move there)
- `learning-with-court-mcp-workshop` (no change — still works the same way once a learner has clicked through)

## What I'll need from you

- Sign-off on copy direction (what the hero says, tone)
- Optional: a logo / brand pass; default is type-only
- Pick a stack: Astro, Next.js static, or plain HTML+Tailwind. Default Astro — fast, minimal, ships static, easy Clerk integration.

## Blocked by

- `custom-domains` (need ACM cert + Route 53 wiring foundation in place; this feature extends that foundation to apex + dev subdomain)

## Out of scope

- Workshop dashboard for signed-in users (progress, leaderboards) — separate feature later.
- Marketing analytics, A/B testing, conversion tracking.
- A blog / changelog — would live under workshop.institute later if/when it makes sense.
