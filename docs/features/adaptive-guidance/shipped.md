---
shipped: 2026-05-05
prs:
  - https://github.com/schuettc/learning-with-court/pull/1 (plugin)
  - https://github.com/schuettc/learning-with-court-sample-substrate/pull/1 (substrate hook)
---

# Shipped: Adaptive User-Level Guidance (plumbing)

## What landed

Two PRs, one per repo:

**`learning-with-court` (plugin) — PR #1:**
- `plugin/skills/setup-workshop/SKILL.md` — extends prereq probing to collect six tech-comfort signals (gh, pnpm, Node 20+, AWS profile, shell dotfile, gitconfig); buckets into `beginner|intermediate|expert`; writes `.claude/lwc-workshop.local.md` with frontmatter (`level`, `inferred_at`, `signals`) at clone time; updates handoff message to mention the inferred level + override path.
- `docs/superpowers/specs/2026-05-05-mcp-workshop-port-design.md` — adds a "Level-signal contract" section walker prose authors (chunks 4-6) read when implementing conditional sections.

**`learning-with-court-sample-substrate` — PR #1:**
- `.claude/hooks/session-start.sh` — parses `level:` from `.claude/lwc-workshop.local.md` frontmatter (awk-based, robust to quotes/whitespace); emits an "Inferred user level" block into the SessionStart context; falls back to `intermediate` on unparseable values; omits the block entirely when the file is absent (so substrates not set up via the skill keep working unchanged).
- `README.md` — new "Configured level" section explaining the file format + override path.
- `.gitignore` — adds `.claude/lwc-workshop.local.md` (per-user state, never committed).

## Verification

Hook smoke tests (run by the implementing agent, captured in plan.md Progress Log):

| Scenario | File state | Result |
|---|---|---|
| valid level | `level: beginner` | level block emitted with `beginner` |
| valid level | `level: expert` | level block emitted with `expert` |
| invalid level | `level: bogus_value` | level block emitted with `intermediate` (fallback) |
| no file | (deleted) | level block omitted entirely |

Plugin-side smoke test (running the skill end-to-end in a fresh CC session) is documented in the plan as a manual user step — it requires invoking the skill in a Claude Code session, which the agent can't drive. User runs it when convenient.

## What's still pending

- **Manual skill smoke test** (Step 7). User invokes the setup-workshop skill from a fresh empty dir against a fresh substrate clone; verifies the file is written with the right shape, the handoff message mentions the level, and the substrate's hook surfaces it on the next session start. Documented as a numbered checklist in `plan.md` Progress Log.
- **Conditional walker prose** doesn't exist yet — by design. The contract this feature established is what chunks 4-6 read from when authoring per-lesson walker prose. v1 success here is "the level signal flows end-to-end"; the per-lesson prose adapting to it is a chunk-4-and-onward concern.

## Deferred TODOs

- ML-based level inference (out of scope; revisit post chunk 7 first-user-test if the simple heuristic misclassifies often).
- Per-lesson level escalation (auto-bumping as the learner completes lessons; not v1).
- Server-side awareness of level (level stays purely client-side per the design decision).

## PRs

- [`learning-with-court` PR #1](https://github.com/schuettc/learning-with-court/pull/1) — plugin skill + spec footnote. Merged + branch deleted.
- [`learning-with-court-sample-substrate` PR #1](https://github.com/schuettc/learning-with-court-sample-substrate/pull/1) — hook + README + gitignore. Merged + branch deleted.

## Unblocks

- Chunk 3 (mcp-workshop-substrate) inherits the same hook pattern — when authoring its substrate's `.claude/hooks/session-start.sh`, copy the level-block logic verbatim.
- Chunks 4-6 (walker port phases) read the level via the contract documented in the spec.
