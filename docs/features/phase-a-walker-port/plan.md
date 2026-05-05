---
started: 2026-05-05
---

# Implementation Plan: Phase A Walker Port (Lessons 1-6)

## Overview

Author six `LessonDefinition` entries — one per Phase A lesson — in `learning-with-court-workshops/workshops/mcp-workshop/`. Each entry is the platform-side content for a single lesson: walker prose (the prompt body), resources (lesson README), `targetFiles`, `verifyCommand`, and a verify rubric.

This is **content authoring**, not platform engineering. The substrate (chunk 3) already has all 13 lessons' starter code working. Chunk 4 just writes the lesson definitions that drive learners through Phase A's six.

Source material: `~/GitHub/schuettc/claude-code-mcp-workshop/plugin/skills/lesson-NN-*/SKILL.md` (walker prose) + `~/GitHub/schuettc/claude-code-mcp-workshop/workshop/lesson_NN_*/README.md` (learner-facing resource content). Re-author for our hosted-MCP model — tutor-mode, level-aware, walker-runs-verify.

## Deployment is deferred

The platform Lambda currently registers only `sampleWorkshop`. Adding `mcpWorkshop` means either:

- A new Lambda stack (one per workshop), with the substrate's `.mcp.json` pointing at the new URL. Cleanest separation; more infra.
- Server-side tool-name prefixing (e.g., `mcp_workshop.start_lesson`) so one Lambda hosts both. Smaller infra; bigger code surface.

This decision belongs in a follow-up — call it **chunk 4-ship** or roll into chunk 5 when we have more lessons to deploy. Chunk 4 ships the *content*; the routing concern is downstream. Substrate's `.mcp.json` continues to share the `lwc-spike` URL until the deploy decision lands.

## Implementation Steps

- [ ] Step 1: Create directory `learning-with-court-workshops/workshops/mcp-workshop/`. Bootstrap with `package.json` (mirrors the existing `workshops/sample/package.json`), `tsconfig.json`, `src/lessons/`.

- [ ] Step 2: Read each of the six existing walker SKILL.md files for source material:
  - `~/GitHub/schuettc/claude-code-mcp-workshop/plugin/skills/lesson-01-setup/SKILL.md`
  - `.../lesson-02-hello/SKILL.md`
  - `.../lesson-03-schemas/SKILL.md`
  - `.../lesson-04-resources/SKILL.md`
  - `.../lesson-05-prompts/SKILL.md`
  - `.../lesson-06-testing/SKILL.md`

  Read each lesson's README too:
  - `~/GitHub/schuettc/claude-code-mcp-workshop/workshop/lesson_01_setup/README.md`
  - ... (5 more)

  These are the source material. Re-author, don't paste verbatim — adapt to our model:
  - Tutor mode: walker explains, asks user to apply, walker runs verify, walker grades. The PreToolUse hook in the substrate already enforces this.
  - Level-aware: walker prose includes conditional notes for `beginner` / `intermediate` / `expert` where the explanation depth genuinely matters (not every paragraph — only when level changes the right thing to say).
  - References to "the deployed workshop server" instead of "the plugin."
  - Mention `where_am_i` and `submit_verify_output` instead of plugin-specific commands.

- [ ] Step 3: Write `src/lessons/lesson-01.ts` through `src/lessons/lesson-06.ts`. Each is a `LessonDefinition`:
  - `id` (1-6), `title`, `prerequisites` (advisory; chain of N → N+1 — but permissive at runtime).
  - `walkerPrompt` (the model-directed scaffolding; the meat of this chunk).
  - `resources` (one entry per lesson with `name: "instructions.md"`, `body` ported from mcp-workshop's lesson README).
  - `targetFiles` (e.g., `["workshop/lesson_05_prompts/src/server.ts", "workshop/lesson_05_prompts/src/verify.ts"]`).
  - `verifyCommand` (e.g., `"pnpm --filter @workshop/lesson-05-prompts verify"`).
  - `verify` rubric — regex matched against vitest stdout. Use the same shape as sample workshop: `mustInclude: [/Test Files\s+1 passed/, /Tests\s+\d+ passed/]`, `mustNotInclude: [/failed/i]`. Adjust per lesson if the verify output isn't vitest-shaped (e.g., lessons that emit narration-style output may need different patterns — read the lesson's existing verify.ts to see what it prints).
  - `onPass` feedback (one-sentence congrats; advance pointer to next lesson).

- [ ] Step 4: Write `src/index.ts` — the workshop's `WorkshopDefinition`:
  - `id: "mcp-workshop"`, `title: "MCP Workshop — Build a Real MCP Server"`, `description` summarizing the 13 lessons + 3 phases.
  - `companionRepo`: `name: "learning-with-court-mcp-workshop-substrate"`, `gitUrl: "git@github.com:schuettc/learning-with-court-mcp-workshop-substrate.git"`, `cloneInstructions: "gh repo clone schuettc/learning-with-court-mcp-workshop-substrate && cd learning-with-court-mcp-workshop-substrate && pnpm install"`.
  - `lessons: [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06]` — six entries for v1; B and C add later as chunks 5/6 ship without breaking learner state.

- [ ] Step 5: Update `pnpm-workspace.yaml` in `learning-with-court-workshops` if needed (it lists `workshops/*` per existing pattern, so the new directory is auto-included).

- [ ] Step 6: `pnpm typecheck` from the workshops repo root — must pass. Imports from `@lwc/server/types` should work via the existing file-link configured in the sample workshop.

- [ ] Step 7: Smoke-check the data — for each lesson, hand-verify:
  - Walker prose mentions the `targetFiles` paths correctly (the regex/strings in the prose should align with what the substrate actually has).
  - Verify rubric's regex would actually match the lesson's verify-script stdout. Read the lesson's `verify.ts` in the substrate to see what it prints; tune the regex to find the success markers without false-matching on noise.
  - The `verifyCommand` is exact — `pnpm --filter @workshop/lesson-NN-<name> verify` with the right package name.

