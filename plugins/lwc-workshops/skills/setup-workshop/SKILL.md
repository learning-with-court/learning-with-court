---
name: setup-workshop
description: Use this when the user wants to start a learning-with-court workshop they don't have set up yet — phrases like "I'd like to learn <topic>", "I want to learn how to <build X>", "teach me <topic>", "help me get started", "set up a workshop", "start a workshop", "set up the <name> workshop", "begin the lwc workshop". In Claude Code this drives the clone of the workshop's project codebase via the @learning-with-court/cli into a folder under the user's working directory (or `~/learning-with-court/` by default) and tells the user how to start a fresh session there; the list of available workshops is fetched live from `lwc catalog`. In Claude Cowork (claude.ai / Desktop) there is no host CLI — follow the skill's surface check, which routes the learner to the lwc connector + workshop-orchestrator flow instead. Do NOT use this if the user is already inside a workshop project (look for a .mcp.json with an `lwc-*` server entry — they're already set up).
---

You're setting up a learning-with-court workshop for the user.

## Stay quiet about internals — read this first

Do every surface and routing check **silently**. Which surface you're on,
whether you're inside a workshop project, which skill should drive — all of
that is INTERNAL plumbing the learner must never see. Don't narrate it, and
don't preface the catalog with step-by-step rationale for your tool calls.

Specifically, never say things like "let me check which surface I'm on", "I'm
on Claude Code", "the Code-surface path", "Step 1 is non-optional", or name
which skill you're switching to — and never mention "surface", "surface
contract", "director flow", or "Cowork" to the learner.

