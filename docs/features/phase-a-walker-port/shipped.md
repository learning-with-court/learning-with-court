---
shipped: 2026-05-05
prs:
  - https://github.com/schuettc/learning-with-court-workshops/pull/<TBD> (mcp-workshop content)
  - https://github.com/schuettc/learning-with-court/pull/<TBD> (plan + shipped tracker)
---

# Shipped: Phase A Walker Port (Lessons 1-6)

## What landed

A new workshop directory `learning-with-court-workshops/workshops/mcp-workshop/` with six `LessonDefinition` entries — one per Phase A lesson:

| Lesson | Title | Walker covers |
|---|---|---|
| 1 | Setup | `ping` tool + in-memory `testClient` smoke |
| 2 | Hello | First real Zod-validated tool, `local-notes` track only (github-stars deferred) |
| 3 | Schemas | Multi-tool design, `NoteId`/`Tag` shared types, `NOT_FOUND` vs idempotent-delete asymmetry |
| 4 | Resources | Static + templated resources; tool-vs-resource verb test |
| 5 | Prompts | Prompts as user-invoked rituals; `argsSchema` vs `inputSchema` |
| 6 | Testing | Phase A capstone; contract tests + fixtures |

Plus:
- `workshops/mcp-workshop/src/index.ts` — `WorkshopDefinition` aggregating the 6 lessons; `companionRepo` points at `learning-with-court-mcp-workshop-substrate`.
- `workshops/mcp-workshop/package.json` — `@lwc-workshops/mcp-workshop`, mirrors sample's shape with file-link to `@lwc/server`.
- `workshops/mcp-workshop/tsconfig.json` — extends the workspace base.

## Verify rubric pattern

All six lessons' verify scripts use mcp-workshop's `narrate.ts` helpers (tsx-driven, not vitest). Generic rubric: `mustInclude: [/^✔/m, ...lesson-specific markers]`, `mustNotInclude: [/^✘/m, /verify failed/i, /Error:/]`. Per-lesson markers chosen for false-positive resistance:

- L1: `ping`. L2: `local-notes`, `create_note`. L3: `NOT_FOUND`, `create_note`, `search_notes`. L4: `notes://list`, `notes://item`. L5: `summarize_note`, `weekly_review`. L6: `^✔.*has a usable description/m` (unique to verify-06's per-primitive transcript), plus `create_note` + `notes://list`.

L4 omits the `Error:` exclusion because its negative-probe path involves an expected `McpError` narrated as `✔` (resources don't have `isError: true`). L6's verify is unusual — emits per-primitive `→ inspect ... description: <name>` blocks; rubric tuned accordingly.

## Sanity checks (all green)

- `pnpm typecheck` passes — both `workshops/sample` and `workshops/mcp-workshop` clean.
- All 18 `targetFiles` paths verified to exist in `learning-with-court-mcp-workshop-substrate/workshop/lesson_NN_*/`.
- All 6 `verifyCommand` package names match the substrate's `package.json` `name` fields (`@workshop/lesson-NN-<name>`).

## Deferred — chunk 4 ships content-only

Per Option A in plan.md (the recommended path for chunk 4):

- **Platform handler.ts unchanged.** The Lambda still registers only `sampleWorkshop`. `mcpWorkshop` is *code-ready* — `import { mcpWorkshop } from "@lwc-workshops/mcp-workshop"` works — but not yet routed.
- **No new deployment.** No new Lambda stack. The substrate's `.mcp.json` continues sharing the existing `lwc-spike` URL.
- **No e2e walker testing.** Walker prose for mcp-workshop can't actually drive a learner end-to-end until either (a) a new mcp-workshop Lambda stack is provisioned, or (b) the existing Lambda multi-registers workshops with prefixed tool names.

These are deliberate. The deploy-routing decision is its own chunk worth of work and shouldn't gate chunk 4's content authoring.

## Next deploy step (when we want to run mcp-workshop end-to-end)

Two options to consider when we get there:

- **Option A: New Lambda stack.** Cleanest — one workshop per Lambda. New CDK stack `LwcMcpWorkshopStack` mirroring `LwcSpikeStack` but registering `mcpWorkshop` instead. `.mcp.json` in mcp-workshop-substrate updated to point at the new endpoint.
- **Option B: Multi-register on existing Lambda.** Smaller infra. Update `registerWorkshop()` (or write a parallel function) to namespace tool names by workshop id. Both workshops share one Lambda; clients distinguish via `.mcp.json` server-name routing — except both substrates' `.mcp.json` files currently point at the same URL, so this requires changes there too.

Option A is probably cleaner for v1. Worth its own feature/chunk when we're ready.

## What I'll need from you (when deploying)

Eventually, but not for chunk 4 ship:

- Decision on Option A vs Option B (above).
- If Option A: nothing user-action; I can stand up the new stack.
- If Option B: minor coordination on tool-name conventions.

## Substrate access for testers

The mcp-workshop-substrate repo is private. Anyone testing chunk 4's walkers would need GitHub collaborator access to clone it. When we open up real-user testing (chunk 7), we'll need to either make the substrate public or invite collaborators explicitly.

## TODOs

- Track 2 of lesson 2 (`github-stars`) intentionally not driven; mentioned as "advanced — come back after the workshop." Re-author + ship as a follow-up if real users want it.
- Walker prose for any lesson hasn't been e2e-validated against a real learner yet. Tone tuning + level-aware section calibration happens during chunk 7's first-user-test.

## Unblocks

Chunk 5 (Phase B walker port — lessons 7-10) and chunk 6 (Phase C — lessons 11-13). The same authoring pattern applies; same substrate; same `LessonDefinition` shape. Phase B has the meta-confusion challenge (workshop's auth vs the auth the learner is building) — flagged in chunk 5's idea.md.

The next deploy step (multi-workshop routing) is also unblocked — it can be its own chunk slotted in whenever needed; doesn't block Phase B/C content authoring.
