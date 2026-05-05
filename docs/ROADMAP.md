# Roadmap

## Phase 0 — Plan and validate (now)

- [x] Capture vision, architecture, reference projects (this `docs/`).
- [x] Initial-stack tooling: TypeScript + CDK + Lambda + DynamoDB + HTTP API v2 (matches `mcp-workshop`'s Phase C).
- [x] Auth provider for the MVP: **Clerk** — matches `mixcraft-app` and `bettor-help`, gives platform-wide consistency. The `OAuthAuthorizationServerProxy` construct is built IDP-pluggable from day 1 but ships only the Clerk adapter for v1; GitHub adapter is a future addition if a workshop's audience demands it.
- [x] Companion plugin distribution: **project-scoped** is the recommended install. User-scoped would fire the edit-blocking hook against every project on the learner's machine; project-scoped keeps the hook bound to the directory the workshop is being taken in. Documented in install instructions.
- [x] First workshop scope: port `mcp-workshop` lesson 1 end-to-end as proof of concept before porting the remaining 12.
- [ ] Verify-output-capture UX (PostToolUse-on-Bash stdout reliability): **deferred to Phase 2 spike** — prototype lesson 1, test the capture path with real learner sessions, fall back to paste-output if unreliable.

## Phase 1 — Platform scaffolding (~1 week)

Build the shared infrastructure once; reuse for every workshop.

- [ ] Repo layout: `platform/`, `workshops/`, `companion-plugin/`.
- [ ] `platform/cdk/` — reusable CDK constructs:
  - `OAuthAuthorizationServerProxy` (port from `mcp-workshop/infra/src/lambda/oauth-server.ts` + `api-stack.ts`'s OAuth routes) — parameterized by IDP (GitHub / Clerk / custom).
  - `WorkshopApiStack` — HTTP API v2 + Lambda integration + standard routes (`/mcp`, `/.well-known/*`, `/authorize`, `/oauth/callback`, `/token`, `/register`).
  - `WorkshopDataStack` — KMS + DynamoDB (`Sessions` table for per-learner state, `OAuthState` for the in-flight OAuth dance).
- [ ] `platform/server/` — reusable Lambda code:
  - `SessionMiddleware` (port from `bettor-help/packages/mcp-server/src/bettor_help_mcp/middleware.py`, TypeScript). Hydrates DDB session on every request.
  - `BearerValidator` (port from `mcp-workshop/infra/src/lambda/handler.ts`). In-process LRU cache, GET /user round-trip.
  - `ContentLoader` — reads lesson content from `workshops/<workshop-id>/content/` (or DDB), serves as MCP resources.
  - `RubricRunner` — takes verify-script output + rubric spec, returns pass/fail + targeted feedback.
- [ ] `companion-plugin/` — workshop-agnostic Claude Code plugin:
  - One skill (`start-workshop`): "let's start the workshop" → calls `start_session()` on whichever workshop server is configured in `.mcp.json`.
  - One PreToolUse hook on Edit/Write/MultiEdit: queries `is_file_in_lesson_scope(path)` against the active workshop server; blocks on no.
  - Optional: a small NLU mapping (`run verify` → `submit_verify_output`) via a `UserPromptSubmit` hook. Plugin works without it; nicer with it.

**Deliverable:** A platform package + companion plugin that's never been used to teach anything yet, but is ready for workshop authors to plug content into.

## Phase 2 — Port `mcp-workshop` lesson 1 (~3 days)

Validate the architecture with a single end-to-end lesson.

- [ ] `workshops/mcp-workshop/cdk/` — CDK app instantiating `WorkshopApiStack` + `WorkshopDataStack` with workshop-specific config.
- [ ] `workshops/mcp-workshop/content/lesson-01.yaml` (or .ts) — title, prerequisites (none), resources (the existing lesson 1 README), prompt body (port from `mcp-workshop/plugin/skills/lesson-01-setup/SKILL.md`), verify rubric (regexes against expected verify output).
- [ ] Deploy to a staging account.
- [ ] **End-to-end test**: install companion plugin, point `.mcp.json` at staging, say "let's start the workshop", complete lesson 1 the same way today's plugin walks it. Confirm:
  - Server-side session row created.
  - Lesson 1 prompt body fires; user sees the same conversational pacing.
  - User runs `pnpm verify` locally; submits output via tool call (or the plugin auto-submits via NLU mapping).
  - Server validates, marks lesson 1 complete, advances DDB row.
  - Tool `start_lesson(2)` works (lesson 1 is a prerequisite).
  - Tool `start_lesson(3)` fails with prerequisite-not-met error (lesson 2 wasn't done).

**Deliverable:** Lesson 1 of `mcp-workshop` deliverable as a hosted MCP. Compare quality side-by-side with the plugin-only version. Decide whether to proceed with the remaining 12 lessons, or pivot.

## Phase 3 — Port `mcp-workshop` lessons 2-13 (~2-3 weeks)

If Phase 2 validates the model, do the rest.

- [ ] Port lessons 2-6 (Phase A: stdio + primitives). Mostly content-shaping; no new infra.
- [ ] Port lessons 7-10 (Phase B: SQLite + OAuth + HTTP). Lessons 7+ have meaningful per-user state; the workshop server may need to track *the learner's* env vars (e.g., generated MCP_API_KEY hashes) rather than the learner running their own SQLite. Decide pattern.
- [ ] Port lessons 11-13 (Phase C: AWS deploy). **Recursive case**: lesson 13 is "wire Claude Code to your deployed MCP." Now the *workshop* IS a deployed MCP, and the learner is wiring their own. Make sure the meta doesn't break.
- [ ] Port utility skills: `where am i`, `add an MCP tool`, `debug my MCP server`, `onboard AWS`. Each becomes a server-side prompt + companion plugin trigger.
- [ ] Cohort handoff: existing cohort members migrate from the plugin to the hosted version. Walkthrough, FAQ, support.

**Deliverable:** `mcp-workshop` fully delivered as a hosted MCP. Plugin-only delivery deprecated.

## Phase 4 — Second workshop (validates the platform)

Pick a second workshop topic to prove the platform isn't just specialized to MCP-server-building. Candidates:

- **Building Claude Code plugins** — meta, but would showcase the platform's reusability.
- **Building agents with the Claude Agent SDK** — different domain, different prerequisites (Python + API keys + a sandbox to run agents in).
- **Building production OAuth flows** — extracts the lesson-10/11/13 thread of `mcp-workshop` into a standalone deeper dive.
- **Something the team has expertise in but hasn't been written up** — chooseable.

Goal: validate that the platform's content schema, prompt structure, and rubric format work for a topic that's *not* MCP servers. Surfaces missing primitives.

## Phase 5+ — Suite expansion

Once two workshops are deployed, the bottleneck moves from "can we build the platform" to "what do we want to teach next." Open-ended.

## Cross-cutting concerns (track throughout)

- **Telemetry**: per-lesson completion times, drop-off rates, common errors. Built into the SessionMiddleware from day 1.
- **Cohort management**: enrollment, group progress views, instructor-side dashboards. Probably v2.
- **Content authoring ergonomics**: how does a workshop author add a lesson without becoming a CDK expert? Maybe a CLI: `npx learning-with-court add-lesson <workshop-id> --title "..." --prereqs 4`. v2.
- **Zero-keystroke workshop start**: SessionStart hooks load context but Claude Code's model can't speak first — turn 1 is always the user's. To skip the "type something to begin" friction, the substrate (or the future companion plugin's `/setup-workshop` flow) can ship a wrapper script that launches CC with an initial prompt: `claude "let's start the workshop"`. CC opens, the seed becomes turn 1, the model greets immediately. Useful for non-technical learners. Discovered while spiking the SessionStart hook in `learning-with-court-sample-substrate`. Defer until the companion plugin is in scope; until then, README tells learners to type "hi" or similar.
- **Multi-client support**: the server is client-agnostic in principle. Validate by walking lesson 1 from MCP Inspector + claude.ai's connector, not just Claude Code. v1+ but worth checking before committing to plugin-specific patterns.
- **Pricing / gating**: not in scope for v1. The architecture supports it (entitlement check in `SessionMiddleware`); decision deferred.

## Stop conditions

If any of these hit, pause and reconsider:

- Lesson 1 hosted version feels noticeably worse than plugin version even with the companion plugin installed. → Re-architect or accept the quality delta.
- The companion plugin can't reliably block edits from the server's perspective (e.g., hooks fire too late, block the wrong files, race the tool call). → Plugin gets bigger; reconsider whether "tiny plugin" was the right framing.
- MCP clients (specifically Claude Code) change their OAuth client behavior in ways that break our Authorization Server proxy. → Track upstream; have a fallback plan.