**Your first learner-visible output is a short greeting plus the workshop
catalog** (the grouped list from `lwc catalog`) — nothing before it. A
friendly one-liner ahead of the list is fine ("Here's what's available to set
up:"). All the routing, surface, and gating logic below must still HAPPEN —
just do it silently and lead with the catalog. (The one exception is a genuine
failure the learner must act on — e.g. `lwc` not installed, or a Cowork
session with no connector — which you surface per the relevant section.)

## Surface check — do this FIRST

Everything below this section is for **Claude Code** (a terminal session on
the user's machine). If you are running in **Claude Cowork** (claude.ai or
the Claude desktop app — a sandboxed environment with no access to the
user's terminal, home directory, or host-installed CLIs), STOP here and run
none of the CLI steps. Workshops in Cowork aren't cloned; they run through
the **lwc connector** and the **workshop-orchestrator** skill:

1. If lwc workshop tools are available in this session, hand off to the
   workshop-orchestrator skill and let it drive.
2. If no lwc tools are available, the connector isn't set up yet. Point the
   user at the one-page guide — <https://workshop.institute/add-to-claude>
   (the claude.ai tab): Customize → Connectors → lwc → Connect, then come
   back and say "let's start a workshop." Never instruct a Cowork user to
   run shell commands.

If you're unsure which surface you're on: Claude Code sessions have a fixed
working directory on the user's machine and a Bash tool that runs host
commands; Cowork sessions don't.

## Background

learning-with-court hosts technical workshops as deployed MCP servers. The
`@learning-with-court/cli` (npm) is the universal entry point — it does
auth, clone, refresh, registry, and proxies MCP for in-workshop sessions.
This skill is a thin wrapper that drives the CLI's `setup` subcommand.

By convention, workshops install to `<parent>/<workshop-id>/`. The default
parent is `~/learning-with-court/`, but if the user is in a sensible working
directory (e.g. they ran `mkdir ~/learning-with-court && cd ~/learning-with-court`
first), use that as the parent instead. The CLI tracks installs in
`~/.lwc/workshops.json` regardless of where they live.

## Critical constraint: Claude Code's CWD is fixed

Claude Code's working directory is set at process start and can't change
mid-session. So this skill ends at "the project is cloned and the user
has a clear `cd && claude` to run." That handoff is unavoidable.

## Available workshops

The current catalog is fetched live by the CLI. Run this in Bash to see
what's available in the user's environment:

```bash
lwc catalog
```

**`lwc catalog` already groups its output — present it the way the CLI
grouped it; don't re-sort or flatten.** It renders two kinds of entries:

- A **series** prints as one block: a `<Series Title> (series)` header
  followed by its member workshops numbered in order (`1. <id>`,
  `2. <id>`, …) with each member's title, difficulty, and `Trigger:`
  phrase indented under it. A series is one learning path taken in
  order across its N workshops — treat it as a **single choice**, not N
  peers.
- A **standalone** workshop (a series-of-one) prints individually below
  the series blocks: `<id>`, then its title/difficulty/`Trigger:`.

So when you present the catalog to the user, mirror that grouping: show
each series as ONE option (its title, that it's an N-workshop series
taken in order, optionally a one-line tagline) and list standalone
workshops individually. Never list a series' member workshops as
separate peer choices and never reorder by difficulty.

Each entry includes a `Trigger:` phrase showing the install phrasing the
user might say. Match the user's request:

- **If the user named a workshop or series** (id or title fragment),
  confirm the match by stating which one and what it teaches; ask only
  if their phrasing is ambiguous. For a series match, confirm the
  series (not a single member).
- **If the user's phrasing is generic** ("I want to learn about X",
  "start a workshop", "let's begin"), list the available options as the
  CLI grouped them — each series as one entry, each standalone
  individually, with one-line titles — and ask which one they want. Do
  NOT auto-pick even if one is a strong tag/title match — generic
  phrasing means intent isn't established.
- **If only ONE option is in the catalog AND the user named it or used
  a topic word that's unambiguous for it**, default-pick it but say its
  title + one-line summary in your confirmation so the user can correct.
- **If multiple options match**, list candidates and ask.
- **If the user picked a series**, see the series-setup note in Step 3:
  you set up its FIRST (order-1) member; the orchestrator carries the
  learner through the rest in order.
- **If the user named a workshop or member that's `(coming soon)`**,
  tell them politely it isn't ready yet — don't try to set it up.

## Steps

### 1. Confirm which workshop (always do this — never skip)

This step is mandatory, but keep that fact to yourself — never tell the
learner a step is "non-optional" or narrate that you're on it.

**Run `lwc catalog` FIRST, before any other step.** Parse the output.
Apply the matching rules above. The user should ALWAYS see what's in
the catalog OR a clear statement of which workshop you're about to
install and what it teaches.

**Never go to Step 2 without having either listed the catalog to the
user OR confirmed an unambiguous single match.** Semantic guesses are
not confirmation; if you "feel" you know the answer without enumerating
the catalog, you're skipping Step 1 — go back and run `lwc catalog`.

This rule has two failure modes that get hit in practice and that you
MUST avoid:

1. **User says the install.sh example phrase verbatim** ("I'd like to
   learn how to build an MCP server"). That phrase is anchoring copy
   from the landing page — treat it like any other natural-language
   request. Run `lwc catalog`, see what's available, list candidates
   if MCP-anything matches more than one workshop, ask. Do NOT
   default-pick `mcp-workshop` without listing the catalog just
   because the words "MCP server" are present.
2. **User says something generic** ("I'd like to start a workshop",
   "what workshops are there?", "let's begin"). Generic phrasing
   means intent isn't established. Run `lwc catalog`, list the
   options as the CLI grouped them — each series as one entry, each
   standalone individually, with one-line titles — and ask.

If you've run `lwc catalog` and the catalog has exactly one workshop
in `status: available` AND the user named a topic that's unambiguous
for that workshop, default-picking is fine. In every other case, ask.

If `lwc env switch dev` is active, the catalog you fetch reflects the
dev set. Mention the active env in your confirmation when it's not
prod — e.g. "Setting up `evals-workshop` (from the dev catalog) at
`<path>`." Get the active env from `lwc env current` if you need to
double-check; the catalog's URL already reflects the same setting.

### 2. Gating prereqs

Run silently; surface only failures:

- `node --version` — must be v20+. If older, recommend nvm.
- `git --version` — must be installed.
- **`command -v lwc` — must succeed.** This is the gating check; pass
  ONLY when the binary exists on PATH. `lwc --version` is supported
  (CLI ≥ 0.3.1) and useful for displaying the version informationally,
  but don't conflate the two — `command -v lwc` is the existence test.
  The `lwc` binary (the `@learning-with-court/cli` npm package,
  installed globally) is the entry point for all workshop operations.
  If it's missing, do NOT try to fall back to `npx -y` — that path is
  blocked by Claude Code's auto-mode classifier and produces a worse
  experience for everyone. Surface this exact message and stop:

  > It looks like `lwc` is not installed. The learning-with-court CLI
  > needs to be installed once before the plugin can set up workshops.
  > Run this in your terminal, then come back and try again:
  >
  > **macOS / Linux / WSL:**
  > ```
  > curl -fsSL https://workshop.institute/install.sh | bash
  > ```
  >
  > **Windows (PowerShell):**
  > ```
  > irm https://workshop.institute/install.ps1 | iex
  > ```

That's it. **No `gh` CLI, no GitHub account, no API keys.** First-run
sign-in happens via browser when the CLI runs (or during the install
script if the user opted into the auth step).

### 2a. Detection-based fast-forward

After the gating prereqs pass, silently probe the user's environment
for components that are already installed. When all requirements for a
step are already satisfied, **skip that step and surface a single
one-line confirmation** — no explanation, no setup ladder.

**Canonical detection helpers** (run each as its own Bash call):

| Helper | Command | Satisfied when |
|---|---|---|
| Anthropic API key | `grep -q '^ANTHROPIC_API_KEY=' .env && echo "present" \|\| echo "missing"` | stdout is `present` |
| Claude Code | `which claude` | exit 0 |
| Workshop directory | `test -f workshop.yaml` | exit 0 (run from install path) |
| Clerk auth | `lwc auth whoami` | exit 0 |

On Windows, replace `which claude` with `Get-Command claude` (consistent
with existing cross-platform notes in this skill).

**One-line confirmation pattern.** When detection finds a satisfied
requirement, render exactly one line and move on:

> ✓ Claude Code installed (`claude` 1.x.x). Moving on.
> ✓ `ANTHROPIC_API_KEY` is set. Moving on.
> ✓ Workshop directory exists at `<path>`. Moving on.

**Hard constraints:**

- Detection MUST NOT auto-run lesson `verify` on the learner's behalf.
  Pacing stays learner-driven; detection only collapses already-handled
  setup steps.
- Detection MUST NOT use time-based heuristics to gate progress.
- Detection only *reads* state — it does not auto-install missing
  components. If a check fails, guide the learner to install/configure
  the missing piece normally.

### 2b. Pace signals (informational, no blocking)

Probe the user's environment (read-only, informational). The probes no longer choose
the pace — every learner starts at `slow` (see 2c) — but the signals are still worth
collecting: surface any failed probe as a setup issue to fix.

**Announce the probes before running them**, in one line, so the user
knows these are read-only tool checks — not authentication. Watching
`gh auth status` scroll by reads as "it's using my GitHub credentials";
it isn't, and workshop access never touches their GitHub account. Say
something like:

> Taking a quick read-only look at which dev tools you have — this only
> tunes the workshop's pace; none of it is used for workshop access.

**Run each probe as its OWN Bash call, not as one combined command.**
Claude Code's auto-mode classifier blocks multi-tool environment-
introspection batches (it reads them as broad system reads). One probe
per Bash call evaluates each on its own merits and passes cleanly.
Prefer compact single-purpose commands; surface only failures.

Probes (each its own Bash call):

| Signal | Bash | True if |
|---|---|---|
| `gh` | `gh auth status` | exit 0 (only run if `gh` exists) |
| `pnpm` | `pnpm --version` | exit 0 |
| `node20+` | already known from step 2 | per step 2 |
| `aws_profile` | `aws configure list-profiles` | stdout has ≥1 line |
| `shell_dotfiles` | `test -s ~/.zshrc \|\| test -s ~/.bashrc` | exit 0 |
| `gitconfig` | `git config --global user.name` | stdout non-empty |

If any individual probe is blocked or errors, mark its signal as
`unknown` and continue.

### 2c. Persist the pace (no question)

Persist `pace: slow` for every learner — do not ask, do not offer a menu. Write it to
`.claude/lwc-workshop.local.md` and move on to step 3.

Mention it in ONE passing line (not a question, no wait):

> I've set the workshop to its default pace — thorough, with explanations before the
> mechanics. If it ever feels slow, say so and I'll switch you to a faster pace.

### 3. Decide where to install, then run setup

**Series → first workshop.** `lwc setup` takes a *workshop* id, not a
series id. If the user picked a series, the id you install is its
**order-1 member** — the workshop numbered `1.` in that series' block in
`lwc catalog`. Setup proceeds with that single id; tell the learner in
one line that the series runs in order across its N workshops and the
orchestrator will carry them through the rest. For a standalone, use its
id directly as before.

Resolve the install destination:

1. Get the user's CWD (`pwd` on POSIX; `$PWD` works in PowerShell too).
   Resolve `~` to the actual home directory.
2. If CWD looks like a sensible workshops folder — **not** `$HOME` itself,
   **not** `/`, **not** `~/Desktop`, **not** `~/Downloads`, and is writable —
   use `<CWD>/<workshop-id>/` as the destination.
3. Otherwise fall back to `~/learning-with-court/<workshop-id>/`.

Tell the user exactly where it's going in one line, e.g.:

> "Setting up `mcp-workshop` at `<resolved-dest>`. First run opens a
> browser for a one-time sign-in."

Then run (always pass `--dir` so the destination is explicit and the CLI
output matches what you told the user):

```bash
lwc setup <workshop-id> --dir <resolved-dest>
```

**Use the bare `lwc` binary, never `npx -y @learning-with-court/cli@latest`.**
The npx path is blocked by Claude Code's auto-mode classifier; the bare
binary path is what step 2's prereq check guarantees is on PATH.

The CLI auto-creates parent directories. If the user has expressed a
different preference (e.g., they explicitly said `~/Projects/...`), honor
that in `--dir`.

If the CLI errors:
- **"already exists and is not empty":** offer to run `lwc remove <id>` first or pick a different `--dir`.
- **Sign-in timeout / failed:** ask them to retry; the browser may have closed early.
- **"PROVISION_FAILED":** the platform couldn't mint a token. Surface the message verbatim.
- **"ENTITLEMENT_ACCESS_REQUIRED":** this workshop is gated — access opens through an **event**, and this is an intentional, expected boundary, **not a bug to route around**. Do NOT switch environments, grant access, log into another account, or otherwise try to defeat it. Tell the learner plainly: this workshop opens through an event (share the events link from the error message), and the free **`sql-intro`** workshop is open to try right now if they'd like a taste of how the system works. Then stop — don't retry.

### 4. Persist pace + signals

After the CLI finishes, use the destination you resolved in step 3 (it's
also printed verbatim in the CLI's `Done. Open the workshop:` line, and
recorded in `~/.lwc/workshops.json`). Then write
`<install-path>/.claude/lwc-workshop.local.md` with:

```markdown
---
pace: slow
written_at: 2026-05-09T04:21:26Z
signals:
  gh: true
  pnpm: true
  node20+: true
  aws_profile: false
  shell_dotfiles: true
  gitconfig: false
---

# learning-with-court workshop — local config

Written by setup-workshop based on a probe of your environment. Edit
`pace:` to override (`slow`, `balanced`, or `quick`). Restart the
workshop session for the change to take effect.
```

Write `pace: slow` (step 2c sets it for everyone). Get the timestamp from `date -u +%Y-%m-%dT%H:%M:%SZ`.

### 5. Hand off

Auto-detect OS via `uname -s`:
- `Darwin` / `Linux` / `MINGW`/`MSYS`/`CYGWIN` → bash/zsh form (`&&`)
- otherwise → PowerShell (`;`)

Print (substitute `<install-path>` with the actual resolved destination —
the same one the CLI printed and that's stored in
`~/.lwc/workshops.json`):

> ✅ `mcp-workshop` installed at `<install-path>`. Pace set to **`<pace>`** — the workshop will adapt accordingly. To change later, edit `<install-path>/.claude/lwc-workshop.local.md` and set `pace:` to `slow`, `balanced`, or `quick`; restart the workshop session for it to take effect.
>
> To start the workshop, open a new terminal and run:
>
> **macOS / Linux / WSL (bash/zsh):**
> ```
> cd <install-path> && claude
> ```
>
> **Windows (PowerShell):**
> ```
> cd <install-path-with-backslashes>; claude
> ```
>
> You can exit this session first with `/exit` or Cmd-Q.
>
> **When the new session opens, type `hello` to begin.** The workshop
> will greet you and start the first lesson.

### 6. Handy follow-ups (don't run unprompted)

If the user asks "what else can I do?":
- `lwc list` — show installed workshops
- `lwc update [<id>]` — pull updates
- `lwc remove <id> [--delete-files]` — uninstall
- `lwc auth status` — confirm signed in

### 7. Stop. Don't try to start the workshop.

After step 5, you're done. The workshop runs from inside the cloned
dir. If the user pushes, briefly explain why a fresh session is needed.

## Tone

Friendly, direct, brief. The goal is "set up fast and out of
your hair." If anything goes wrong, be specific about what to do next.

## Cross-platform notes

- The CLI (`@learning-with-court/cli`) is fully cross-platform — pure
  Node, no shell quirks.
- Only the `cd && claude` handoff differs per OS; the CLI itself
  doesn't care.

## Backward-compat note

Older clones (pre-v0.4.0) have a `level:` field instead of `pace:` in
`.claude/lwc-workshop.local.md`. The workshop's SessionStart hook reads
`pace:` first and falls back to `level:` if `pace:` is missing,
translating `beginner`→`slow`, `intermediate`→`balanced`,
`expert`→`quick`. Existing clones keep working until the user re-runs
setup or hand-edits the file. New clones written by this version always
use `pace:`.
