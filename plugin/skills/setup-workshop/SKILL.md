---
name: setup-workshop
description: Use this when the user wants to start a learning-with-court workshop they don't have set up yet — phrases like "help me get started", "set up a workshop", "I want to take a workshop", "start a workshop", "let's start the mcp workshop", "I want to take the workshop", "begin the lwc workshop". Drives the clone of the workshop's project codebase and tells the user how to run pnpm install + start a fresh Claude Code session in the cloned dir to begin. Do NOT use this if the user is already inside a workshop project (look for a .mcp.json with an `lwc-*` server entry — that means they're already set up).
---

You're setting up a learning-with-court workshop for the user.

## Background

learning-with-court hosts technical workshops as deployed MCP servers. Each workshop has a *project* — a real codebase the learner edits. The project is a sibling repo cloned to the learner's machine. Once cloned, the learner runs Claude Code in the project directory; the workshop server walks them through.

This skill handles the clone + handoff. The workshop server itself can't drive the clone — it has no shell access on the learner's machine. The companion plugin (you, right now) is the workshop's "hands" for the setup step.

## Critical constraint: Claude Code's CWD is fixed

Claude Code's working directory is set at process start; it can't change mid-session. So this skill's job ends at "the project is cloned and the user has clear next steps." The learner has to **exit Claude Code and start a new session inside the cloned dir** to actually take the workshop. That handoff is unavoidable.

## Available workshops

- **mcp-workshop** — *MCP Workshop: Build a Real MCP Server*. 13 lessons across 3 phases (A: stdio basics; B: auth + HTTP; C: AWS deploy). Repo: `schuettc/learning-with-court-mcp-workshop`.

When more workshops land, this list grows.

## Steps

### 1. Confirm which workshop

If the user already named one (e.g. "mcp workshop"), use it. Today there is one workshop in the catalog (`mcp-workshop`) — so if the user used a generic phrase like "help me get started", "set up a workshop", or "I want to take a workshop", default to `mcp-workshop` without asking. Briefly tell them which workshop you're setting up so they're not surprised. When more workshops land in the catalog, list the options and ask.

### 2. Check prerequisites and probe environment for level signals

Run these silently and only surface failures on the **gating** prereqs. The
remaining checks are *signals* — they don't gate setup, they feed the level
inference (see step 4b).

**Gating prereqs** (must pass; surface failures, then stop):

- **gh CLI installed:** `gh --version`. If missing → tell them: `brew install gh` (macOS) or see <https://cli.github.com/>.
- **gh authenticated:** `gh auth status`. If not → tell them to run `gh auth login` and come back.
- **pnpm installed:** `pnpm --version`. If missing → `npm install -g pnpm`.
- **node version:** `node --version`. Workshops require Node 20+. If older → tell them to upgrade (recommend nvm).

If everything's there, briefly confirm to the user that prereqs are good and move on. Don't dump version output.

**Level signals** (informational only — record pass/fail silently):

- `gh`: installed AND `gh auth status` succeeded → true
- `pnpm`: installed → true
- `node20+`: `node --version` reports v20 or higher → true
- `aws_profile`: `aws configure list-profiles` returns at least one profile, OR `~/.aws/config` exists and is non-empty → true
- `shell_dotfiles`: `~/.zshrc` or `~/.bashrc` exists and is non-zero size → true
- `gitconfig`: `git config --global user.name` returns a non-empty value → true

Don't ask the user about these; just probe. Failures here are not blockers.

**Inference rule** (count of `true` signals out of 6):

- 0 or 1 → `beginner`
- 2 or 3 → `intermediate`
- 4, 5, or 6 → `expert`

Hold the inferred level + the per-signal booleans for use in step 4b.

### 3. Pick a clone location — ASK the user

This is important: do NOT silently default to the current working directory. CWD might be `/tmp` or somewhere ephemeral.