- [ ] Step 8: Update `learning-with-court-platform/packages/server/handler.ts` to also register `mcpWorkshop`. **But:** this introduces tool-name collisions with the sample workshop. Two options:
  - **Option A** (recommended for chunk 4): leave handler.ts unchanged. The mcp-workshop registration is *code-ready* but not deployed. The substrate's `.mcp.json` keeps pointing at `lwc-spike` (the sample workshop's endpoint) so the substrate still has *something* to talk to. Walker prose for mcp-workshop won't actually work end-to-end until the deploy decision lands.
  - **Option B**: deploy a new mcp-workshop Lambda stack. Bigger scope; rolls into a separate chunk.

  Pick A unless the user explicitly requests B during execution.

- [ ] Step 9: Document the deferred deployment decision in shipped.md.

## Rubric tuning per lesson

The verify rubric is the trickiest part. Read each lesson's `verify.ts` in the substrate to know what to match against. mcp-workshop's verify scripts use the `narrate.ts` helpers — they emit lines like `▶ verifying lesson-NN`, `✔ tools: foo, bar`, `✔ <feature> ok`. Match against the success markers (`✔` lines), not the vitest summary (these scripts don't run vitest — they run a tsx script directly).

Suggested generic rubric for tsx/narrate-style verify:
```ts
verify: {
  mustInclude: [/^✔/m],
  mustNotInclude: [/^✘/m, /Error/i],
  description: "verify.ts runs to completion and emits at least one ✔ line."
}
```

This is per-lesson. Tighten where the lesson has specific success-string requirements (e.g., lesson 4 might emit `✔ resources/list returned 2 resources` — match that).

## Walker prose: tone and structure

Each lesson's `walkerPrompt` should:
1. Brief greeting + tie-back to previous lesson (after lesson 1).
2. State what THIS lesson teaches (one paragraph).
3. Tell the learner where to look (`targetFiles`).
4. **Suggest** the change without making it. The PreToolUse hook will block walker edits to `workshop/lesson_NN/src/*` regardless; walker prose should reinforce the rule rather than fight it.
5. Run verify when learner indicates done. Capture stdout. Call `submit_verify_output`.
6. On pass: brief congrats + offer next lesson. On fail: surface rubric reason; don't give the answer.
7. Conditional level-aware sections only where genuinely useful — e.g., for lesson 1, a beginner block might explain what `pnpm install` is; for an expert it'd be skipped.

Lesson 6 (testing) is structurally a bit different — it's about *writing tests*, not about producing a server feature. Walker prose should reflect that: the learner reads test patterns, runs them; the success criterion is that they understand the contract test approach.

## Technical Decisions

### Author one walker prompt per lesson (not a shared template)

Each lesson's pedagogy is different enough that a shared template wouldn't add value. Six standalone walker prompts. The structural shape is consistent (greeting / concept / target / change / verify / outcome) but the content varies.

### Lesson 2's track choice

The existing mcp-workshop's lesson 2 has two tracks: `local-notes` (in-memory) and `github-stars` (external API). For v1, ship the `local-notes` track only. The README + walker prose mention the github-stars track as "advanced" / "if you have a GitHub token, here's the alternative" but don't require it.

### Conditional level-aware sections

Lean restrained. Most walker prose is the same across levels — the model's natural adaptive ability covers most variance. Add conditionals only when the level genuinely changes what the right thing to say is. Examples worth conditional treatment:
- "Run `pnpm install`" → beginner gets a one-line "this fetches the libraries we'll use"; expert gets nothing.
- "Open src/server.ts in your editor" → beginner block explains what an editor is in this context; expert just sees the file path.

Don't conditional-bomb every paragraph. Authoring + maintenance cost > value.

### Skip the test-running smoke pass

The walker prose isn't deployable in this chunk (per the deferred decision). So smoke-testing means hand-validating the data shape — typecheck passes, regex looks right against the lesson's actual verify output, paths match the substrate. End-to-end testing happens after the deploy decision.

## Risks & Mitigations

### Risk: Walker prose drift from existing mcp-workshop SKILL.md

The existing prose was tuned over weeks. Re-authoring loses some of that tuning. **Mitigation:** Re-author from the SKILL.md as source; keep the core structure (greeting / concept / target / change / verify); deviate only where our model demands (tutor mode, level awareness, hosted-server framing).

### Risk: Verify rubric over-matches or under-matches

Vitest stdout patterns differ from narrate.ts output. False positives (rubric matches noise) or negatives (rubric misses real success) only surface when learners actually run verify. **Mitigation:** Read each lesson's verify.ts to know exactly what it emits; tune the rubric per lesson; document in shipped.md what was tuned and why.

### Risk: companionRepo is private; new learners can't clone

The substrate is a private repo. Anyone testing chunk 4's walker would need GitHub collaborator access. **Mitigation:** out of scope. The substrate stays private until we open this up to external testers. Document in shipped.md that real e2e validation depends on either making the substrate public (or at least sharing access).

### Risk: Tool-name collision when both workshops register

Implicit in the deferred Option A: until the deploy decision lands, the `mcpWorkshop` definition isn't actually wired into the Lambda. **Mitigation:** explicit non-decision; chunk 4 ships content only.

## Out of scope (deferred)

- Deployment of mcp-workshop content to a Lambda (multi-workshop routing decision).
- Phases B + C (chunks 5, 6).
- Track 2 of lesson 2 (`github-stars`).
- End-to-end Claude Code session testing of the walker prose (depends on deployment).
- Substrate access for non-collaborators (depends on opening the repo).
