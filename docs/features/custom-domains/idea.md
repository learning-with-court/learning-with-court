---
id: custom-domains
name: Custom domains for workshop URLs (workshop.institute)
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-06
---

# Custom Domains for Workshop URLs

## Problem Statement

Today's MCP endpoints are auto-generated API Gateway URLs:

- `https://2u2sjic8hd.execute-api.us-east-1.amazonaws.com/mcp` (dev sample)
- `https://x6m3w4vs98.execute-api.us-east-1.amazonaws.com/mcp` (dev mcp-workshop)

These URLs are functional but:
- Unreadable; `2u2sjic8hd` could be anything.
- Bound to AWS region in the host; if we ever wanted to multi-region or migrate, every substrate `.mcp.json` would need updating.
- Don't communicate environment cleanly (you have to know `2u2sjic8hd` is dev).
- Don't communicate workshop cleanly (you have to know which random ID maps to which Lambda).

The user owns `workshop.institute` (Route 53 hosted zone `Z066768136W6VFQS8UYL5`). Putting workshop endpoints under it gives readable URLs, clean dev/prod separation in the user-facing world, and decouples substrate `.mcp.json` from API Gateway IDs.

## Proposed Solution

Naming convention (env-in-leaf, flat under base):

| Workshop | Dev URL | Prod URL |
|---|---|---|
| mcp-workshop | `mcp-dev.workshop.institute` | `mcp.workshop.institute` |
| (future workshop X) | `X-dev.workshop.institute` | `X.workshop.institute` |

> Updated 2026-05-06: sample workshop dropped before this feature executed (see `drop-sample-rename-project`). Only mcp-workshop receives a custom domain.

One wildcard cert `*.workshop.institute` (DNS-validated against the existing zone) covers everything. Each stack adds:
- An ACM cert reference (shared across stacks of the same env or just one wildcard for the account)
- An API Gateway custom domain mapping
- A Route 53 alias A record pointing at the API Gateway domain

The existing `*.execute-api.us-east-1.amazonaws.com` URLs continue to work — custom domains coexist with the default endpoint. Substrates' `.mcp.json` files swap to the new domain URLs as part of this feature.

## What I'll need from you

Just sign-off on the naming convention. Everything else is mechanical:

1. Confirm the proposed naming (`sample-dev.workshop.institute` etc.) — or pick alternative.
2. After this feature ships, when you provision Clerk prod, you'll know the prod URLs to register in the Clerk app's allowed redirects (still `http://localhost:8080/callback` — domain doesn't affect Clerk redirect; that's loopback).

## Affected Areas

- `learning-with-court-platform` (CDK construct adds custom domain support; new stack handling for cert + Route 53)
- `learning-with-court-sample-substrate` (`.mcp.json` URL swap to `sample-dev.workshop.institute`)
- `learning-with-court-mcp-workshop-substrate` (`.mcp.json` URL swap to `mcp-dev.workshop.institute`)
- `prod-environment` plan (slight update to use prod domain URLs as defaults; not yet executed)

## Blocked by

Nothing. The cert + Route 53 work goes through the existing `learning-with-court` AWS profile; we have full DNS control of the zone.
