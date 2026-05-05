# First Workshop: Porting `mcp-workshop` to Hosted MCP

This is the concrete plan for the first workshop the platform will deliver. The existing `mcp-workshop` repo (13 lessons, three phases) becomes a deployed MCP server. This doc captures what changes, what gets reused near-verbatim, and the per-lesson port checklist.

## Source repo

`/Users/courtschuett/GitHub/schuettc/mcp-workshop/` — contains the curriculum, the existing Phase C architecture (HTTP API v2 + GitHub OAuth proxy + Lambda), and the plugin walkers we're porting.

## Conceptual mapping

| Today (plugin-only) | Hosted MCP (this port) |
|---|---|
| Repo cloned by learner | Workshop URL added to `.mcp.json`; companion plugin installed once |
| `plugin/skills/lesson-NN-*/SKILL.md` (walker prose) | MCP prompt body returned by `prompts/get lesson_walkthrough` with `lesson_id=N` |
| `workshop/lesson_NN_*/README.md` | MCP resource at `mcp://mcp-workshop/lesson-N/instructions.md` |
| `workshop/lesson_NN_*/src/verify.ts` | Run *locally by the learner*, but rubric matching happens server-side via `submit_verify_output(N, output)` tool |
| Lesson source files (`src/server.ts` etc.) | Stay local — the learner *writes* code; the workshop teaches them how. Server doesn't ship runnable lesson source. |
| CLAUDE.md / memory tracking | DDB session row keyed on authenticated GitHub user id |
| `where am i` skill | Tool: `where_am_i()` returning `{ currentLesson, completedLessons, nextStep }` |
| `add an MCP tool` skill | Companion plugin skill (kept client-side; pure scaffolding) |
| `debug my MCP server` skill | Companion plugin skill (kept client-side; reads the user's repo) |
| `onboard AWS` skill | Hybrid: client-side checks + server-side guidance via `get_phase_c_prereqs()` |
| Lesson advancement (manual via plugin slash commands) | Server-side: `start_lesson(N)` requires `completedLessons` to include `N-1` |

## What stays in the existing repo

- Lesson source code (`workshop/lesson_NN_*/src/`) — the learner writes against this. The repo stays public/cloneable as a *companion to the hosted workshop*, not as the curriculum delivery vehicle.
- The repo's CDK stack stays as the *example* the workshop teaches building, not as the workshop's own runtime.
- Tests + verify scripts stay in the repo — the learner runs them; the workshop server only consumes their output.

The repo continues to be useful: it's the codebase the learner is actively editing during the workshop. We're just moving the *teaching* off the README and into a server.

## What moves to the platform server

- The walker prose (every `SKILL.md` in `plugin/skills/`).
- The lesson README content (every `workshop/lesson_NN_*/README.md`'s "Walkthrough" section, "Validation checklist", etc.).
- The verify rubric (regex-against-stdout patterns, exit-code expectations).
- Per-learner session state.

## Per-lesson content schema (proposed)

Each lesson becomes a structured object the server reads to drive the walker. Rough shape:

```yaml
# workshops/mcp-workshop/content/lesson-04.yaml
id: 4
title: "Resources"
phase: A
prerequisites: [3]
estimated_minutes: 25

# What the user sees right after start_lesson(4)
intro_resource: "mcp://mcp-workshop/lesson-4/instructions.md"

# Bundled into the lesson_walkthrough prompt body
walker_prose: |
  # (Port verbatim from plugin/skills/lesson-04-resources/SKILL.md;
  # this is the secret sauce. Server returns it as the body of a
  # prompt the model consumes — never as a resource the user reads.)

# Files in the user's repo that should be edit-blocked while this lesson
# is active. Companion plugin queries this list per-edit.
locked_paths:
  - "workshop/lesson_04_resources/src/server.ts"
  - "workshop/lesson_04_resources/src/resources.ts"

# Files the lesson will instruct the user to inspect (read-only encouraged)
reference_paths:
  - "workshop/shared/src/server.ts"

# Verify rubric — what the lesson 4 verify output looks like when correct
verify_rubric:
  command_hint: "pnpm --filter @workshop/lesson-04-resources verify"
  must_include_lines:
    - regex: "✔ resources/list returned \\d+ resources"
    - regex: "✔ resources/read on mcp://notes returned"
  must_not_include:
    - regex: "FAIL"
  on_pass:
    next_lesson: 5
    unlock_resources: ["mcp://mcp-workshop/lesson-5/instructions.md"]
  on_fail:
    feedback_template: |
      Your verify output is missing the resources/list assertion. Make sure
      you registered both `mcp://notes` and the templated URI before exporting
      the server.
```

**Lesson 04 is a good template** — it's clean, no AWS prerequisites, exercises both static and templated MCP resources (which is meta-on-brand for a workshop served via MCP resources).

## Special cases per lesson

- **Lesson 1 (Setup)**: simplest possible port. Used as the Phase 2 proof of concept (per `ROADMAP.md`).
- **Lesson 6 (Testing)**: introduces MCP Inspector. Server can deep-link to the deployed Inspector launch URL with query params (we already do this in the existing walker; it ports straight).
- **Lesson 7 (API keys)**: per-user state introduced. The learner has their own MCP_API_KEY in their `.env`. The workshop server tracks "lesson 7 complete" but doesn't touch the learner's actual key.
- **Lesson 8 (OAuth)**: forks on whether the learner is going to Phase C. Server-side branching — `start_lesson(8)` returns a prompt body that asks the question and the user's response routes to either mock-only or real-GitHub-App setup. The fork lives in DDB session state.
- **Lessons 11-13 (Phase C)**: **the recursive case.** The learner is deploying their own AWS Lambda + GitHub OAuth proxy + DynamoDB while interacting with our hosted-MCP server which IS those things. Need to make the meta-level explicit ("the workshop you're talking to right now is exactly the architecture you just deployed; here are the differences"). Could be the most powerful pedagogical moment if we play it well.

## Auth: Clerk

**Decided: Clerk** (consistent with `mixcraft-app` and `bettor-help`; platform-wide standard).

Important nuance for this specific workshop: it *teaches* GitHub OAuth in lessons 8 and 11. Workshop-auth (Clerk) is intentionally orthogonal to the auth-pattern-being-taught (GitHub) so learners aren't confused about whether they're logged into the workshop server or the server they're building. Lesson walkers make this explicit: "you authenticated to the workshop with Clerk; the GitHub App you're now configuring is for *your* deployed Lambda, separately."

Implementation reference: lift `mixcraft-app/packages/mcp-server/src/auth/clerk-jwt.ts` near-verbatim. The `mcp-workshop/infra/src/lambda/oauth-server.ts` GitHub proxy is *not* reused for workshop auth — it stays in `mcp-workshop` as the thing the lesson teaches the learner to build.

## Companion plugin specifics

Beyond the workshop-agnostic baseline (start-workshop skill + edit-blocking hook), the `mcp-workshop` companion plugin needs:

- **`debug my MCP server`** skill — kept client-side because it inspects the user's local code. It can ping the workshop server for hints if the user is mid-lesson, but the analysis runs locally.
- **`onboard AWS`** skill — kept client-side. Walks the user through `aws configure sso` etc. Server doesn't need to do anything here.
- **NLU mappings** for common phrases:
  - "run verify" → `submit_verify_output(currentLesson, capturedStdout)` (capture stdout from the user's `pnpm verify` invocation).
  - "let's start lesson N" → `start_lesson(N)`.
  - "where am I" → `where_am_i()`.

These are tiny — each maps a regex on user-prompt-submit to a tool call.

## Risks specific to this port

1. **Lesson 1 needs to be installable in 2 minutes.** If onboarding takes longer than git-clone-and-pnpm-install, the hosted version is a regression. Watch this; iterate the install flow.

2. **Phase C's recursive case is fragile.** The learner deploying their own auth-proxy Lambda while authenticated against ours could go wrong if the user accidentally points `.mcp.json` at their own incomplete deployment. Walker prose has to make the distinction clear ("you're authenticated against `learning-with-court/mcp-workshop`; you're deploying your own at `<their-stack>`; both can coexist in `.mcp.json`").

3. **Verify-output capture is the trickiest UX problem.** Three options, in order of preference:
   - **Companion plugin captures.** PostToolUse hook on Bash; if the bash command was a `pnpm verify`, capture stdout, send to `submit_verify_output`. Cleanest UX.
   - **User pastes.** "After running verify, paste the full output between three backticks" → server parses. Works without plugin features but adds friction.
   - **Server runs verify itself.** The workshop server has the lesson source; it could run verify in a sandbox against a fixture user. Doesn't validate the actual user's code, only that they understand the protocol. Probably out of scope.
   We start with #1 + #2 as fallback.

4. **Walker prose was tuned over weeks.** Lots of subtle decisions (when to interrupt, when to hand off, when to summarize). Direct port may lose some of that. Plan: do lesson 1 verbatim port, walk it three times back-to-back, identify regressions, iterate.

## Definition of done for this port

- All 13 lessons walkable end-to-end as a hosted MCP, with a fresh learner who has never seen the existing repo.
- Companion plugin installs in a single command; takes <30 seconds to first useful interaction.
- Per-learner progress visible to the learner (`where_am_i()`) and to the workshop author (server-side dashboard or just DDB scan).
- Documented author handoff: "to add a lesson, add a `lesson-NN.yaml` file, redeploy" — no CDK changes.
- Sunset plan documented for the existing plugin: how do current learners migrate? Estimated 5 minutes of effort per learner.
