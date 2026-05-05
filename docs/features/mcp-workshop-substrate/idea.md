---
id: mcp-workshop-substrate
name: mcp-workshop substrate repo
type: Feature
priority: P0
effort: Medium
impact: High
created: 2026-05-05
---

# mcp-workshop Substrate Repo

## Problem Statement

mcp-workshop's curriculum lives in `claude-code-mcp-workshop/workshop/lesson_NN_*/` as 13 parallel pnpm packages. Each lesson has its own server, its own tests, its own duplicate of `@workshop/shared` boilerplate. That model worked for cloned-repo delivery — every lesson could be `pnpm --filter @workshop/lesson-NN verify`'d in isolation — but it's the wrong shape for the substrate-walker model.

The substrate-walker model needs a single coherent codebase the learner edits across lessons. The sample workshop validated the *progressive* shape: one package, one src/, one tests/ dir; the codebase grows lesson-by-lesson; tests for unbuilt features ship from day 1 and fail cold. We need the equivalent for mcp-workshop's 13 lessons before any walker prose can be ported.

## Why this matters

Without the substrate, there's nothing for chunks 4-6 (Phase A/B/C walker ports) to point `targetFiles` at, run `verifyCommand` against, or grade. The substrate is the artifact the walker is *for*; the walker prose without the substrate is just instructions to nowhere.

This is a meaningful migration. Some sequencing is non-trivial — lesson 5 builds on lesson 4's resources; lesson 8's OAuth uses lesson 7's SQLite store; lesson 12's DDB pattern depends on lesson 11's CDK stack. The progressive substrate has to ship all 13 lessons' worth of code in their cumulative final shape, with each lesson's test-driven gap clearly defined.

## Proposed Solution

A new sibling repo, `learning-with-court-mcp-workshop-substrate` (private). Single pnpm package, progressive shape. Includes:

- `src/` with the union of all 13 lessons' final source structure, but each lesson's *contribution* removed (e.g., lesson 1's tool has `inputSchema: {}`, lesson 4's resources are absent, lesson 7's SQLite isn't wired, etc.).
- `tests/` with all lesson-level test files present. Each test fails cold; lesson application makes it pass without breaking earlier-lesson tests.
- `.claude/` with the SessionStart + PreToolUse hooks from `learning-with-court-sample-substrate`, adapted for this curriculum.
- `.mcp.json` pointing at the deployed workshop server.
- `infra/` directory — empty until lessons 11-13 (Phase C) are reached.

Validation before chunk 4 starts: `pnpm test` cold = 13 failing test files. Manually applying each lesson's expected change moves them green sequentially.

## Who benefits

Every downstream chunk. This is foundation work.

## What I'll need from you

Nothing platform-side — this is content shaping. You may want to spot-check the substrate's progressive sequencing once a draft exists; some lessons have subtle dependencies that aren't obvious from the existing lesson packages.

## Affected Areas

- new repo: learning-with-court-mcp-workshop-substrate

## Blocked by

`clerk-auth` (so the substrate doesn't ship pointing at an unauthed endpoint that we'd then have to re-cut).
