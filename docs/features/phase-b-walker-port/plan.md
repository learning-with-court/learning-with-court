---
started: 2026-05-05
---

# Implementation Plan: Phase B Walker Port (Lessons 7-10)

## Overview

Author four `LessonDefinition` entries — one per Phase B lesson — in the existing `learning-with-court-workshops/workshops/mcp-workshop/`. Pattern is identical to chunk 4 (Phase A): walker prompt + resource + targetFiles + verifyCommand + verify rubric. Substrate already ships all 13 lessons of starter code; this chunk just adds platform-side content for lessons 7-10.

Phase B introduces real complexity that Phase A didn't:
- **Lesson 7** (API keys + SQLite): per-user state, auth middleware, persistence.
- **Lesson 8** (GitHub OAuth): the **meta-confusion** — the learner is authenticated to the workshop server (Clerk, post-chunk-1) and they're now wiring GitHub OAuth into *their own* MCP server. Walker prose has to keep these two cleanly distinct in the learner's mental model.
- **Lesson 9** (HTTP transport): server moves from stdio to HTTP via Hono.
- **Lesson 10** (PKCE): the four-call OAuth dance.

## Critical pedagogical concern: identity confusion (lesson 8)

The single biggest thing that must work in Phase B is the walker prose for lesson 8. Two simultaneous OAuth flows:

- The learner's *workshop session* is authed to learning-with-court via Clerk (chunk 1).
- The learner is *building* an MCP server that does GitHub OAuth.

Without explicit handling, learners conflate these — "wait, am I logging in to the workshop again? Are my GitHub tokens going to the workshop server?" The walker prose must:

1. Open lesson 8 with an explicit "two auths, two purposes" framing.
2. Reference both clearly throughout: "the workshop you're talking to is authed via Clerk" / "the server YOU'RE building uses GitHub OAuth."
3. Make it visible in walker explanations — naming, screenshots-as-resources if helpful, repeated reinforcement.

Without this, the lesson confuses non-devs and even some devs.

## Implementation Steps

- [x] Step 1: Read source material:
  - `~/GitHub/schuettc/claude-code-mcp-workshop/plugin/skills/lesson-07-api-keys/SKILL.md`
  - `.../lesson-08-oauth/SKILL.md`
  - `.../lesson-09-http/SKILL.md`
  - `.../lesson-10-pkce/SKILL.md`
  - And the four corresponding `workshop/lesson_NN_*/README.md` + `verify.ts`

- [x] Step 2: Write `lesson-07.ts` through `lesson-10.ts` in `workshops/mcp-workshop/src/lessons/`. Same shape as Phase A lessons. Notable differences:
  - Lesson 7's verify likely involves SQLite — the verify script may emit different markers (read it).
  - Lesson 8 walker has the explicit identity-confusion framing (above).
  - Lesson 9 may have a `start` script that brings up a server on a port — verify rubric needs to match what `pnpm --filter @workshop/lesson-09-http verify` actually outputs (which likely runs against an in-memory transport, not the live HTTP server).
  - Lesson 10's PKCE flow involves a browser. Walker prose needs to handle "open this URL, sign in, return here" gracefully.

- [x] Step 3: Update `workshops/mcp-workshop/src/index.ts` — add lessons 7-10 to the `lessons` array. Update the workshop's `description` to mention Phase B is now available.

- [x] Step 4: `pnpm typecheck` from workshops repo root — must pass.

- [x] Step 5: Sanity check each new lesson's:
  - `targetFiles` paths exist in `~/GitHub/schuettc/learning-with-court-mcp-workshop-substrate/workshop/lesson_0[7-9]_*` and `lesson_10_*`.
  - `verifyCommand` package name matches the substrate's `package.json`.
  - Verify rubric regex would match what the lesson's `verify.ts` actually emits.

- [x] Step 6: Commit + push to feature branch. **Do NOT open PR** — the orchestrator handles ship.

## Lesson 8 walker prose (explicit guidance)

The lesson 8 walker prompt should:

1. **Opening sentence MUST include**: "Two authentication systems are involved in this lesson — let's name them now to avoid confusion."
2. **Name them**: "Workshop auth (Clerk) — that's how you logged in to take this workshop. Your GitHub OAuth — that's the feature you're now building into your MCP server."
3. **Reinforce the boundary** when introducing each step: "we're about to set up *your server's* GitHub App — not anything to do with the workshop's own auth."
4. **Include in the resource (lesson README)** a one-paragraph "Two auths, briefly" explainer the learner can re-read if they get confused.
5. **For the lesson 8 fork** (mock-only path for learners not going to Phase C): the walker should ask early "do you plan to deploy your server to AWS in Phase C?" If yes, real GitHub App setup. If no, mock-only path. Both produce a working server; the difference is whether the OAuth is real or stubbed.

## Technical Decisions

### Same authoring pattern as chunk 4

No new platform code. No deploy. Same `LessonDefinition` shape as Phase A. Same `companionRepo` (already set in `index.ts`). Same verify-rubric philosophy: match against `narrate.ts`-style `^✔` lines + lesson-specific markers; exclude `^✘` and `verify failed`.

### Phase B is still gated by the deploy decision

mcpWorkshop in `index.ts` will have lessons 1-10 after this chunk lands. Until the multi-workshop routing decision (deferred from chunk 4) is made, the platform Lambda still registers only `sampleWorkshop`. Phase B is *code-ready* but not deployed end-to-end. Same as Phase A's state.

### Multi-track lessons

Lesson 8's mock-vs-real fork is a true conditional in the walker prose, not a separate WorkshopDefinition or two definitions. The walker asks the question; the prose branches based on answer. Both branches produce a passing verify.

## Risks & Mitigations

### Risk: Lesson 8 walker doesn't actually prevent confusion

The identity-context framing is in the prose but real learners might still conflate. **Mitigation:** chunk 7 (first-user-polish) tests this empirically. If non-dev testers conflate, we iterate the lesson 8 prose. v1 ships with the explicit framing; tuning happens post-data.

### Risk: Lesson 9's HTTP transport changes verify mechanics

If lesson 9's verify spins up a server on a port (vs. in-memory transport), the verify command might fail in CI / flaky timing. **Mitigation:** read the existing verify.ts; if it spins up a server, the rubric needs to match the corresponding output. Not a blocker for authoring — just makes the rubric trickier.

### Risk: Lesson 10 PKCE walker requires browser interaction

The four-call dance involves the learner clicking through a browser. Walker prose needs explicit "wait for the user to click through" pause points. Without those, the model might call verify before the dance completes. **Mitigation:** walker prose has explicit "stop here, wait for user to confirm they signed in" beats.

## Out of scope

- Deploy / routing decision (still deferred).
- E2E testing against real Clerk + real GitHub OAuth (depends on deploy).
- Phase C (chunk 6).
