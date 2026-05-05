---
started: 2026-05-05
---

# Implementation Plan: Adaptive User-Level Guidance

## Overview

The platform's audacious bet is that the same workshop carries both senior devs and non-devs. That requires walker prose to *adapt* — patient when needed, terse when needed. This feature builds the **plumbing** for that adaptation: environment probe → inferred level → substrate-local config → SessionStart hook surfaces level → walker prose can read it.

The plumbing must work *before* walker content is authored (chunk 4 onward). v1 success is "the level signal flows end-to-end from setup through to walker context"; the conditional walker prose itself is built in chunks 4-6 against this contract.

This feature touches three repos:

- `learning-with-court` (plugin) — setup-workshop skill gains probe + write logic.
- `learning-with-court-sample-substrate` — SessionStart hook gains read + emit logic.
- (No platform changes for v1; the level is hook-injected context, not an MCP tool response.)

## Implementation Steps

- [x] Step 1: Define the contract.
  - Three levels: `beginner`, `intermediate`, `expert`.
  - File: `<substrate-root>/.claude/lwc-workshop.local.md`.
  - Format: YAML frontmatter + optional markdown body.
  - Frontmatter fields: `level: beginner|intermediate|expert`, `inferred_at: ISO-8601`, `signals: { gh: bool, pnpm: bool, node20+: bool, aws_profile: bool, shell_dotfiles: bool, gitconfig: bool }`. The `signals` block is informational — useful when debugging level disagreements; future inference improvements can read it.
  - The user can edit `level:` to override our inference. The hook trusts the file.

- [x] Step 2: Update `learning-with-court/plugin/skills/setup-workshop/SKILL.md`.
  - During the prereq check (current step 2 in the skill), don't just gate on missing tools — collect signals into a level inference.
  - After the clone (current step 4) and before the handoff (current step 5), write `<chosen-clone-path>/.claude/lwc-workshop.local.md` with the inferred level + signals + ISO timestamp.
  - Update the handoff message to mention: "I inferred your level as `<level>` based on what's installed. You can override by editing `.claude/lwc-workshop.local.md` after `cd`-ing in."

- [x] Step 3: Update `learning-with-court-sample-substrate/.claude/hooks/session-start.sh`.
  - At hook start, check for `$PWD/.claude/lwc-workshop.local.md`.
  - If present, parse `level:` from frontmatter (sed/awk; matches plugin-settings pattern from the plugin-dev:plugin-settings skill).
  - If absent or unparseable, default to `intermediate` (safe middle).
  - Add a section to the SessionStart context output:
    ```
    ## Inferred user level: <level>

    Based on environment probe at setup time. The user may not be a strong
    developer (`beginner`) or may be a senior engineer (`expert`); adapt
    walker prose depth accordingly. Tone hints:
    - beginner: explain *why* before *how*; spell out terminal commands fully
    - intermediate: explain new-to-this-lesson concepts; assume tools are familiar
    - expert: state the change concisely; trust the learner to fill in
    ```
  - The block is conditional on the file existing — if not (e.g., a substrate not set up via the skill), omit the section so existing test setups don't break.

- [x] Step 4: Update `learning-with-court-sample-substrate/README.md`.
  - Add a "Configured level" section explaining the file, the override path (`level: beginner` etc.), and that the file is gitignored (it's per-user state).
  - Add `.claude/lwc-workshop.local.md` to the substrate's `.gitignore`.

- [x] Step 5: Smoke test the plumbing.
  - Manually create `.claude/lwc-workshop.local.md` with `level: beginner` in the existing `~/GitHub/schuettc/learning-with-court-sample-substrate` clone.
  - Run `bash .claude/hooks/session-start.sh` and confirm the output includes the level block.
  - Edit to `level: expert`, re-run, confirm the output reflects the change.
  - Edit to `level: invalid`, confirm fallback to `intermediate` (with a warning if practical).

- [x] Step 6: Document the contract in `learning-with-court/docs/superpowers/specs/2026-05-05-mcp-workshop-port-design.md`.
  - Add a brief paragraph (or footnote) describing the file format + level enum + override path. Walker prose authors (chunks 4-6) read this when implementing conditional sections.

- [x] Step 7: Plugin test (deferred to manual run — see Progress Log below). Manually run the setup-workshop skill from a fresh empty dir against a fresh substrate clone; confirm:
  - Clone completes
  - `.claude/lwc-workshop.local.md` exists in the clone
  - File has expected frontmatter shape
  - Inferred level matches expectation given the test environment

## Progress Log

### 2026-05-05 — initial plumbing landed (agent)

Steps 1-6 implemented in a single pass. Step 7 (full skill smoke test)
deferred for manual run by the user, since it requires invoking the skill
in a fresh Claude Code session — outside what the implementing agent can
drive.

**Smoke-test results for Step 5 (hook script, run in
`~/GitHub/schuettc/learning-with-court-sample-substrate`):**

| Scenario | File state | Output of `bash .claude/hooks/session-start.sh \| grep "Inferred user level"` |
|---|---|---|
| 1 | `level: beginner` | `## Inferred user level: beginner` |
| 2 | `level: expert` | `## Inferred user level: expert` |
| 3 | `level: bogus_value` | `## Inferred user level: intermediate` (fallback) |
| 4 | file removed | (no match — section omitted) |

All four behave as designed. Test file removed before commit; not committed.

**Manual test plan for Step 7 (run when convenient):**

1. From a fresh shell in an empty dir, start `claude` with the
   `learning-with-court` plugin enabled.
2. Say "set up the sample workshop". The skill should run prereq checks,
   propose a clone path, and (after confirmation) clone the substrate.
3. After the skill finishes, `cat <chosen-path>/.claude/lwc-workshop.local.md`.
   Verify:
   - File exists.
   - Frontmatter has `level:`, `inferred_at:`, and a `signals:` block with
     six boolean fields (`gh`, `pnpm`, `node20+`, `aws_profile`,
     `shell_dotfiles`, `gitconfig`).
   - The `level:` value is one of `beginner | intermediate | expert`.
   - The handoff message mentioned the inferred level and the override
     path.
4. `cd <chosen-path> && claude`. On session start, the SessionStart hook's
   "Inferred user level" block should appear in the model's context (you
   can verify by asking "what's my inferred level?" — the model should
   read it from context).
