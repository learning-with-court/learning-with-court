---
id: phase-a-walker-port
name: Phase A walker port (lessons 1-6)
type: Feature
priority: P0
effort: Large
impact: High
created: 2026-05-05
---

# Phase A Walker Port (Lessons 1-6)

## Problem Statement

mcp-workshop's Phase A is six lessons covering the foundational MCP primitives: a hello tool, schemas, multi-tool design, resources, prompts, and contract testing. Today they live as walker prose in `claude-code-mcp-workshop/plugin/skills/lesson-NN-*/SKILL.md` — written for a cloned-repo, plugin-driven delivery model.

For learning-with-court they need to be re-authored as `LessonDefinition` entries in the workshops repo: walker prompt, resources, target files, verify command, rubric, prerequisites (advisory), onPass feedback. Same content, different shape. And — the key change — adaptive depth via the level signal from the adaptive-guidance feature.

Phase A is also where the audacious thesis (non-devs taking complex content) gets its first real test. If Phase A doesn't carry a non-dev with the platform, more porting won't fix it.

## Why this matters

Phase A is the **first releasable workshop content**. Once it ships, mcp-workshop is "available" in the platform — even if Phase B and C are still backlog. A learner can take it end-to-end, build a working local stdio MCP server, and walk away with real value. Their progress is preserved when later phases land.

This is also the chunk that exercises the most platform machinery in real use: substrate-clone, SessionStart hook, PreToolUse hook, all four MCP primitive types (tools, prompts, resources, gated tools), permissive pacing, verify-output grading. If anything about the platform doesn't hold under real curriculum, we find out here.

## Proposed Solution

Six `LessonDefinition` entries in `learning-with-court-workshops/workshops/mcp-workshop/`. Each authored by:

1. Reading the existing `claude-code-mcp-workshop/plugin/skills/lesson-NN-*/SKILL.md` for source walker prose and pedagogy.
2. Reading the corresponding `claude-code-mcp-workshop/workshop/lesson_NN_*/README.md` for learner-facing content (becomes the lesson's MCP resource).
3. Re-authoring the walker prose for the platform's tutor-mode + adaptive-depth contract.
4. Specifying the rubric (regex against vitest stdout from the substrate's lesson tests).
5. Wiring `companionRepo` to the `mcp-workshop-substrate` repo.

Multi-track lessons (e.g., lesson 2 today has `local-notes` vs `github-stars` tracks): port one track for v1; defer the other.

## Who benefits

First-real-user benefits: a learner can take a meaningful chunk of mcp-workshop on the platform.

## What I'll need from you

Mostly judgment calls during walker prose authoring:

- Tone preferences. The existing walker prose has a specific voice — patient, explanatory, occasionally self-deprecating. Re-authored prose should match (or be deliberately different); your call.
- Multi-track decisions for lesson 2: which track is the "default" for v1?
- Whether to preserve any explicit "phase markers" (e.g., a "you've finished Phase A!" celebration after lesson 6) or treat the workshop as one continuous flow.

## Affected Areas

- learning-with-court-workshops (workshops/mcp-workshop/)
- mcp-workshop-substrate (consuming via companionRepo)

## Blocked by

- `clerk-auth` (multi-user)
- `mcp-workshop-substrate` (the artifact the walker points at)
- `adaptive-guidance` (the level signal walker prose adapts to)
