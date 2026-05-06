---
id: mcp-workshop-validation
name: Validate mcp-workshop end-to-end on the platform
type: Feature
priority: P0
effort: Small
impact: High
created: 2026-05-05
---

# Validate mcp-workshop End-to-End

## Problem Statement

mcp-workshop is "shipped" — code, content, deployed Lambda, substrate repo all in place. But it's only been **typecheck-validated**, not walker-walked. We've never seen a real Clerk-authenticated user complete even one mcp-workshop lesson on the platform.

The sample workshop got that proof (lesson 1 in progress as of last check, real Clerk userId in DDB). mcp-workshop hasn't. Every lesson definition could pass typecheck and still fail at runtime — wrong verify rubric, walker prompt referring to a missing path, identity-confusion framing not landing, etc.

## Proposed Solution

Two-track validation:

1. **Server-side smoke tests** (agent-runnable): curl `/health`, `/.well-known/*`, `/register` on the mcp-workshop endpoint (`https://x6m3w4vs98...`). Confirm structure matches LwcSpike-Dev. (Done as part of this feature; see plan/shipped.)

2. **End-to-end walk** (user-action): you open Claude Code in the mcp-workshop substrate, sign in with the same Clerk dev identity you used for the sample, walk lesson 1. Confirm:
   - SessionStart hook fires with mcp-workshop framing (13 lessons, 3 phases)
   - PreToolUse hook blocks edits to `workshop/lesson_NN_*/src/`
   - `where_am_i` returns clean state for `mcpWorkshop` workshop id
   - `start_lesson(1)` returns lesson 1's `targetFiles` + `verifyCommand`
   - Walker reads the lesson 1 resource (instructions.md)
   - You apply the change manually
   - Walker runs `pnpm --filter @workshop/lesson-01-setup verify`
   - `submit_verify_output` grades correctly
   - DDB row appears with `pk=<your-clerk-sub>`, `sk=session#mcp-workshop`, `currentLesson` advancing

If any step fails: file a follow-up feature for the specific bug (rubric tuning, walker text, hook config, etc.).

## What I'll need from you

The walk itself. I'll capture findings into the shipped.md once you tell me how it went.

Optional (but useful): try lesson 2 too. Lesson 1 is the simplest; lesson 2 exercises Zod + tools, which is a richer test of the substrate path conventions.

## Affected Areas

- learning-with-court (this tracker)
- (Likely none — this is observation; gaps become their own follow-up features)

## Blocked by

Nothing. Just needs the walk.
