# Reference Projects

Three sibling repos that this project leverages. Each contributes specific patterns we'll port into the platform scaffolding. Citations are file paths + line numbers we should read first when implementing the corresponding piece.

## 1. `mcp-workshop` (the curriculum + the v1 architecture)

**Path:** `/Users/courtschuett/GitHub/schuettc/mcp-workshop/`
**GitHub:** <https://github.com/schuettc/mcp-workshop> (private)

The existing 13-lesson MCP-server workshop. Currently delivered as a Claude Code plugin + cloned repo. **This is the curriculum we're porting first** — every lesson, every walker, every verify rubric becomes a hosted-MCP equivalent.

### What it gives us

**Curriculum (the content):**
- 13 lessons across three phases: A (lessons 1-6, local stdio), B (7-10, local HTTP + OAuth), C (11-13, hosted Lambda).
- Each lesson has its own `workshop/lesson_NN_*/{README.md, src/, tests/, src/verify.ts}`. README is the public-readable explanation; verify is the rubric (passed/failed automated).
- Walker prose (`plugin/skills/lesson-NN-*/SKILL.md`) is the "secret sauce" — the conversational scaffolding that paces the user. **This becomes the body of MCP prompts in the hosted port.**

**Phase C reference architecture (the v1 of what we're building):**
- `infra/src/stacks/api-stack.ts` — HTTP API v2 + Lambda integration. Already migrated from REST v1 due to the path-insertion bug; this is the right starting point.
- `infra/src/lambda/oauth-server.ts` — RFC 9728 + RFC 8414 + RFC 7591 OAuth Authorization Server proxy. Holds GitHub `client_secret`, forwards token exchange. Reuse near-verbatim.
- `infra/src/lambda/handler.ts` — in-Lambda bearer validation with 5-min in-process LRU cache (replaces the deny-path-can't-customize-401 limitation of v2 Lambda authorizers). Reuse the auth shape; replace the MCP routing logic.
- `infra/src/stacks/data-stack.ts` — DynamoDB + KMS with envelope-encryption pattern (lesson 12's tools demonstrate this). Workshop sessions can reuse the same KMS key + envelope helpers if any per-user state is sensitive.
- `workshop/shared/src/oauth.ts` — `verifyPkce`, `generateAuthCode`, `generateAccessToken` helpers. Reuse from the platform package.

**Lessons-as-content:**
- The lesson 4 walker (resources) and lesson 5 walker (prompts) are the closest "we already teach this" examples — porting them to MCP-native primitives is meta-level on-brand.

### What we keep, what we replace

| Today | Hosted port |
|---|---|
| Walker SKILL.md (Markdown scaffolding) | MCP prompt body (returned by `prompts/get lesson_walkthrough_N`) |
| Lesson README.md | MCP resource (`mcp://workshop/lesson-N/instructions.md`) |
| `pnpm --filter @workshop/lesson-N verify` | Tool: `submit_verify_output(N, output)` |
| Lesson order in plugin manifest | Server-side prerequisite DAG in DDB |
| Edit-blocking via PreToolUse hook | Companion plugin hook + server-side `is_file_in_lesson_scope(path)` query |
| `where am i` skill | Tool: `where_am_i()` returning DDB session state |

## 2. `mixcraft-app` (the OAuth + minimal MCP shape)

**Path:** `/Users/courtschuett/GitHub/schuettc/mixcraft-app/`

A Spotify-adjacent playlist-collaboration MCP. **The reference for tool-centric servers and the cleanest Clerk auth integration.** Ships its own Claude Code plugin alongside the hosted MCP.

### What it gives us

**OAuth proxy pattern (for Clerk-backed workshops):**
- `packages/infra/src/constructs/mcp-api.ts:115-132` — HTTP API v2 with `defaultDomainMapping` (custom domain). When we add custom domains, this is the recipe.
- `packages/mcp-server/src/index.ts:95-112` — RFC 8414 discovery doc shape. `mcp-workshop` already mirrored this pattern; the original is here.
- `packages/mcp-server/src/auth/clerk-jwt.ts:37-52` — bearer validation pattern: try JWT verification first, fall back to userinfo round-trip. **Reuse for any Clerk-backed workshop** (different from `mcp-workshop`'s GitHub `/user` round-trip).

**Tool surface (~14 tools):**
- `packages/mcp-server/src/mcp-server.ts:49-435` — domain tools registered with input schemas. Pattern is what we'll mimic for workshop transition tools (`start_lesson`, etc.).
- Capability gating (premium-only tools): same shape as workshop prerequisite gating.

**Server-side state (transcripts):**
- `packages/mcp-server/src/mcp-server.ts:499-516` — the share-to-web feature persists conversation transcripts to DDB. **Adjacent pattern for workshops:** persist learner notes / submitted code per-lesson if we want to support "show me what I tried last time."

**Plugin-alongside-MCP precedent:**
- `README.md:37-58` — describes the playlist-assistant skill (Claude Code plugin) as an *optional* higher-level UX layer over the hosted MCP. Same model we want for workshops: hosted MCP is the source of truth; plugin is polish.

### What we don't reuse

- The "share to web" feature (not applicable to workshops).
- Spotify-domain-specific tools (obviously).

## 3. `bettor-help` (the session model + entitlements)

**Path:** `/Users/courtschuett/GitHub/schuettc/bettor-help/`

A multi-sport DFS analytics MCP. **The reference for stateful sessions, entitlement gating, and adapter-contributed prompt bodies.** Python-based; we'll adapt the patterns but write in TypeScript to match `mcp-workshop`.

### What it gives us

**Session model — port this near-verbatim:**
- `packages/mcp-server/src/bettor_help_mcp/sessions/repo.py` — DDB-backed session with `activeSport`, `entitledSports`, `lastSeenAt`, TTL=24h. **Workshop sessions look identical** with `currentLesson` / `completedLessons` / `lessonResults` swapped in.
- `packages/mcp-server/src/bettor_help_mcp/middleware.py` — `SessionMiddleware` hydrates the session on every request before tool dispatch. Workshop server gets the same middleware.

**Bootstrap pattern (entrypoint tools):**
- `packages/mcp-server/src/bettor_help_mcp/bootstrap/register.py:1-95` — `start_sport_session(sport)`, `switch_sport(sport)`, `preview_sport(sport)`. Maps to workshop's `start_workshop()`, `start_lesson(N)`, `where_am_i()`.

**Entitlement-driven tool visibility:**
- `packages/mcp-server/src/bettor_help_mcp/bootstrap/register.py:120-187` — only register tools the active sport supports. **The workshop equivalent is "only register lesson-N tools if lesson N-1 has passed"** — same pattern.

**Adapter-contributed prompts:**
- `packages/mcp-server/src/bettor_help_mcp/adapters/proto.py` — `PromptBuilder` protocol: each sport adapter contributes a prompt body. Workshops would do the same: each lesson contributes the body of `lesson_walkthrough` keyed on `lesson_id`.

**FastMCP transport choices:**
- `packages/mcp-server/src/bettor_help_mcp/app.py:54-128` — stateless HTTP+JSON transport (FastMCP). Good reference for "what does a clean MCP server entrypoint look like" even though we'll use TypeScript / Hono.

### What we don't reuse

- Python (we're TypeScript). We're porting the *patterns*, not the code.
- Sport-specific domain logic (obviously).
- FastMCP framework (we're on `@modelcontextprotocol/sdk` + Hono on Lambda).

## How they combine

```
                        ┌─────────────────────────────┐
                        │  learning-with-court/       │
                        │   platform/  workshops/     │
                        └─────────────────────────────┘
                          ▲           ▲          ▲
                          │           │          │
              ┌───────────┘           │          └───────────┐
              │                       │                      │
   ┌──────────┴──────────┐  ┌─────────┴──────────┐  ┌────────┴──────────┐
   │  mcp-workshop       │  │  mixcraft-app      │  │  bettor-help      │
   │                     │  │                    │  │                   │
   │  curriculum content │  │  Clerk OAuth       │  │  Session model    │
   │  HTTP API v2 stack  │  │  proxy pattern     │  │  Entitlement      │
   │  GitHub auth proxy  │  │  Companion plugin  │  │   gating          │
   │  PKCE primitives    │  │  precedent         │  │  Prompt builder   │
   │  Envelope crypto    │  │  Discovery shape   │  │   protocol        │
   │  CDK + Lambda       │  │                    │  │                   │
   └─────────────────────┘  └────────────────────┘  └───────────────────┘
```

`mcp-workshop` is the heaviest contribution — it's the curriculum AND the architectural reference. `mixcraft-app` contributes a cleaner OAuth path (when we want Clerk) and the plugin-alongside-MCP precedent. `bettor-help` contributes the stateful-session + entitlement-gating model that's specifically what workshops need (and that the others don't fully demonstrate).

## Reading order for someone joining this project

1. `mcp-workshop/README.md` + `mcp-workshop/workshop/lesson_01_setup/README.md` — what a workshop *is* today.
2. `mcp-workshop/plugin/skills/lesson-04-resources/SKILL.md` — what a walker looks like (the secret sauce we're hiding).
3. `mcp-workshop/infra/src/stacks/api-stack.ts` + `mcp-workshop/infra/src/lambda/oauth-server.ts` — the Phase C architecture we'll lift.
4. `bettor-help/packages/mcp-server/src/bettor_help_mcp/sessions/repo.py` + `middleware.py` — the session model.
5. `bettor-help/packages/mcp-server/src/bettor_help_mcp/bootstrap/register.py` — adapter / entitlement pattern.
6. `mixcraft-app/packages/mcp-server/src/index.ts` — minimal MCP server with OAuth + tools.
7. `mixcraft-app/packages/infra/src/constructs/mcp-api.ts` — HTTP API v2 with custom domain (when we want one).
