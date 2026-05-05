---
shipped: 2026-05-05
---

# Shipped: Phase B Walker Port (Lessons 7-10)

## What landed

Four new `LessonDefinition` entries in `learning-with-court-workshops/workshops/mcp-workshop/src/lessons/`, plus updated `index.ts`:

| Lesson | Title | Walker covers |
|---|---|---|
| 7 | API keys + SQLite | Auth-before-authorize pattern; `hashApiKey` + `validateApiKey`; `WHERE user_id = ?` multi-tenancy boundary; immutable migrations |
| 8 | GitHub OAuth | **Explicit identity-confusion framing** (Workshop Clerk vs server's GitHub OAuth); AES-256-GCM at-rest encryption; lazy refresh with skew; mock-vs-real fork on Phase C plans |
| 9 | HTTP transport | "Transport is just a transport" — same `buildServer`, new `createHttpApp` wrapper |
| 10 | Local PKCE | Five-stage staged verify mapping the four-call dance + replay rejection. End of Phase B (no `advanceTo`). |

`index.ts` updated: `lessons` array now includes lesson01..lesson10; description mentions Phase B is available.

## Lesson 8 identity-confusion framing — confirmed

The walker prompt opener (verbatim):

> Two authentication systems are involved in this lesson — let's name them now to avoid confusion. **Workshop auth (Clerk)** is how you signed in to take this workshop. **GitHub OAuth** is the feature you're now building into your MCP server. Your workshop session and your server's GitHub auth are completely independent — both are real, neither is the other.

Reinforced throughout the lesson; "Two auths, briefly" paragraph also in the lesson resource body.

The lesson 8 fork is in walker prose: walker asks early "do you plan to deploy to AWS in Phase C?"; routes to either real GitHub App setup or mock-only. Both branches produce a passing verify.

## Verify rubric pattern (same as Phase A)

`narrate.ts`-style: `mustInclude: [/^✔/m, ...lesson-specific markers]`, `mustNotInclude: [/^✘/m, /verify failed/i]`. Per-lesson markers chosen against actual `verify.ts` output:

- L7: `lesson 07 verified`, `registered fresh user`
- L8: `lesson 08 verified`, `whoami`
- L9: `lesson 09 verified`, `HTTP MCP listening`, `list_notes over HTTP`
- L10: `lesson 10 PKCE flow verified`, `/authorize`, `/token`

L7-L10 omit the `Error:` exclusion (consistent with L4) — error narration in those lessons can render as `✔` because `McpError` doesn't carry `isError: true` for resources/tools in those code paths.

## Sanity checks (all green)

- `pnpm typecheck` in workshops repo passes (both workspace projects clean).
- All 20 `targetFiles` paths verified in `learning-with-court-mcp-workshop-substrate/workshop/lesson_0[7-9]_*/` and `lesson_10_*/`.
- All 4 `verifyCommand` package names match substrate `package.json` `name`s exactly.
- Verify markers cross-checked against actual `process.stdout.write` / `console.log` lines in the source verify scripts.

## Still deferred (same as Phase A)

- **Platform deploy / routing decision** unchanged. mcpWorkshop now has 10 lessons in code; the platform Lambda still registers only `sampleWorkshop`. The deploy decision (new Lambda stack vs. multi-register on existing) is its own future chunk.
- **E2E walker testing** depends on deploy.
- **Substrate access for testers** still private.

## TODOs

- Lesson 8's mock-vs-real fork tested only in walker prose so far — chunk 7 first-user-test will surface whether the framing actually prevents confusion in practice.
- Lesson 9 verify uses an in-memory transport (not a live HTTP server on a port), so the rubric matches in-memory output. If the verify changes to spin up a real server, the rubric needs revisiting.
- Lesson 10's browser-interaction beats in walker prose haven't been e2e-tested — same dependency on deploy.

## Pushed branches

- `learning-with-court-workshops` `feature/phase-b-walker-port` — content (5 files, ~1035 lines)
- `learning-with-court` `feature/phase-b-walker-port` — plan tracker

## Unblocks

Chunk 6 (Phase C — lessons 11-13). Same authoring pattern. Phase C has the recursive-case + AWS-prereq concerns called out in its idea.md.

The deploy chunk (whenever it lands) is also unblocked — the platform now has 10 lessons of mcp-workshop content ready to register.
