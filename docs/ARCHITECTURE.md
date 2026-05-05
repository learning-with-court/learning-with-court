# Architecture: Hybrid Hosted-MCP Workshop

## High-level shape

Each workshop is **two pieces**:

1. **Hosted MCP server** (the heavy lift) — Lambda + DynamoDB + an OAuth Authorization Server. Holds curriculum, expected outputs, rubrics, per-learner progress. Exposes the workshop via MCP primitives (tools + prompts + resources). Authenticated; per-learner state.
2. **Tiny companion plugin** (the polish) — ~50-100 lines of Claude Code plugin manifest. Hooks block edits to lesson-scoped files when the learner is mid-lesson. NLU mappings let the learner say "run verify" and have it dispatched as a tool call. Otherwise minimal.

The companion plugin is open-source-fine. The teaching is server-side; the plugin is just plumbing.

## Why hybrid (not pure hosted, not pure plugin)

Pure hosted MCP: the user invokes tools by name (`workshop.start_lesson(2)`). No edit-blocking. Loses the conversational pacing feel. ~70% of current quality.

Pure plugin (today's `mcp-workshop`): zero gating, full source visible, no per-user state, every learner has to clone. ~95% quality but bad delivery.

Hybrid: ~95% quality, server-side gating + content hiding, zero-clone install. Plugin handles only what MCP can't (hooks + NLU). This is what bettor-help and mixcraft-app land near, in different proportions — both ship Claude Code plugins alongside their hosted MCPs for higher-level UX.

## MCP primitive → workshop role mapping

| Primitive | What it carries | Example |
|---|---|---|
| **Tools** | Workshop state transitions: `start_lesson(N)`, `submit_verify_output(N, output)`, `next_step()`, `where_am_i()` | `workshop.start_lesson(2)` writes `{user, lesson, status: "in_progress"}` to DDB |
| **Prompts** | Walker scaffolding directed at the model: instructions for how to pace the lesson, what to ask, when to verify. Body is contributed by the workshop's `LessonDefinition.walkerPrompt`. | `lesson_walkthrough` prompt with arg `lesson_id` returns the walker prose. The model receives it and runs the lesson conversationally; in normal Claude Code use the learner doesn't see it inline, though they can fetch it via `prompts/get`. Treat as *model-directed* not *private*. |
| **Resources** | Lesson content meant to be displayed: code snippets, diagrams, READMEs | `mcp://workshop/lesson-2/instructions.md`, `mcp://workshop/lesson-2/sample-server.ts` |
| **Sampling** (optional) | Server asks client to ask the LLM something on its behalf | Server-side rubric: "ask the model whether the learner's verify output contains a 200 + correct JSON shape." Lets server logic remain dumb-rubric while the model interprets. Not strictly needed. |
| **Elicitation** (optional) | Server asks client to ask the user something | "Are you ready to move to lesson 3?" — gives the server a way to pause for user confirmation without burning a tool call. Not all clients support it; nice-to-have. |

The two unsupported teaching primitives — edit-blocking and free-text NLU — live in the companion plugin (Claude Code-specific).

## What MCP doesn't give us — privacy

MCP is a *delivery* substrate, not a *privacy* boundary. Three layers of leakage are inherent to the protocol and the runtime, and we don't fight them:

1. **`prompts/get` is part of the spec.** Any authenticated MCP client can list and fetch every prompt body the server registers. Claude Code surfaces this on demand. We can't add a "private prompt" flag — non-conformant clients wouldn't know what to do with it.
2. **The model receives the walker.** Once walker prose is in the model's context, a curious learner can ask "what instructions did you just receive?" and a helpful model will recite them. Hiding from `prompts/get` doesn't hide from the conversation.
3. **Server logs see everything.** Whoever operates the workshop server has CloudWatch (or whatever) access to every walker, every rubric, every learner submission.

The right mental model: walker prose is **model-directed instructional content**, not secret. Default-out-of-eyeline by client UX convention, not enforced privacy. That's still useful — single-source-of-truth, zero-friction updates, server-driven pacing — but the value isn't secrecy.

For workshops that need real privacy (paid-content gating, answer keys, premium-tier lessons), use **gated tools**: register tools whose handlers conditionally return content based on session state (e.g., `get_answer_key()` returns the body only if `session.completedLessons` includes the prerequisite). The privacy primitive is the *tool's runtime check*, not the prompt registration.

## The companion plugin (Claude-Code-only)

Minimum viable companion plugin for any hosted workshop:

```
plugin/
├── .claude-plugin/
│   └── plugin.json          # marketplace metadata + hook + skill registration
├── skills/
│   └── start-workshop/
│       └── SKILL.md         # entrypoint: "let's start the workshop"
│                             # → calls workshop.start_session() on the hosted MCP
└── hooks/
    └── pre-edit.ts           # PreToolUse on Edit/Write
                              # asks the MCP server "is this file in the
                              # learner's current lesson scope?"
                              # blocks if not
```

That's it. Maybe 80 lines total (200-400 realistic once `debug-my-mcp-server`, `onboard-aws`, and stdout-capture for verify-output land). The plugin is workshop-agnostic — the hosted server tells the hook what to block. One companion plugin can theoretically front any number of hosted workshops by reading the user's `.mcp.json` to find which workshop server is configured.

**Distribution: project-scoped install.** Learners install the plugin into the directory they're taking the workshop in (`<repo>/.claude/plugins/` or equivalent), not user-scoped. Two reasons: (1) the PreToolUse edit-blocking hook would fire against every project on the learner's machine if user-scoped, which is wrong; (2) project-scoping keeps workshop tooling bound to workshop work. Trade-off: re-install per workshop, but that's a one-line copy command we document.

## Server-side state model

Reuses bettor-help's session pattern (`/bettor-help/packages/mcp-server/src/bettor_help_mcp/sessions/repo.py`). One DDB table per workshop tenant:

```
WorkshopSessions
  PK: userId (from authenticated identity)
  SK: <none, or workshopId for multi-workshop tenants>
  attributes:
    currentLesson: int
    completedLessons: list[int]
    lessonResults: map<int, { passedAt: ISO, attempts: int, notes: str }>
    lastSeenAt: ISO
    activeBranch: optional<str>          # if learner is mid-lesson, which file scope is "live"
    ttl: epoch                            # auto-purge inactive sessions
```

`SessionMiddleware` (port from bettor-help) hydrates this on every request before any tool/prompt fires. Tools enforce prereqs server-side: `start_lesson(5)` refuses if `lessonResults[4]` isn't passed.

## Server-side content model

Two layers:

1. **Static lesson content** — committed to the workshop repo, deployed as Lambda assets or DDB rows. One row/file per lesson, schema TBD but probably:
   ```yaml
   lesson_id: 2
   title: "Hello MCP"
   prerequisites: [1]
   resources:
     - uri: "mcp://workshop/lesson-2/instructions.md"
     - uri: "mcp://workshop/lesson-2/sample-server.ts"
   prompt_body: |
     # Walker scaffolding (the "secret sauce")
     # System message: be a patient tutor.
     # Demonstration: explain server.tool(...), pause for user.
     # When user says "run verify": call submit_verify_output(2, ...) and
     # interpret the result against expected_outputs below.
   verify:
     expected_lines:
       - regex: "tools/list returned 1 tool"
       - regex: "ping → pong"
   on_pass:
     advance_to: 3
     unlock_resources: ["mcp://workshop/lesson-3/instructions.md"]
   ```

2. **Dynamic per-learner state** — DDB. Read by tools to gate access; updated by tools to advance progress.

## Auth

**Decision: Clerk for v1**, matching `mixcraft-app` and `bettor-help` for platform-wide consistency. The `OAuthAuthorizationServerProxy` construct is IDP-pluggable (so a future workshop can add a GitHub or custom adapter) but ships only the Clerk adapter today. Reference: `mixcraft-app/packages/mcp-server/src/auth/clerk-jwt.ts:37-52` for the bearer-validation pattern (try JWT verify first, fall back to userinfo round-trip).

The companion plugin doesn't care which IDP is used — Claude Code's MCP OAuth client follows RFC 9728 + RFC 8414 + RFC 7591 regardless.

Why Clerk over GitHub for the first workshop, even though the workshop *teaches* GitHub OAuth: keeping the workshop's *own* auth orthogonal to the auth-pattern being taught avoids confusing learners ("am I logged into the workshop or into the thing I'm building?"). The lesson-8/11 GitHub-App setup the learner does is for *their* deployed server, separate from how they authenticated to ours.

## Why HTTP API v2, not REST API v1

A subtle but load-bearing decision learned the hard way during `mcp-workshop`'s Phase C. REST API v1's `/prod` stage prefix breaks RFC 8414 path-insertion math from MCP clients (they request `https://<host>/.well-known/oauth-authorization-server/prod` — the API Gateway service router, no per-API route → unfixable 403). HTTP API v2's `$default` stage serves at the bare host so issuer-as-host works. Every workshop server in this repo defaults to HTTP API v2.

Cross-reference: `mcp-workshop/infra/src/stacks/api-stack.ts` and the lesson 11 walker prose in `mcp-workshop/plugin/skills/lesson-11-aws-deploy/SKILL.md` — that decision is a teaching moment for the URL-shape-as-auth-contract concept.

## Repository layout (proposed)

```
learning-with-court/
├── docs/                    # vision, architecture, roadmap, per-workshop plans
├── platform/                # shared scaffolding (CDK constructs, OAuth proxy,
│                            # SessionMiddleware, content-loader utilities,
│                            # companion plugin template)
├── workshops/
│   ├── mcp-workshop/        # the first workshop; ports the existing project
│   ├── <next-workshop>/
│   └── ...
└── companion-plugin/        # the shared Claude Code plugin (one across all workshops)
```

The split between `platform/` and `workshops/` is the same idea as `mcp-workshop`'s `workshop/shared/` — common infra reused across many lessons / workshops.

## Open questions for the first workshop

1. **Verification UX.** When the learner runs `pnpm verify` locally, how do they get the output to the server? Three options:
   - Companion plugin captures stdout, sends to `submit_verify_output`. Cleanest, requires the plugin.
   - User pastes output into chat; server parses. Plugin-free, less polished.
   - Server runs verification itself in a sandboxed Lambda. Most isolated, but means the server holds the user's code or runs against a fixture rather than their actual repo.
2. **How much of the existing `mcp-workshop` plugin behavior survives.** The walker prose was tuned over weeks. The hosted port has to preserve the conversational pacing without 1:1 copying — content moves to prompts/resources, but tone has to come through.
3. **Multi-tenant or single-tenant per workshop.** Easier to start one Lambda per workshop. Multi-tenant (one Lambda routing multiple workshops) is a v2 question.
