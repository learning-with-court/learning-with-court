---
id: adaptive-guidance
name: Adaptive user-level guidance
type: Feature
priority: P1
effort: Medium
impact: Medium
created: 2026-05-05
---

# Adaptive User-Level Guidance

## Problem Statement

The platform's audacious thesis (per `docs/superpowers/specs/2026-05-05-mcp-workshop-port-design.md`) is that the same workshop can carry both non-developers and senior engineers. That requires the walker prose to *adapt* — terse for someone who already knows what `pnpm` is, patient for someone seeing it for the first time. Without adaptation, walker prose either over-explains (annoys experts) or under-explains (loses non-devs).

Today there's no level signal. The setup-workshop skill probes prereqs only to gate (block on missing tools). It throws away the richer information embedded in those probes — *which* tools are present, *which* AWS profile is configured, whether the user has dotfiles signaling an experienced shell user, etc.

## Why this matters

Once the workshop content (Phase A onward) lands, every lesson's walker prose has to make the level call. Doing that well requires the level to be inferred *once* (in the setup phase) and surfaced consistently (every session start). Without a clear contract for "where does the level live and who reads it," each lesson would re-derive it ad-hoc — inconsistent, hard to test.

## Proposed Solution

Three pieces of plumbing:

1. The `setup-workshop` skill probes the environment during prereq checks: `gh`, `pnpm`, `node`, AWS profile presence, dotfile heuristics. Maps to one of three levels: `beginner`, `intermediate`, `expert`.
2. The level is written into the substrate's per-project plugin settings file (`.claude/lwc-workshop.local.md`) at clone time.
3. The substrate's SessionStart hook reads the level and emits it as additional context for the model. Walker prose in each lesson can then adapt depth based on that signal.

The level is **overridable** — a learner can edit the local file to set their own level if our inference is wrong. We're not pretending to know better than the human.

## Who benefits

- Non-devs: get the explanations they need without feeling talked down to.
- Experts: skip the prereq lectures.
- Authors of future workshops: inherit the level signal for free; don't reinvent it per workshop.

## What I'll need from you

Mostly nothing for the implementation itself. During chunk 7 (polish + first user test) we'll want testers across both ends of the spectrum — that's where the inference quality gets validated empirically.

## Affected Areas

- plugin (setup-workshop skill)
- substrate (.claude/ hooks; new lwc-workshop.local.md pattern)
- platform (optional: surface level in `where_am_i` response so walker prose can read it via MCP if hook-injection isn't sufficient)

## Blocked by

`clerk-auth` — adaptive guidance ships into a multi-user world; doing it before auth would mean reworking it once auth lands.