5. Edit the file, change `level:` to a different value, restart `claude`.
   The new level should now appear.

## Technical Decisions

### Three levels, not five or seven

A finer gradation (e.g., `novice / beginner / intermediate / advanced / expert`) sounds nuanced but is impossible to test for and confuses authoring. Three is small enough that walker prose can cover all branches without explosion (`if level === "beginner" { ... } else if level === "expert" { ... } else { ... }`).

### Signal counting, not weighted ML

The inference is a count of "tech-comfort signals":
- `gh` installed + authenticated
- `pnpm` installed
- Node 20+
- AWS profile configured
- A non-default shell dotfile (`~/.zshrc` or `~/.bashrc` with non-zero size)
- A configured `~/.gitconfig` with `user.name` set

0-1 → `beginner`. 2-3 → `intermediate`. 4+ → `expert`.

This is deliberately simple. We can refine the heuristic post-chunk-7 (first user test) once we have actual data on how well the inferred level matches lived experience.

### File format: plugin-settings convention

`<substrate-root>/.claude/lwc-workshop.local.md` matches the plugin-settings convention documented in `plugin-dev:plugin-settings` — YAML frontmatter for structured fields, markdown body for free-form notes. Hook scripts can parse the frontmatter with sed/awk; future commands can read it via standard markdown parsers.

### Hook behavior when file is absent

Default to `intermediate`. Don't refuse to run, don't warn. A substrate that wasn't set up via the skill (e.g., fresh git clone outside the skill flow) should still work — just without adaptive guidance. The level block in the SessionStart output simply omits if no file is present.

### No MCP-server-side knowledge of level (yet)

The level is purely client-side state. The platform Lambda doesn't know about it. This keeps the platform's session model simple (`{ userId, workshopId, currentLesson, completedLessons }`) and avoids cross-cutting "level" through every MCP response. If we ever want the server to adapt (e.g., showing different rubric error messages by level), that's a future feature; for now, walker prose adaptation is sufficient.

## Testing Strategy

- **Hook-level**: shell test cases — file present with each of three valid levels; file absent; file with invalid level; file with extra unknown fields. Output should be predictable in all cases.
- **Skill-level**: hand-run the setup-workshop skill in two test environments (rich + stripped) and verify the inferred level differs.
- **End-to-end (subjective)**: in a fresh CC session in the substrate, observe whether walker behavior reflects the level. The sample workshop's walker prose is uniform today (no conditionals), so this is a "model knows the level exists" test, not a "walker adapts" test. Real adaptation testing comes in chunk 4+.

## Risks & Mitigations

### Risk: Level inference is wrong for the user

The heuristic is a guess. A senior dev who happens to use a fresh dotfiles-free Linux account looks like a beginner. **Mitigation**: the override path (`level:` in the file) is documented and easy. The walker on session start can mention "I inferred your level as X — change `.claude/lwc-workshop.local.md` if that's wrong." Self-correcting.

### Risk: Walker prose authors over-engineer conditionals

Once the level signal exists, every lesson author might be tempted to write three paragraphs per lesson — one per level. **Mitigation**: the design spec already says "conditional sections only where the level matters." Walker prose for chunks 4-6 should default to one tone (intermediate) and add conditional sections only for genuinely level-sensitive moments (e.g., explaining what `pnpm` is, or skipping AWS-profile setup explanation).

### Risk: The file becomes stale

If a learner's level changes mid-workshop (they finish lesson 1 and feel more confident), the file still says `beginner`. **Mitigation**: out of scope for v1. Self-update at lesson boundaries could be a future feature; for now, the user can re-edit manually.

### Risk: Hook scripts and YAML parsing in bash are fragile

Bash sed/awk YAML parsing is notoriously brittle. **Mitigation**: keep the file format ultra-simple (frontmatter only, no nested structures, all values quoted). Test with the exact format the skill writes.

## Out of scope (deferred)

- Server-side awareness of level (future MCP tool response field)
- Per-lesson level escalation (auto-bumping from beginner to intermediate as lessons complete)
- ML-based inference (semantic analysis of dotfiles, etc.)
- Plugin-test framework — we're hand-testing the skill, no plugin-test harness exists

## Cross-repo coordination

Three repos affected:

| Repo | What changes | Branch | PR |
|---|---|---|---|
| `learning-with-court` | `plugin/skills/setup-workshop/SKILL.md`; spec doc footnote | `feature/adaptive-guidance` | yes |
| `learning-with-court-sample-substrate` | `.claude/hooks/session-start.sh`; `.gitignore`; `README.md` | `feature/adaptive-guidance` | yes |
| `learning-with-court-platform` | none | n/a | n/a |

Two PRs, one per repo. Both can merge independently in any order — the skill change writes a file; the hook change reads it; if either lands first, the other arriving later just makes the system whole.
