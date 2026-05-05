---
id: first-user-polish
name: First-user test + polish pass
type: Feature
priority: P1
effort: Medium
impact: High
created: 2026-05-05
---

# First-User Test + Polish Pass

## Problem Statement

Everything in the v1 plan is built on **bets** — that the platform carries non-devs through complex content, that adaptive guidance picks up the right signals, that walker prose hits the right depth, that identity-context framing in Phase B isn't confusing, that the recursive case in Phase C is teachable. None of those bets have been tested empirically. The author is the only person who's walked the workshop end-to-end, and the author isn't the target audience.

Without a real-user pass, "v1 done" is just "we built what we said we'd build" — not "we built something that works for real people."

## Why this matters

This is the chunk that turns the v1 plan from "engineering complete" into "validated for general release." It's also where we accumulate the empirical signal that informs everything after v1: the next workshop's content, platform improvements, walker prose iteration, whether adaptive guidance was inferring the right levels.

Without this, we'd ship into a void and be guessing about what to fix next.

## Proposed Solution

Recruit 1-3 trusted testers (mix of dev and non-dev — at least one true non-dev). Each takes the full workshop (Phases A + B, optionally Phase C). Author observes (over Zoom / in-person / async chat — preference TBD) and captures:

- Where the learner gets confused (specific lesson, specific moment)
- Where adaptive guidance was on/off target
- Where walker prose was over- or under-explaining
- Where prereq checks were unclear
- Where the substrate's reset / replay semantics surprised
- Where the identity-context confusion actually showed up vs. where we'd predicted

Findings written to `docs/findings/2026-XX-XX-first-user-test.md` (date filled when actually completed). Specific actionable items extracted into the backlog as new features.

The bar for "Phase A success": one non-dev tester completes Phase A unaided **and** can explain in their own words what an MCP tool, resource, and prompt do, the difference between them, and why their tool needed a Zod schema. That's the audacious thesis being tested — comprehension, not just completion.

## Who benefits

Everyone who takes the workshop after v1. The findings shape every iteration.

## What I'll need from you

This is mostly your work, not mine:

- Identify and recruit the testers. I can suggest profiles (one experienced backend dev, one bootcamp grad, one non-dev) but not pick the actual people.
- Schedule the sessions. Async vs. live observation is your call.
- Decide the scope per tester: full workshop, Phase A only, etc.
- Run the sessions. I can help you prepare a moderation script, a "watch for these moments" checklist, and a findings template, but the actual observation has to be done by a human.

I'll write up findings into the backlog once you share the raw notes.

## Affected Areas

- All repos (findings inform changes everywhere)
- New: `docs/findings/`

## Blocked by

- `phase-b-walker-port` (the workshop has to be substantively complete first; Phase C can be skipped if not ready)
