# Design: mcp-workshop port to learning-with-court (full v1)

**Date:** 2026-05-05
**Status:** Approved (brainstormed via `superpowers:brainstorming`)
**Execution:** Each chunk shipped via `feature-workflow:feature-autopilot`

---

## Context

The learning-with-court platform's substrate-clone + hosted-walker architecture is validated end-to-end. A two-lesson sample workshop (`learning-with-court-sample-substrate`) walks cleanly: SessionStart hook orients the model; PreToolUse hook enforces tutor mode; the deployed MCP server hosts walker prose, resources, and gated tools; per-user state lives in DynamoDB; verify-output grading reliably matches vitest stdout. The setup-workshop plugin (in `learning-with-court`) drives the substrate clone via `gh`, hands off cleanly with a single command (`cd <path> && claude`), and the substrate's own hooks take over from there.

What's not yet validated: that the platform carries **real curriculum** — specifically, the existing 13-lesson `claude-code-mcp-workshop` repo. That curriculum is the project's first commercial workshop. It teaches building MCP servers across three phases (local stdio → local HTTP+OAuth → AWS deploy via CDK).

The audacious thesis behind this port: **the platform makes complex technical content accessible to non-developers**, with Claude Code itself acting as the patient tutor and the workshop content double-counting as a Claude Code tutorial. If the platform can carry mcp-workshop for non-devs, it can carry anything.

This design captures the v1 forward plan: port all 13 lessons as one cohesive workshop, with auth and adaptive guidance landing first, lessons added incrementally to the workshop so learners' progress is preserved across releases.

## Goal

Ship `mcp-workshop` (all 13 lessons) on `learning-with-court` as a single workshop, walkable end-to-end by a real authenticated user. Validate that the platform carries the curriculum for a mixed audience including non-developers.

## Non-goals (deferred from v1)

- Public Claude Code marketplace publishing — share via GitHub access
- Multiple workshops running simultaneously
- Pricing, entitlements, paid cohorts
- Custom domain on the API endpoint
- Telemetry beyond CloudWatch logs + DynamoDB scans
- Open-sourcing any repos publicly
- Workshop authoring CLI or tooling for third-party authors

## Strategy

**One workshop, incremental lessons.** mcp-workshop ships as a single `WorkshopDefinition`. v1.0 ships with Phase A (lessons 1-6) populated; v1.1 adds Phase B; v1.2 adds Phase C. A learner who completes Phase A keeps their `completedLessons` state when later phases land — no re-enrollment, no separate substrate, no progress reset. The unit of release is "lessons added to a workshop," not "new workshop."

**Adaptive guidance via inferred user level.** The `setup-workshop` skill probes the learner's environment (`gh`, `pnpm`, `node` versions, AWS profile presence, etc.) and encodes an inferred level — `beginner`, `intermediate`, `expert`. The substrate's SessionStart hook surfaces the level into the model's context. Walker prose has conditional depth — same lesson, more explanation for an inferred beginner, terser flow for an inferred expert.

**Chunked execution via `feature-workflow:feature-autopilot`.** Each major piece below is its own feature in `feature-workflow`'s backlog. Autopilot drives each chunk through plan → review → implement → review → ship. This spec is the umbrella; per-feature plans get written by `feature-workflow:feature-plan` when each chunk starts.

## Architecture summary

The four existing repos and one new one:

| Repo | Role | Touched in chunks |
|---|---|---|
| `learning-with-court` | Public-facing plugin (entry point) | 2 |
| `learning-with-court-platform` | Engineering: CDK + server lib | 1, 2 |
| `learning-with-court-workshops` | Workshop content (WorkshopDefinitions) | 4, 5, 6 |
| `learning-with-court-sample-substrate` | Unchanged; serves as regression case | — |
| `learning-with-court-mcp-workshop-substrate` *(new)* | mcp-workshop's progressive substrate | 3 |

The platform's runtime topology is unchanged: HTTP API v2 + Lambda + DynamoDB. The only platform-level change is in chunk 1 (auth replaces spike-user) and chunk 2 (session/context now carries inferred user level).

