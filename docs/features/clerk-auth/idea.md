---
id: clerk-auth
name: Clerk authentication
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Clerk Authentication

## Problem Statement

Today the deployed workshop platform treats every request as a single hardcoded `spike-user` identity. That was deliberate during validation — it kept the spike's surface small and let us prove the substrate-walker pattern without coupling auth concerns. It's not viable beyond that.

Concrete consequences of the current state:

- Two learners taking the same workshop simultaneously collide on the same DynamoDB row. Lesson completions one user passes wipe out the other user's progress.
- Cross-machine resume works for *one* user, by accident — there's only one identity for the row to be keyed on.
- The MCP `/mcp` endpoint is fully open. Anyone with the URL can drive the workshop, view all server-side state, complete or reset lessons.
- The "What MCP doesn't give us — privacy" framing in `docs/ARCHITECTURE.md` rests on the *protocol* not enforcing privacy; the workshop server is supposed to enforce it via authenticated identity. Without that, even the modest privacy claims (e.g., "your progress is yours") aren't true.

This blocks everything downstream in the v1 plan. Chunks 2-7 of `docs/superpowers/specs/2026-05-05-mcp-workshop-port-design.md` all assume per-user state actually works.

## Why now (and not later)

Clerk is the locked-in choice (per `docs/ARCHITECTURE.md` and the spec). Two sibling repos already use it — `mixcraft-app` and `bettor-help` — so the patterns are tested and ports from there are mostly mechanical, not greenfield design. Doing this first means every later chunk inherits real per-user identity instead of needing rework.

## Proposed Solution

Port `mixcraft-app`'s Clerk JWT bearer validation (`packages/mcp-server/src/auth/clerk-jwt.ts`) into the platform's Lambda handler near-verbatim. Replace the `SPIKE_USER_ID` constant and the open `POST /mcp` route with bearer-extract + JWT-verify. On 401, emit the `WWW-Authenticate` header so Claude Code's MCP OAuth client triggers its discovery dance against Clerk's authorization server.

Provisioning a Clerk app and configuring the MCP OAuth callback URL on it is part of this feature, but the assumption is one Clerk app dedicated to the platform — not per-workshop. Detailed design lives in `plan.md` (next phase).

## Who benefits

- The author (immediately): can have multiple test identities without polluting state.
- Future learners: per-user progress that's actually theirs.
- Every downstream chunk: builds on a real auth substrate.

## What I'll need from you

Clerk app provisioning has to happen on your end — I can't sign up or configure it. Specifically:

- A Clerk app (free tier is fine; one app for the whole platform).
- The Clerk **publishable key** (`pk_...`) and **secret key** (`sk_...`).
- Decide on the workshop's redirect URI shape and configure it in the Clerk app's allowed redirects. The platform's `/oauth/callback` route on the deployed API Gateway endpoint is the most natural choice — full URL: `https://amd1bq5na7.execute-api.us-east-1.amazonaws.com/oauth/callback`. (We may add a custom domain later; that's a separate feature.)
- Optionally: a test user provisioned in the Clerk app (or just sign in via your own primary identity once the wiring lands).

Drop the keys into your terminal as env vars (don't commit them); the plan phase will detail how the deployed Lambda picks them up via Secrets Manager or env injection.

You can do this in parallel while I plan the implementation.

## Affected Areas

- platform-server
- platform-infra (CDK)
- auth
- workshop-session-state

## Blocked by

Nothing — this is the first chunk. Everything else is blocked by this.
