---
name: setup-workshop
description: Use this when the user wants to start a learning-with-court workshop they don't have set up yet — phrases like "help me get started", "set up a workshop", "I want to take a workshop", "start a workshop", "let's start the mcp workshop", "I want to take the workshop", "begin the lwc workshop". Drives the clone of the workshop's project codebase via the @learning-with-court/cli into a folder under the user's working directory (or `~/learning-with-court/` by default) and tells the user how to start a fresh session there. Do NOT use this if the user is already inside a workshop project (look for a .mcp.json with an `lwc-*` server entry — they're already set up).
---

You're setting up a learning-with-court workshop for the user.

## Background

learning-with-court hosts technical workshops as deployed MCP servers. The
`@learning-with-court/cli` (npm) is the universal entry point — it does
auth, clone, refresh, registry, and proxies MCP for in-workshop sessions.
This skill is a thin wrapper that drives the CLI's `setup` subcommand.

By convention, workshops install to `<parent>/<workshop-id>/`. The default
parent is `~/learning-with-court/`, but if the user is in a sensible working
directory (e.g. they ran `mkdir ~/workshops && cd ~/workshops` first), use
that as the parent instead. The CLI tracks installs in
`~/.lwc/workshops.json` regardless of where they live.

## Critical constraint: Claude Code's CWD is fixed

Claude Code's working directory is set at process start and can't change
mid-session. So this skill ends at "the project is cloned and the user
has a clear `cd && claude` to run." That handoff is unavoidable.

## Available workshops

- **mcp-workshop** — *MCP Workshop: Build a Real MCP Server*. 13 lessons
  across 3 phases (A: stdio basics; B: auth + HTTP; C: AWS deploy).
  Repo: private, gated by Clerk sign-in.

When more workshops land, this list grows.

## Steps

### 1. Confirm which workshop

If the user named one, use it. Today only `mcp-workshop` exists, so for
generic phrasing default to it without asking. Briefly tell them which
one you're setting up.

### 2. Gating prereqs

Run silently; surface only failures:

- `node --version` — must be v20+. If older, recommend nvm.
- `npx --version` — should be present with any modern Node.
- `git --version` — must be installed.

That's it. **No `gh` CLI, no GitHub account, no API keys.** First-run
sign-in happens via browser when the CLI runs.

### 2b. Level signals (informational, no blocking)

Probe and remember (used in step 4 to write `.claude/lwc-workshop.local.md`):

- `gh`: `gh auth status` succeeded → true (only if `gh` exists)
- `pnpm`: `pnpm --version` succeeded → true
- `node20+`: yes/no per step 2
- `aws_profile`: `aws configure list-profiles` returns ≥1 profile, OR `~/.aws/config` is non-empty → true
- `shell_dotfiles`: `~/.zshrc` or `~/.bashrc` exists and non-empty → true
- `gitconfig`: `git config --global user.name` returns non-empty → true

Inference (count of `true` of 6):
- 0–1 → `beginner`
- 2–3 → `intermediate`
- 4–6 → `expert`

### 3. Decide where to install, then run setup

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
npx -y @learning-with-court/cli@latest setup <workshop-id> --dir <resolved-dest>
```

The CLI auto-creates parent directories. If the user has expressed a
different preference (e.g., they explicitly said `~/Projects/...`), honor
that in `--dir`.

If the CLI errors:
- **"already exists and is not empty":** offer to run `lwc remove <id>` first or pick a different `--dir`.
- **Sign-in timeout / failed:** ask them to retry; the browser may have closed early.
- **"PROVISION_FAILED":** the platform couldn't mint a token. Surface the message verbatim.

### 4. Persist level signals

After the CLI finishes, use the destination you resolved in step 3 (it's
also printed verbatim in the CLI's `Done. Open the workshop:` line, and
recorded in `~/.lwc/workshops.json`). Then write
`<install-path>/.claude/lwc-workshop.local.md` with:

```markdown
---
level: intermediate
inferred_at: 2026-05-08T17:23:00Z
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
`level:` to override (`beginner`, `intermediate`, or `expert`).
```

Get the timestamp from `date -u +%Y-%m-%dT%H:%M:%SZ`.

### 5. Hand off

Auto-detect OS via `uname -s`:
- `Darwin` / `Linux` / `MINGW`/`MSYS`/`CYGWIN` → bash/zsh form (`&&`)
- otherwise → PowerShell (`;`)

Print (substitute `<install-path>` with the actual resolved destination —
the same one the CLI printed and that's stored in
`~/.lwc/workshops.json`):

> ✅ `mcp-workshop` installed at `<install-path>`. I inferred your level as **`<level>`** — the workshop will adapt accordingly. Override anytime by editing `.claude/lwc-workshop.local.md`.
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

Friendly, direct, brief. The goal is "set up in 30 seconds and out of
your hair." If anything goes wrong, be specific about what to do next.

## Cross-platform notes

- The CLI (`@learning-with-court/cli`) is fully cross-platform — pure
  Node, no shell quirks.
- Only the `cd && claude` handoff differs per OS; the CLI itself
  doesn't care.