## Chunks

Each chunk corresponds to one feature in `feature-workflow`'s backlog. Effort estimates are calendar-time guesses — actuals come from per-feature plans.

### Chunk 1 — Clerk auth

**Repo:** `learning-with-court-platform`
**Effort:** 1-2 days

Replace the spike's hardcoded `userId = "spike-user"` with authenticated identity extracted from a Clerk JWT. Port the bearer-validation pattern near-verbatim from `~/GitHub/schuettc/mixcraft-app/packages/mcp-server/src/auth/clerk-jwt.ts` (try JWT verify first; fall back to userinfo round-trip if verify fails for legitimate reasons).

**Done when:**
- Two different authenticated users in two separate Claude Code sessions get isolated `WorkshopSessions` rows (different `pk`).
- Unauthenticated requests to `/mcp` return 401 with the correct `WWW-Authenticate` header so Claude Code's MCP OAuth client triggers its discovery dance.
- Existing curl-based tests against the deployed Lambda pass with a Clerk-issued bearer.

**Out of scope:** Clerk app provisioning (assume an existing Clerk app); user-facing OAuth-callback UX.

### Chunk 2 — Adaptive user-level guidance

**Repos:** `learning-with-court` (plugin), `learning-with-court-platform`, `learning-with-court-mcp-workshop-substrate` (forward-reference; substrate doesn't exist yet but the hook structure is needed)
**Effort:** 3-5 days

The `setup-workshop` skill probes the learner's environment during step 2 (prereq check) — but instead of just gating on missing tools, it builds an inferred user-level signal:

- `expert`: has `gh`, `pnpm`, Node 20+, AWS profile configured, plus signals like recent git commits in the working dir
- `intermediate`: has the developer toolchain but not AWS / minimal recent activity
- `beginner`: missing one or more developer prereqs OR truly fresh terminal

The inferred level is encoded into substrate config at clone time (e.g., `.claude/lwc-workshop.local.md` per the plugin-settings pattern). The substrate's SessionStart hook reads it and surfaces it as context for the model. Walker prose in each lesson includes conditional sections that vary explanation depth based on the level.

**Done when:**
- Two separate substrate clones — one in an environment with all expert signals, one in a deliberately stripped environment — produce visibly different walker behavior on the same lesson.
- The level is overridable: a learner can write `level: expert` (or `beginner`) into `.claude/lwc-workshop.local.md` to override what was inferred.
- Walker prose for at least Phase A's lesson 1 has explicit conditional depth that exercises the mechanism.

**Out of scope:** ML-based level inference, real telemetry on whether the level was right.

### Chunk 3 — mcp-workshop substrate

**Repo:** `learning-with-court-mcp-workshop-substrate` *(new)*
**Effort:** 3-5 days

New sibling repo. Single pnpm package, progressive shape (matches `learning-with-court-sample-substrate`). All 13 lessons' starter code + per-lesson tests + `.claude/` config (SessionStart hook, PreToolUse edit-block hook).

The starter state has all 13 lessons' source files present but in their "lesson cold" state — a tool with no schema (lesson 2's hook), missing resources (lesson 4), no SQLite store (lesson 7), no OAuth proxy (lesson 8/10), no CDK stack (lesson 11), no DynamoDB (lesson 12). Tests for each lesson ship from day 1 and fail cold. Each lesson's expected work makes its tests pass without breaking earlier lessons' tests.

This requires careful sequencing: lesson 5 builds on lesson 4's resources; lesson 8's OAuth flow uses lesson 7's SQLite. The progressive shape means **the substrate is one growing codebase** — not 13 parallel packages like the existing mcp-workshop. That's a meaningful divergence we already validated in the sample workshop.

**Done when:**
- Fresh clone + `pnpm install` succeeds with deterministic lockfile.
- `pnpm test` cold = all lesson tests fail with clean (vitest-style) messages.
- Manually applying each lesson's expected change in sequence makes each lesson's tests pass without regressing earlier lessons.
- `.claude/settings.json` and hooks are present and validated against the platform's expectations (PreToolUse blocks src/ edits; SessionStart fires).

