---
id: phase-b-walker-port
name: Phase B walker port (lessons 7-10)
type: Feature
priority: P1
effort: Large
impact: Medium
created: 2026-05-05
---

# Phase B Walker Port (Lessons 7-10)

## Problem Statement

Phase B (lessons 7-10) extends the workshop into per-user state and real auth: API keys + SQLite, GitHub OAuth with at-rest token encryption, HTTP transport via Hono, and a local PKCE flow. It's where mcp-workshop transitions from "MCP toy" to "real server you'd want to actually use."

The pedagogical wrinkle that's specific to learning-with-court (and didn't exist in the cloned-repo delivery model): **identity confusion**. The learner is authenticated to the workshop server with Clerk. In lesson 8 they're learning to wire GitHub OAuth into *their own* MCP server. Two simultaneous OAuth flows in the learner's mental model — neither of which is the other.

Without explicit handling in walker prose, this confuses. A learner might think the workshop is asking them to re-authenticate, or that "their" GitHub credentials are being stored by the workshop server, or that the workshop won't work if they skip the OAuth setup.

## Why this matters

Phase B doubles the workshop's value (a learner who completes A+B has built a real working MCP server with auth and state). It also hardens the platform — Phase B's lessons exercise more of the substrate-walker pattern (more nuanced verify rubrics, longer-running test fixtures, more cumulative state in the substrate codebase) than Phase A does.

Skipping Phase B and going straight to Phase C would be wrong — Phase C (AWS deploy) builds on Phase B's local server. So sequencing matters.

## Proposed Solution

Four `LessonDefinition` entries in `workshops/mcp-workshop/`, mirroring Phase A's pattern. The new content beyond Phase A's:

- Lesson 7: API keys + SQLite. Walker prose explains per-user state via SQLite; substrate adds `data/` directory and SQLite wiring.
- Lesson 8: GitHub OAuth (the meta-confusing one). Walker prose **explicitly** distinguishes:
  - The learner authenticated to the *workshop* with Clerk (handled outside this lesson)
  - The learner is configuring *their own* server to do GitHub OAuth (the lesson's content)
  - These are independent; both are real.
  - Forks to handle the lesson 8 mock-only path for learners not going to Phase C.
- Lesson 9: HTTP transport. Walker prose explains the shift from stdio to streamable HTTP via Hono.
- Lesson 10: Local PKCE flow. Walker prose covers the four-call dance (authorize → callback → token exchange → tool call).

## Who benefits

A learner who wants a *production-shaped* MCP server, not just a stdio toy.

## What I'll need from you

- Endorsement of the identity-context framing for lesson 8. Your call on whether to use the explicit "your auth vs. workshop auth" sidebar (more scaffolding, helps non-devs) or trust the model + walker prose to handle it implicitly (cleaner, riskier).
- Guidance on the lesson 8 fork: what UX should a learner who *isn't* going to Phase C see when they hit the "set up a GitHub App" step?

## Affected Areas

- learning-with-court-workshops (workshops/mcp-workshop/)
- mcp-workshop-substrate (lessons 7-10 contributions to the substrate)

## Blocked by

- `phase-a-walker-port` (lesson 7 builds on lesson 6's contract; substrate needs Phase A's contributions in place)
