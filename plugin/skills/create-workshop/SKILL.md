---
name: create-workshop
description: Walks an author through designing a new learning-with-court workshop BEFORE any code is scaffolded. Produces a docs/WORKSHOP_PLAN.md design artifact covering scope, lesson list, pedagogical decisions, cost discipline, dependencies, and voice — then gates the `gh repo create --template` fork behind explicit approval. Use when the author says "create a new workshop", "I want to author a workshop", "let's design a workshop", "start a new workshop repo", "new lwc workshop", "build a workshop", "author a workshop", or otherwise signals intent to author (not consume) a learning-with-court workshop. Do NOT use for setting up an existing workshop as a learner — that's `setup-workshop`.
---

You're helping an author design a new learning-with-court workshop.

## Why this skill exists

The mechanical path (`gh repo create --template workshop-template`,
fill in TODOs, register in `workshops.json`) makes it easy to ship a
workshop that hasn't had its pedagogical decisions surfaced. Drift
gets discovered later when a learner walks the workshop and asks
"wait, why am I doing it this way?" — and the fix is then a multi-PR
retrofit across already-published lessons.

This skill gates scaffolding behind a structured planning conversation.
Author leaves the conversation with a written `docs/WORKSHOP_PLAN.md`
that names every load-bearing decision before any lesson file gets
written.

The shape mirrors `feature-workflow:feature-plan`: gather context →
produce artifact → explicit approval → execute. Never code (or
scaffold) without a plan.

## Hard rule: no scaffolding until the plan is approved

Do NOT run `gh repo create`, write any file in a new workshop repo,
or fork the template until the author has explicitly said "approve",
"looks good, scaffold it", or equivalent. The whole point of this
skill is preventing premature commitment to design choices. If the
author asks to "just fork the template and we'll figure it out as we
go" — that's exactly the pattern this skill exists to interrupt.
Push back politely and offer to walk a fast version of the planning
phases instead.

## Pedagogy context (binding)

Before asking any question, internalize these conventions from the
existing workshops — they're the standard the new workshop will be
measured against:

- **Skills are skills, not slash-commands.** Every walker, utility,
  and orchestrator is model-invocable with third-person descriptions
  and 4–8 trigger phrases. See
  `learning-with-court-mcp-workshop/docs/WORKSHOP_SPEC.md` §0.
- **Lessons are learner-driven.** The learner runs verify, writes
  code, edits files. The agent inspects state silently and guides.
  Never auto-run verify on the learner's behalf.
- **No "free credits cover the workshop" framing.** Per
  `honest-cost-language`: costs are stated honestly per-call, per-model.
  The agent never shell-checks for an API key in the user's environment.
- **No internal-history voice in lesson prose.** Per
  `drop-internal-history-voice`: don't write "an older version of
  this lesson…" — write the lesson, don't narrate its development.
- **Lead with the heart, earn the drills.** Per
  `walker-code-reveal-chunking`: chunk multi-file reveals; the
  pedagogical core lands before the mechanical scaffolding.

Reference these as you walk the author through the phases below.
If an answer would violate one of these rules, surface that immediately
rather than baking the violation into the plan.

## The six planning phases

Walk the author through each phase in order. **One question at a time.**
Prefer multiple-choice when reasonable; open-ended is fine when it
matters. For each phase, capture the answers — at the end you'll
render them into `docs/WORKSHOP_PLAN.md`.

If the author already has a clear answer for a phase, accept it and
move on; don't drill into questions whose answers are settled. The
phases are a checklist, not a script.

### Phase 1 — Workshop scope

Goal: get a one-paragraph elevator pitch on the table.

Questions to ask (in order, one per turn):

1. **Topic in one sentence.** "What does the learner walk away knowing
   how to build?" — answer must fit in a single sentence.
2. **Target persona.** Skill level (beginner / intermediate / advanced),
   what the learner already knows, what they don't.
3. **Prereqs.** Language fluency? Accounts (Anthropic, AWS, GitHub,
   etc.)? Tools (Node, pnpm, Docker, etc.)?
