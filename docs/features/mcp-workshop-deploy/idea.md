---
id: mcp-workshop-deploy
name: Deploy mcp-workshop on its own Lambda
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Deploy mcp-workshop on its own Lambda

## Problem Statement

mcp-workshop has 13 lessons authored as `LessonDefinition` entries (chunks 4-6). The platform Lambda exists and works. But the Lambda currently registers only `sampleWorkshop` — `mcpWorkshop` is code-ready but not actually served from any deployed endpoint.

`mcp-workshop-substrate`'s `.mcp.json` points at the existing `lwc-spike` URL, which serves the sample workshop. So a learner running Claude Code in the mcp-workshop substrate would see the sample workshop's tools, not mcp-workshop's. That's wrong.

This blocks any real e2e validation of the mcp-workshop content (chunks 4-6) and blocks the first-user-polish chunk (chunk 7).

## Why this approach (Option A: new Lambda)

The deferred decision was Option A (new Lambda per workshop) vs Option B (multi-register on existing Lambda with prefixed tool names). For v1 with 2 workshops total, **Option A wins** on simplicity:

- No platform code changes needed — `registerWorkshop` stays the same; just register a different workshop in a new stack.
- Each substrate's `.mcp.json` server name (`lwc-sample` / `lwc-mcp-workshop`) maps cleanly to a different URL.
- Per-workshop DDB tables keep state cleanly separated.
- Per-workshop deployment cadence is independent (fix mcp-workshop without touching sample).

Trade-off: each workshop = a Lambda + stack + DDB table. That's fine at 2-3 workshops; revisit Option B when a future workshop pushes us toward multi-register.

## Proposed Solution

A new CDK stack `LwcMcpWorkshopStack` (or similar) mirroring `LwcSpikeStack` but registering `mcpWorkshop` instead of `sampleWorkshop`. The Lambda code can be near-identical — same `handler.ts` shape, same auth, same hooks. The difference is one import + one `registerWorkshop` call.

End-state:
- New Lambda + API Gateway + DDB table deployed.
- New API URL.
- `mcp-workshop-substrate/.mcp.json` updated to point at the new URL.
- Smoke test confirms mcp-workshop's tools (`start_lesson`, `submit_verify_output`, `where_am_i`) are reachable at the new endpoint.

Plan.md will detail the exact CDK structure (likely a parameterized `WorkshopApiStack` construct so future workshops can add a stack with one line).

## What I'll need from you

Nothing — this is internal infra work. The new Lambda deploys with placeholder Clerk URLs (same as the spike's current state); when you provide real Clerk URLs (`clerk-deploy-real` feature), both Lambdas get redeployed with the real values.

## Affected Areas

- learning-with-court-platform (new CDK stack, possibly refactor existing into a shared construct)
- learning-with-court-mcp-workshop-substrate (`.mcp.json` URL swap after deploy)

## Blocked by

Nothing — code is ready. Just needs the deploy.