**Out of scope:** Walker prose (that's chunk 4+); the deployed MCP server's content registration (also chunk 4+).

### Chunk 4 — Phase A walker port (lessons 1-6)

**Repo:** `learning-with-court-workshops`
**Effort:** 1 week

Six `LessonDefinition` entries in `workshops/mcp-workshop/src/lessons/`. Each lesson includes:
- `walkerPrompt` — model-directed scaffolding, with conditional sections by inferred user level (chunk 2's contract)
- `resources` — instructional Markdown content (lesson README equivalent)
- `targetFiles` — the files the lesson focuses on in the substrate
- `verifyCommand` — the canonical `pnpm test ...` invocation
- `verify` rubric — regex patterns matched against vitest stdout
- `prerequisites` — advisory only; permissive pacing remains
- `onPass` feedback + advance pointer

The walker prose is adapted from `~/GitHub/schuettc/claude-code-mcp-workshop/plugin/skills/lesson-NN-*/SKILL.md` but rewritten for the dual-audience adaptive-guidance model. Tone matches the sample workshop: tutor-first, runs verify, never silently fixes code.

**Done when:**
- All 6 lessons walkable end-to-end against the substrate from a fresh Claude Code session in the substrate dir.
- Permissive replay/skip-ahead/advisory work as in the sample.
- A spike-user verify-curl pass exists for each lesson (smoke test before the human walk).

**Out of scope:** Phases B and C; multi-track lessons (the existing lesson 2 has a `local-notes` vs `github-stars` track — port one for v1, defer the other).

### Chunk 5 — Phase B walker port (lessons 7-10)

**Repo:** `learning-with-court-workshops`
**Effort:** 1 week

Lessons 7-10: SQLite + per-user-state, GitHub OAuth (the meta-confusing one), HTTP transport via Hono, local PKCE.

The substantive new pedagogical concern: **identity confusion**. Lesson 8 teaches the learner to set up GitHub OAuth in the MCP server they're building. The learner is, separately, Clerk-authenticated to the workshop server. Walker prose must make this distinction explicit and persistent — "the GitHub App you're configuring is for *your* server; you logged in to the workshop with Clerk; both are real, neither is the other."

**Done when:**
- Lessons 7-10 walkable end-to-end.
- Identity-context confusion is handled in walker prose; a non-dev tester (in chunk 7) doesn't get confused about which auth is which.
- The lesson 8 fork (real GitHub App vs. mocked-only path for learners not going to Phase C) is preserved.

### Chunk 6 — Phase C walker port (lessons 11-13)

**Repo:** `learning-with-court-workshops`
**Effort:** 1 week

Lessons 11-13: AWS deploy via CDK (HTTP API v2 + Lambda + DDB + KMS envelope encryption). The recursive case: the learner deploys their own MCP server to AWS while taking a workshop hosted on a deployed MCP server. Walker prose must keep the boundary explicit — "the Lambda you're deploying is *not* the Lambda hosting your workshop."

Phase C is **optional**. A learner who completes Phases A + B has built a working local MCP server and is "done" in any meaningful sense. Phase C is reachable via `start_lesson(11)` regardless of A/B completion (per platform's permissive pacing), but its only hard prereq is the AWS-account / CLI-profile setup, which the walker enforces by checking and stopping if absent.

The substrate for Phase C contains the CDK source code in `infra/` — present from day 1 but unused by lessons 1-10. Phase C lessons are the only ones that touch `infra/`.

**Done when:**
- Lessons 11-13 walkable for a learner with a real AWS account.
- AWS prereq check is clean and non-judgmental ("this lesson needs an AWS account; here's a guide").
- Identity separation in walker prose — workshop-Clerk vs. their-AWS — is explicit.
- Phase C is genuinely skippable: a learner who stops at lesson 10 sees "Workshop complete" with a note about Phase C as bonus material.

### Chunk 7 — Polish + first user test

**Repos:** all
**Effort:** 3-5 days

Run 1-3 trusted testers (mix of dev / non-dev) through the full workshop. Capture friction. Iterate.

**Done when:**
- One non-dev tester completes Phase A unaided AND can explain in their own words what an MCP tool, resource, and prompt do, the difference between them, and why their particular workshop's tool needed a Zod schema.
- Friction findings written to `docs/findings/2026-XX-XX-first-user-test.md` (date filled in when actually done) — including: what walker tones worked, what didn't, where adaptive guidance was on/off target, what prereqs were genuinely confusing.
- Specific actionable items extracted from findings into the backlog as new features.

## Success criteria (overall)

- An authenticated user (real Clerk identity) walks mcp-workshop's full Phase A + B end-to-end.
- The substrate-clone + hosted-walker pattern carries the curriculum without surprise architectural pressure.
- One non-dev tester completes Phase A unaided AND demonstrates understanding (chunk 7 bar).
- Each chunk shipped with a clean PR through `feature-workflow:feature-autopilot`.
- The platform's runtime is unchanged structurally — same HTTP API v2 + Lambda + DDB shape; just real auth and richer content.

## Risks

**The non-dev bet doesn't hold.** Phase A's lessons assume comfort with TypeScript syntax, package managers, vitest output. Adaptive guidance can't paper over a fundamental skill gap. Mitigation: chunk 7 tests this *empirically* with a non-dev tester rather than reasoning about it. If the bet fails, the next move is either dropping the non-dev framing or building a pre-workshop "is this for you?" lesson.

**Adaptive guidance over-engineers walker prose.** Conditional sections doubled across 13 lessons is a maintenance load. Mitigation: keep the conditionals minimal in chunk 4 (just lesson 1 has full conditional treatment); add conditionals to other lessons only where chunk 7 finds they're needed.

**Phase C's recursive case confuses learners despite walker prose.** "I authenticated to the workshop with Clerk; now I'm building a server that uses GitHub OAuth; oh wait there's also AWS IAM." Mitigation: walker prose has an explicit "what each authentication does" section in lesson 11; substrate ships a diagram (as a resource) the walker can show.

**The progressive-substrate model breaks down at lesson count > 10.** Sample workshop has 2; this has 13. Cumulative state across 13 lessons may be noisy or hard to reset. Mitigation: chunk 3 explicitly tests "manually apply lessons 1-13 in sequence" before chunk 4 starts; if reset semantics get ugly, fall back to per-phase sub-substrates (Phase A substrate, Phase B substrate, etc.) which sacrifices progress continuity for cleanliness.

## Execution

This spec is the umbrella. Each chunk gets its own feature in `feature-workflow`'s backlog (via `feature-workflow:feature-capture`). When a chunk is ready to start, `feature-workflow:feature-autopilot` drives it through plan → reviewer gate → implement → reviewer gate → ship-merged-PR.

Order is sequential: 1 → 2 → 3 → 4 → 5 → 6 → 7. No parallelism in v1 (chunks have real dependencies on each other and the work is solo).

The next session's first action: `feature-workflow:feature-init` (one of the four repos — likely `learning-with-court` as the project's "front door"), then `feature-workflow:feature-capture` for chunk 1 (Clerk auth).

## Reference patterns to lean on

- `~/GitHub/schuettc/mixcraft-app/packages/mcp-server/src/auth/clerk-jwt.ts` — Clerk bearer validation (chunk 1)
- `~/GitHub/schuettc/learning-with-court-sample-substrate/.claude/hooks/session-start.sh` — adaptive-context-into-session pattern (chunk 2)
- `~/GitHub/schuettc/claude-code-mcp-workshop/workshop/lesson_NN_*/` (each) — starter code shape per lesson (chunk 3)
- `~/GitHub/schuettc/claude-code-mcp-workshop/plugin/skills/lesson-NN-*/SKILL.md` — walker prose source material (chunks 4, 5, 6)
- `~/GitHub/schuettc/learning-with-court-workshops/workshops/sample/` — `LessonDefinition` shape and authoring conventions (chunks 4, 5, 6)