Propose this default (pick the form matching the user's OS — see step 5 for OS detection):

- macOS / Linux / WSL: `$HOME/learning-with-court/<workshop-id>` (e.g. `/Users/<name>/learning-with-court/mcp-workshop`)
- Windows (PowerShell): `%USERPROFILE%\learning-with-court\<workshop-id>` (e.g. `C:\Users\<name>\learning-with-court\mcp-workshop`)

(Resolve `$HOME` / `%USERPROFILE%` with the user's actual home dir.)

Tell the user the proposed path and ask: "Is this OK, or would you like a different location?" Wait for their answer. If they say a path, use it.

If the chosen directory already exists:
- If it's a git repo with origin matching the workshop project → say "Looks like the project is already cloned at <path>; using it" and skip step 4.
- Otherwise → ask: pick a different name, or rename/remove the existing dir manually.

Use `mkdir -p` to create the parent dir if needed (e.g. `~/learning-with-court/`). Cross-platform: works on macOS, Linux, and Git Bash on Windows.

### 4. Clone the project

Pick the right repo for the workshop the user selected in step 1:

```
Workshop ID → repo slug:
- mcp-workshop  → schuettc/learning-with-court-mcp-workshop
```

Then clone:

```bash
gh repo clone <slug> <chosen-path>
```

If the clone fails with a 404 / permission error, the user needs collaborator access on the private repo. Tell them to ask the workshop owner.

### 4b. Persist the inferred level into the project

Write `<chosen-clone-path>/.claude/lwc-workshop.local.md` with YAML
frontmatter holding the level + signals + an ISO-8601 timestamp. Make sure
`.claude/` exists (`mkdir -p <chosen-clone-path>/.claude`).

Use this exact shape (substitute the real values you computed in step 2):

```markdown
---
level: intermediate
inferred_at: 2026-05-05T17:23:00Z
signals:
  gh: true
  pnpm: true
  node20+: true
  aws_profile: false
  shell_dotfiles: true
  gitconfig: false
---

# learning-with-court workshop — local config

This file was written by the `setup-workshop` skill based on a probe of your
environment. The `level:` value tunes how the workshop's walker prose
addresses you. To override, edit `level:` to one of `beginner`,
`intermediate`, or `expert`. The hook trusts whatever value is here.

This file is gitignored — it's per-user state, not part of the workshop.
```

Get the ISO timestamp from `date -u +%Y-%m-%dT%H:%M:%SZ`. Quoting the values
isn't required (the hook parses with simple sed/awk), but keep the keys and
shape exactly as shown — bash YAML parsing is fragile.

### 5. Hand off — `cd`, `pnpm install`, `claude`

**Important:** Don't run `pnpm install` from this session. Claude Code's auto-mode classifier blocks `pnpm install` when run from a different directory than CC's current working directory (the cross-dir shape is what gets flagged). The user runs it themselves, in their own terminal, after `cd`-ing into the project dir.

Also: the **shell shape differs by OS**. Bash/zsh use `&&` to chain; PowerShell uses `;` and prefers single-quoted paths. If you don't already know the user's OS, ask up front: "Are you on macOS/Linux (bash/zsh) or Windows (PowerShell)?" — one short question, then emit the right form.

Print exactly (using the absolute path — expand `$HOME` / `%USERPROFILE%` to the real path):

> ✅ Project cloned at `<absolute-path>`. I inferred your level as **`<level>`** based on what's installed in your environment — the workshop will adapt its prose accordingly. You can override anytime by editing `<absolute-path>/.claude/lwc-workshop.local.md` (change the `level:` line to `beginner`, `intermediate`, or `expert`).
>
> To start the workshop, open a new terminal and run these (copy-paste each line):
>
> **macOS / Linux / WSL (bash/zsh):**
> ```
> cd <absolute-path>
> pnpm install
> claude
> ```
> Or chained: `cd <absolute-path> && claude` (run `pnpm install` separately first).
>
> **Windows (PowerShell):**
> ```
> cd '<absolute-windows-path>'
> pnpm install
> claude
> ```
> Or chained: `cd '<absolute-windows-path>'; claude` (run `pnpm install` separately first).
>
> You can exit this Claude Code session first with `/exit` or Cmd-Q. When the new Claude Code session opens in the project, type "hi" — the workshop will greet you.
>
> ⚠️ **First run notice:** the first time you run `claude` in the project, a browser will open for you to sign in to the workshop server (Clerk). It's a one-time sign-in (or sign-up if you don't have an account); after that, the JWT is cached.
>
> Your progress is saved server-side; cross-session resume is automatic.
>
> If `claude` errors on the MCP server when it starts, double-check you ran it from inside the project directory (`<absolute-path>`) — the workshop's MCP config lives in that dir's `.mcp.json`.

The path must be **absolute** so the user can copy-paste from any terminal location.

### 6. Stop. Don't try to start the workshop.

After step 5, you're done. The deployed workshop server may be available as an MCP server in this session, but the project's project-scoped hooks aren't active here — the workshop is designed to run from inside the project dir.

If the user pushes ("let's just start it now"), explain briefly why a fresh session is needed and stop.

## Tone

Friendly, direct, brief. Treat the user as possibly non-technical — explain *what* each step does, not just the commands. But don't lecture; the goal is "set up in 30 seconds and out of your hair."

If anything goes wrong, be specific about what to do next. Never leave the user stuck without a clear next action.

## Cross-platform notes

- **macOS, Linux, WSL:** bash/zsh form (`&&` chaining, `$HOME`).
- **Windows native (PowerShell):** `;` chaining, single-quoted paths for paths with spaces, `%USERPROFILE%` for home. `gh`, `pnpm`, `claude` all work. The `~/...` shorthand may not expand reliably — prefer absolute paths.
- **Git Bash on Windows:** treat as a Linux shell.

If you don't know the user's OS, ask up front before emitting the handoff commands (step 5).

## Future

When more workshops land, this skill expands its catalog. Multi-workshop projects, repo discovery from a hosted index, an upgrade path from a marketplace — all deferred until v1's one-workshop pattern is stable.