4. **Cost shape.** Which lessons hit a paid API? Rough $ per learner
   walking the whole workshop, at default cap.
5. **Series membership.** "Is this workshop part of a multi-workshop
   series that learners should walk in order?" If yes, capture:
   - `series.id` — kebab-case identifier shared by all workshops in
     the series (e.g. `claude-certified-architect`). Confirm with the
     author before settling on it — it's hard to rename later.
   - `series.title` — human-readable series name (e.g. "Claude
     Certified Architect"). Same value across all members.
   - `series.order` — 1-indexed position of this workshop within the
     series. Ask for the intended order and confirm no sibling has
     already claimed that position.
   Remind the author that the same `series` block must be added to
   both `workshop.yaml` **and** the `workshops.json` registry entry
   for the platform to render the series grouping and prev/next links.
   If the answer is "no" or "not sure yet", capture `series: null`
   in the plan and move on — it can be added later.

**Do not ask about duration / hours / "how long will this take."**
Time estimates from this skill are unreliable and bake a false promise
into the plan. The lesson list (Phase 2) and phase grouping carry the
"how big is this" signal — that's the right granularity. If the author
volunteers a duration, capture it as their estimate; never generate one.

### Phase 2 — Lesson list

Goal: name every lesson with a one-line outcome and an ordering rationale.

Questions:

1. **Lesson titles + one-line outcomes.** Author lists them. Format:
   `L1 — <title>: learner ends with <concrete artifact>.` Push for
   *outcomes*, not topics. "Learner ends with a working extract tool"
   beats "intro to tool use."
2. **Ordering rationale.** For each lesson Ln, what does it assume
   from L1..Ln-1? Where does the pedagogical thread carry? If two
   lessons could swap order, why is the current order right?
3. **Phase grouping.** Workshops typically chunk into A/B/C phases
   (fundamentals → extension → optional). What's the split here?

### Phase 3 — Pedagogical decisions (the load-bearing phase)

This is where retrofit pain gets prevented. Do NOT let the author defer.

Questions:

1. **Canonical patterns per lesson.** For each lesson: what's the
   "this is the right way" pattern the learner will use? Examples
   from existing workshops:
   - mcp-workshop L1: structured output via **tool use** (Anthropic
     tools API), not system-prompt-coerced JSON.
   - mcp-workshop L4: data exposure via **resources with templated
     URIs** when the data is addressable, **tools** when the action
     has side effects.
   If an author can't name the canonical pattern, that's the signal
   to slow down — the pattern needs to be picked *now*, not after
   four lessons are shipped.
2. **Canonical reference implementation per lesson.** For every
   **write-pedagogy** lesson: what's the canonical reference
   implementation — the authoritative answer to whatever the learner's
   TODO replaces? This ships as `src/canonical.<ext>` alongside the
   learner's target file, and CI runs **both** the canonical and the
   learner's filled-in target against the same fixtures and asserts
   both match `expected.json`. This catches three drift modes the
   current tests miss: stale `expected.json` (canonical edited,
   expected not regenerated), dataset drift (seed data changed,
   canonical now inconsistent with expected), and README/canonical/expected
   silently disagreeing. Decide per lesson:
   - Will the canonical be **checked-in** (visible to learners — this
     is the recommended default; cheating is fine, the workshop is
     hands-on, not graded), or **hidden inside the test file** (only
     if exposure would undermine a specific puzzle)?
   For **read-pedagogy** lessons: confirm "the lesson source IS the
   canonical" — no separate `canonical.<ext>` file is needed and none
   should be created.
3. **Cross-lesson coherence.** Which patterns ripple through multiple
   lessons? Tool use, error handling, schema validation, auth shape —
   pick the load-bearing ones and confirm they're consistent.
4. **"You might see this elsewhere" alternatives.** For each canonical
   pattern, what's the alternative the learner might encounter in
   other docs/tutorials? Lessons should name the alternative and
   explain why the canonical choice is canonical here.
5. **Edit affordances.** What "play with this" experiments does each
   lesson offer the learner? Workshops without edit affordances
   degrade into read-only docs.
6. **HARD vs SOFT user gates.** Where does the walker REQUIRE the
   learner to run something / answer something before continuing
   (HARD), vs simply offer to move on (SOFT)? Auto-proceeding past
   a HARD gate is the bug pattern from mcp-workshop's pace prompt.

### Phase 4 — Cost discipline

Per `honest-cost-language`. No hedging.

Questions:

1. **Per-lesson API call count.** Per learner, at default cap. Distinguish
   model calls from tool/utility calls.
2. **Per-call cost.** By model. Use real numbers — Sonnet 4.6 input/output,
   Haiku 4.5, Opus 4.7 — not "cheap" or "a few cents."
3. **Default-cap policy.** Most lessons cap at 10 items unless
   `--full` is passed. What's the per-lesson cap here? What does
   `--full` unlock?
4. **What's free.** Mocked tests, structural judges, cache hits,
   anything that doesn't bill against the user's API key. Be explicit —
   the learner deserves to know.
5. **Framing rule.** The plan and the lesson prose state cost honestly
   per-call. They do NOT say "free credits cover this" or "the signup
   credit is enough." The agent never shell-checks for `ANTHROPIC_API_KEY`.

### Phase 5 — External dependencies

Questions:

1. **SDKs / providers.** Anthropic SDK? AWS SDK? Third-party APIs?
   List every external service the learner's code calls.
2. **Secrets.** What env vars does the workshop need? `ANTHROPIC_API_KEY`
   is the common case. AWS profile? OAuth client IDs?
3. **Secret handling convention.** Per workshop-template: secrets live
   in `.env`, populated via `lwc env set <workshop> <KEY>=<value>` or
   `lwc env populate`. The agent never asks for the key in chat.
   `.env.example` lists keys with empty values (no commented placeholders —
   per `env-example-empty-value-affordance`).
4. **Build dependencies allowlist.** If the workshop uses pnpm with
   native builds, the `onlyBuiltDependencies` allowlist must be set
   (per `workshop-build-scripts-allowlist`).
5. **Shared seed data.** Do ≥2 lessons read the same data — a sample
   SQLite DB, a RAG fixture corpus, golden eval outputs? If yes, plan
   to drop it under `workshop/shared/` and provision via
   `pnpm setup-shared` (edit `scripts/setup-shared.ts` with the
   download/generate logic; keep it idempotent). Content-only workshops
   ignore this slot — leave it empty.

### Phase 6 — Voice + style

Questions:

1. **Workshop shape.** Read-pedagogy (evals-workshop: learner mostly
   reads + runs scripts) or write-pedagogy (mcp-workshop: learner
   writes code in target files)? Affects walker tone *and* whether
   the block-edits hook is needed.
2. **Block-edits hook.** Write-pedagogy workshops need
   `.claude/hooks/` that block edits outside target files (so the
   agent can't bypass the learner's hands). Read-pedagogy workshops
   typically don't.
3. **Concept-vs-concept framing.** Lesson prose names concepts and
   contrasts them. It does NOT narrate the workshop's development
   history ("an older version of this lesson…") — per
   `drop-internal-history-voice`.
4. **First-encounter cross-links to landing explainers.** Per
   `landing-explainer-cross-linking`: when a lesson introduces a
   workshop-wide concept (secrets, env, refresh, runtime model),
   walker links to the landing explainer the first time the concept
   appears. Confirm the author knows which explainers exist on
   `workshop.institute` and plans cross-links accordingly.

## Render the plan

Once all six phases are done, write `WORKSHOP_PLAN.md` to
`learning-with-court-base/` (the coordination repo's root — this skill
is invoked from there). The scaffolding step will move it into the new
workshop's `docs/` dir. Use this template, populated from the answers:

```markdown
# Workshop Plan: <workshop-id>

*This is the source-of-truth design doc for this workshop. Significant
changes (new lesson, pattern shift, pedagogy change) update this plan
first; code follows.*

## 1. Scope

- **Topic:** <one sentence>
- **Persona:** <skill level + what they know>
- **Prereqs:** <list>
- **Duration:** <hours>
- **Cost shape:** ~$<total> per full walkthrough at default cap
- **Series:** <series id + title + order, or "standalone">

## 2. Lessons

| # | Title | One-line outcome | Phase |
|---|-------|------------------|-------|
| 1 | <title> | <outcome> | A |
| 2 | <title> | <outcome> | A |
| … | | | |

**Ordering rationale:** <why this order>

## 3. Pedagogical decisions

| Lesson | Pedagogy | Canonical pattern | Canonical reference impl | "You might see…" alternative |
|---|---|---|---|---|
| L1 | write | <pattern> | `src/canonical.<ext>`, checked-in | <alternative + why canonical wins> |
| L2 | read | <pattern> | lesson source IS canonical (n/a) | <alternative + why canonical wins> |
| … | | | | |

**Canonical reference policy:** every write-pedagogy lesson ships
`src/canonical.<ext>` (the authoritative answer); CI asserts both the
canonical AND the learner's filled-in target match `expected.json`
against the same fixtures. Read-pedagogy lessons omit the file — the
lesson source itself is canonical.

**Cross-lesson patterns:** <which ripple through>

**Edit affordances:** <per-lesson "play with this">

**HARD gates:** <list>
**SOFT gates:** <list>

## 4. Cost discipline

| Lesson | Model | Calls per learner | $/call | Default cap |
|---|---|---|---|---|
| L1 | <model> | N | $X | 10 items |
| … | | | | |

**What's free:** <list>

**Framing rule:** costs stated honestly per-call. No "free credits cover
this." Agent never shell-checks for API key.

## 5. Dependencies

- **SDKs / providers:** <list>
- **Secrets:** <list of env vars>
- **Secret handling:** `lwc env set` / `lwc env populate`; `.env.example`
  lists keys with empty values; agent never prompts for keys in chat.
- **Build allowlist:** <pnpm onlyBuiltDependencies entries>

## 6. Voice + style

- **Shape:** <read-pedagogy | write-pedagogy>
- **Block-edits hook:** <needed | not needed>
- **Framing:** concept-vs-concept, no internal-history voice.
- **Landing cross-links:** <which explainers the lessons link to>

---

*Plan created via the `create-workshop` plugin skill.*
```

Save it to `learning-with-court-base/WORKSHOP_PLAN.md` for now (it'll
move into `learning-with-court-<id>/docs/WORKSHOP_PLAN.md` once
scaffolding runs).

## Approval gate

After writing `WORKSHOP_PLAN.md`, stop and ask:

> "Plan written to `WORKSHOP_PLAN.md`. Review it and let me know —
> **approve** to scaffold the workshop repo, or tell me what to revise."

Wait for explicit approval. Do NOT proceed to scaffolding on
ambiguous responses ("looks fine I guess", "sure whatever"). If the
author seems hesitant, ask which phase needs more thought.

## Scaffolding phase (only after approval)

After the author approves, run the template-fork flow.

**Template (binding).** The only template to fork from is
`learning-with-court/workshop-template`. Do not invent variants
(`learning-with-court-workshop-template`, `workshop-template-v2`,
etc.) — they don't exist. If `gh repo view learning-with-court/workshop-template`
fails, stop and surface the error; do not substitute.

**Repo name (binding).** Match the existing org pattern:
`<topic>-workshop`, kebab-case, no `lwc-` prefix. Precedent in the org:
`mcp-workshop`, `evals-workshop`. For a series, qualify the topic
(`sql-intro-workshop`, `sql-joins-workshop`) so siblings have room.
Confirm the exact `<id>` with the author before running `gh repo create` —
this is the one human-in-the-loop step in scaffolding. Do NOT default
to a generated name.

**Clone location (binding).** The new workshop is cloned **inside the
`learning-with-court-base/` coordination repo**, as a sibling of the
other workshops:
```
learning-with-court-base/
├── learning-with-court-mcp-workshop/
├── learning-with-court-evals-workshop/
├── learning-with-court-workshop-template/
└── learning-with-court-<id>/    ← new clone goes here
```
Local directory name has the `learning-with-court-` prefix (matches the
other workshops' local dir names); the **remote** name on GitHub does
not (it's just `<id>`). `learning-with-court-base/.gitignore` already
ignores `learning-with-court-*/` so the new clone doesn't pollute the
base repo. Do NOT clone into the author's cwd, `~/`, or anywhere else —
the base repo is the coordination root and every workshop lives under it.

The variable `<local-dir>` below stands for `learning-with-court-<id>`.

**Repos stay private (binding).** Every workshop repo under the
`learning-with-court` GitHub org is **and remains private — there is
no "flip to public when ready" step**. Do not offer it, do not include
it in the hand-off message, do not document it as a future action.
The author has standing instruction on this; treat it as a hard rule.

How the publish/install pipeline actually works (so the agent never
suggests `gh repo edit --visibility public` as a "fix"):

1. **The shared GitHub App holds the credentials.** A GitHub App named
   `learning-with-court` is installed on the org with read access to
   every workshop repo. Its private key + installation ID live in AWS
   Secrets Manager as `LwcSharedGitHubApp-Dev` and `LwcSharedGitHubApp-Prod`.
2. **Per-workshop Lambdas read that secret.** Each registered workshop
   gets a `LwcWorkshop-<id>-<Env>` Lambda (provisioned by CDK from the
   platform repo's `workshops.json`). The Lambda's env wiring includes
   the shared App secret. The Lambda is reachable as
   `<id>.workshop.institute` (prod) or `<id>-dev.workshop.institute` (dev).
3. **`lwc setup <id>` calls the Lambda** to mint a short-lived GitHub
   App installation token, runs `git clone` against the private repo
   using that token, and immediately strips the token off the local
   `origin` remote. The learner's clone has an un-credentialed HTTPS
   origin from that point onward.
4. **Refreshes work the same way.** Inside Claude Code the learner runs
   `/refresh-workshop`; from the shell, `lwc update <id>`. Either path
   mints a fresh token, runs the pull, strips the token. **Plain
   `git pull` would prompt for credentials and stall** — that's the
   design, not a bug.
5. **GitHub App authorization is the one manual gate.** When a brand-new
   workshop repo is created, the org admin must explicitly add it to
   the `learning-with-court` App's "Repository access" list. The
   hand-off message at the end of this skill covers that step.

Authors do not need to grant individual learner access to the repo;
the shared App handles it. Authors do not need to flip the repo
public to make `lwc setup` work; it never has worked that way.

If the author asks "should we make the repo public?", the answer is
**no**, and the explanation is the five-step pipeline above. If they
push back, route them to the existing precedent: `mcp-workshop` and
`evals-workshop` are both private and have always been.

1. **Fork the template.** After the author confirms `<id>`, run from
   `learning-with-court-base/`:
   ```bash
   gh repo create learning-with-court/<id> \
     --template learning-with-court/workshop-template \
     --private
   git clone git@github.com:learning-with-court/<id>.git learning-with-court-<id>
   ```
   **The repo stays `--private` forever.** Do NOT offer to flip it
   public — not at scaffold time, not after the workshop ships, not
   ever. See **"Repos stay private (binding)"** below for why and how
   install works without public access.

   Two-step (create-then-clone, no `--clone` flag) so the local
   directory name carries the `learning-with-court-` prefix while the
   remote stays as `<id>`. Clone lands at
   `learning-with-court-base/learning-with-court-<id>/`.

2. **Move `WORKSHOP_PLAN.md` into the new repo:**
   ```bash
   mv WORKSHOP_PLAN.md learning-with-court-<id>/docs/WORKSHOP_PLAN.md
   ```

3. **Populate `learning-with-court-<id>/workshop.yaml`** from the
   plan's outputs: `id`, `title`, `tagline`, `summary`, `difficulty`,
   `tags`, `youWillBuild`, `prerequisites`, `phases`. Fill every TODO.
   Keep `status: coming-soon` until the workshop ships. (No `duration`
   field — it was removed from the template manifest.)

4. **Populate `learning-with-court-<id>/landing.md`** from the plan's
   scope + lesson list. Long-form prose: what the learner builds, how
   it works (per-lesson loop), who it's for.

5. **Create empty lesson directories** via the generator — do NOT
   hand-copy the template. For each lesson in the plan:
   ```bash
   pnpm new-lesson <NN> <slug> [--phase A|B|C]
   ```
   This copies `workshop/lesson_01_template/` → `workshop/lesson_<NN>_<slug>/`,
   rewrites `package.json` name, `lesson.yaml` id + verifyCommand, the
   walker filename + frontmatter + trigger phrases, and appends the
   `<NN>-<slug>` key to the right phase in `workshop.yaml`. Refuses to
   overwrite an existing dir. Default `--phase` is `A`. Don't fill content
   yet — that's the next phase.

   Other lifecycle scripts to know about:
   - `pnpm rename-lesson <old-NN> <new-NN>` — renumber a lesson, sweeping
     every reference (dir name, ids, walker file, manifest, prereqs).
   - `pnpm sync-workshop-yaml` — dry-run diff between `workshop.yaml`
     and filesystem; `--write` applies; `--check` exits non-zero on drift.
     Use this if `pnpm lint-manifest` flags a discrepancy.

6. **Configure `.env.example`** with the secret names from Phase 5
   (empty values, no placeholders, per
   `env-example-empty-value-affordance`), or delete it if the workshop
   uses no secrets.

After Step 6 the shell is ready. Move into the lesson-drafting phase
below — do NOT stop here.

## Lesson-drafting phase (one lesson at a time)

Now draft each lesson's actual content from the plan. **One lesson at a
time, with author review between each.** This is where the plan's
pedagogical decisions become real lesson code, walker prose, and verify
rubrics — the load-bearing translation from spec to learner experience.

For each lesson Ln in plan order, do all of the following, then stop
and ask the author to review before moving to Ln+1.

### Per-lesson drafting checklist

For lesson Ln:

1. **`workshop/lesson_NN_<slug>/lesson.yaml`** — fill every field per
   the plan: `id`, `title`, `blurb`, `prerequisites` (prior lesson ids),
   `targetFiles` (paths the learner will edit; empty array for setup-only
   lessons), `verifyCommand`, `verify.description`, `verify.mustInclude`
   regex array, `verify.mustNotInclude` if applicable, `onPass.feedback`
   (2–3 sentence handoff into Ln+1).

2. **`workshop/lesson_NN_<slug>/package.json`** — set the package name
   to `@workshop/lesson-NN-<slug>`. Add deps the lesson needs (e.g.
   `@anthropic-ai/sdk` if the lesson hits Claude). Wire scripts:
   `verify` (runs the lesson's verify script), `test` (runs vitest).

3. **`workshop/lesson_NN_<slug>/src/`** — draft the lesson code per the
   plan's pedagogy shape:
   - **Write-pedagogy lessons:** target files contain TODO markers the
     learner replaces. The shape compiles + the verify script runs but
     fails until the TODO is filled. Comments name the canonical pattern
     (Phase 3) and link to the "you might see…" alternative.
   - **Write-pedagogy lessons — `src/canonical.<ext>` (MANDATORY).**
     Alongside the learner's target file, write a canonical reference
     implementation: the authoritative answer to the TODO. This is the
     file `expected.json` was generated from, and CI runs it against
     the same fixtures the learner's target is checked against. Without
     it you can't detect stale `expected.json`, dataset drift, or
     README/canonical/expected disagreement. Default: checked-in and
     visible to learners (the workshop is hands-on, not graded). Hide
     inside the test file only if exposure would undermine a specific
     puzzle — decision recorded in Phase 3.
   - **Read-pedagogy lessons:** code is finished and runs end-to-end;
     learner reads + executes + observes. No TODOs in `src/`. **Do NOT
     create `src/canonical.<ext>`** — the lesson source IS the canonical.
   - **Defensive parsing, fence stripping, retry:** copy the canonical
     shapes from `learning-with-court-workshop-template/workshop/lesson_01_template/src/extract.ts`
     when the lesson reads model output as JSON. Don't reinvent.

4. **`workshop/lesson_NN_<slug>/src/verify.ts`** — the verify script
   the learner runs. Pattern: import the target module, exercise it,
   print `✔ <message>` on each passing assertion and `✘ <message>` on
   failure. The `mustInclude` / `mustNotInclude` rubric in `lesson.yaml`
   greps this output. Keep verify deterministic — no live API calls
   unless the lesson is explicitly about live calls.

5. **`workshop/lesson_NN_<slug>/tests/`** — vitest tests for the target
   module. Tests run on every commit via lefthook + CI; they exercise
   the *finished* shape (so write-pedagogy tests pass once the learner
   fills the TODO, and fail before). **For write-pedagogy lessons,
   tests MUST include a "canonical matches expected" assertion in
   addition to the "target matches expected" assertion** — both
   `src/canonical.<ext>` and the learner's `src/<target>.<ext>` are
   exercised against the same fixtures and both must match
   `expected.json`. See the documented pattern in
   `workshop/LESSON_TEMPLATE.md` (template repo). The canonical
   assertion is what catches stale expected fixtures and dataset
   drift — without it the test suite can pass while the workshop is
   silently broken.

6. **`workshop/lesson_NN_<slug>/README.md`** — learner-facing prose,
   H1 matches `lesson.yaml.title`. Sections per `WORKSHOP_SPEC.md`:
   - **What you'll do** — one paragraph, concrete outcome.
   - **Why this matters** — connect to the plan's canonical pattern.
   - **Steps** — ordered, learner-actionable. Reference target files
     by path. Show the verify command.
   - **You might also see** — the alternative pattern from Phase 3
     and why this lesson uses the canonical one. (Concept-vs-concept
     framing per `drop-internal-history-voice` — never narrate the
     workshop's authoring history.)

7. **`learning-with-court-<id>/.claude/skills/lesson-NN.md`** — the walker skill. The
   `pnpm new-lesson` generator already stamps the frontmatter + slim
   shape; you're filling in the per-lesson content. Required shape:
   - **Frontmatter** (generator-stamped, you adjust trigger phrases):
     `name: lesson-NN`, third-person `description` with 4–8 trigger
     phrases (e.g. `"start lesson 3"`, `"lesson 3"`, `"do lesson 3"`,
     `"<topic> lesson"`).
   - **Top-of-file note** (generator-stamped): a link to
     `.claude/skills/_walker-base.md`, which holds the shared
     conventions — visible walkthrough contract, learner-driven rule,
     HARD vs SOFT gate semantics, read-the-state-silently pattern,
     style, verify-is-diagnostic framing. Do NOT duplicate those
     sections in the per-lesson walker — link, don't restate.
   - **Per-lesson H2 sections** (you write these): `Pedagogical
     priority`, `Steps`, `What To Say Next`, and `Common debugging`
     only if there are lesson-specific failure modes. Drop the
     `Common debugging` section entirely if there aren't.
   - Honor HARD vs SOFT gates from Phase 3 — HARD gates require
     learner action before the walker proceeds; SOFT gates offer to
     advance. (Gate semantics live in `_walker-base.md` — just name
     which steps are HARD vs SOFT here.)
   - Lead with the heart per `walker-code-reveal-chunking`: the
     pedagogical core lands in prose first; multi-file code reveals
     come chunked, not all at once.
   - **Critical:** never write "invoke this skill" or "use the Skill
     tool" — walker files are read directly by the learner-facing
     agent via `Read`. The read IS the activation.

8. **Add the lesson key to `workshop.yaml` `phases`** — append
   `<NN>-<slug>` to the right phase's `lessons` array.

### Per-lesson author review gate

After drafting Ln, stop and say:

> "Lesson NN drafted. Files written:
> - `workshop/lesson_NN_<slug>/{lesson.yaml, package.json, src/, src/canonical.<ext> (write-pedagogy only), tests/, README.md}`
> - `.claude/skills/lesson-NN.md`
> - `workshop.yaml` phase entry updated
>
> Want me to walk you through what I drafted before moving to lesson NN+1,
> or jump straight to NN+1?"

Wait for the author. Common author responses + how to handle them:

- *"Looks good, next."* → Move to Ln+1.
- *"Show me the walker first"* / *"Show me the verify."* → Read the
  file aloud (paraphrase + key snippets), then ask again.
- *"The canonical pattern feels off here."* → Stop. Re-open Phase 3
  for this lesson in `WORKSHOP_PLAN.md`, revise, then redraft. The
  plan is the source of truth — drift means the plan changes, not the
  lesson silently diverging.
- *"Let's restructure."* → If the change affects multiple lessons,
  pause drafting, update `WORKSHOP_PLAN.md`, then resume from Ln.

### After all lessons are drafted

Run validation:

```bash
cd learning-with-court-<id>/
pnpm install
pnpm lint-manifest             # cross-checks workshop.yaml against fs
pnpm sync-workshop-yaml --check # exits non-zero if manifest drifted from fs
pnpm typecheck                 # all workspace packages
pnpm setup-shared              # no-op unless this workshop has seed data
pnpm test                      # runs vitest across lessons
```

If `sync-workshop-yaml --check` fails, run `pnpm sync-workshop-yaml`
(dry-run) to inspect the diff, then `--write` to apply.

**Canonical assertions are part of `pnpm test`.** For every
write-pedagogy lesson, `pnpm test` runs both the `canonical matches
expected` and the `target matches expected` assertions against the
same fixtures. If `expected.json` is stale, seed data has drifted, or
the canonical and the target have diverged, this gate fails. Do not
hand off until `pnpm test` is green — a green typecheck with a red
canonical assertion means the workshop is silently broken.

Surface failures to the author and fix them before the hand-off
message.

## Hand-off (final step)

Once every lesson is drafted, reviewed by the author, and the validation
commands pass, deliver this message verbatim:

> Workshop repo scaffolded and lessons drafted at `learning-with-court-<id>/` (remote: `learning-with-court/<id>`). Remaining
> manual steps (these involve org-admin or learner-side actions you
> need to drive):
>
> 1. Authorize the GitHub App for the new repo: GitHub org settings
>    → Apps → `learning-with-court` → Configure → Repository access
>    → add `<id>`.
> 2. Register in the platform: open a PR against
>    `learning-with-court-platform/workshops.json` adding
>    `{ "id": "<id>", "repo": "learning-with-court/<id>", "ref":
>    "main", "envs": ["dev"] }`. CI deploys the dev Lambda.
> 3. Test as a learner: `LWC_API_URL=https://mcp-dev.workshop.institute lwc setup <id>`.
>    Walk every lesson end-to-end. Iterate on prose / verify rubrics
>    based on what you experience.
> 4. When the workshop is ready, flip the registry entry to
>    `"envs": ["dev", "prod"]` and merge.
>
> `docs/WORKSHOP_PLAN.md` is the source-of-truth design doc — update
> it before changing canonical patterns or adding lessons.

Do NOT do any of these four steps yourself — they involve GitHub org
admin actions, multi-repo PRs, and learner-side testing the author
needs to drive.

## When to use a fast path

If the author already has a `WORKSHOP_PLAN.md` from a prior session
and wants to scaffold, skip the planning phases and jump to the
scaffolding flow. Confirm the plan is current first ("any changes to
the plan before I scaffold?").

If the author is just exploring ("what would a workshop on X look
like?"), do Phases 1 + 2 only, write a short scope doc, and stop.
They'll come back with more clarity.
