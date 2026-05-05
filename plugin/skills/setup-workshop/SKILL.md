---
name: setup-workshop
description: Use this when the user wants to start a learning-with-court workshop they don't have set up yet — phrases like "let's start the mcp workshop", "set up the sample workshop", "I want to take the workshop", "begin the lwc workshop", "start a workshop". Drives the clone of the workshop's substrate codebase and tells the user how to run pnpm install + start a fresh Claude Code session in the cloned dir to begin. Do NOT use this if the user is already inside a workshop substrate (look for a .mcp.json with an `lwc-*` server entry — that means they're already set up).
---

You're setting up a learning-with-court workshop for the user.

## Background

learning-with-court hosts technical workshops as deployed MCP servers. Each workshop has a *substrate* — a real codebase the learner edits. The substrate is a sibling repo cloned to the learner's machine. Once cloned, the learner runs Claude Code in the substrate directory; the workshop server walks them through.

This skill handles the clone + handoff. The workshop server itself can't drive the clone — it has no shell access on the learner's machine. The companion plugin (you, right now) is the workshop's "hands" for the setup step.

## Critical constraint: Claude Code's CWD is fixed

Claude Code's working directory is set at process start; it can't change mid-session. So this skill's job ends at "the substrate is cloned and the user has clear next steps." The learner has to **exit Claude Code and start a new session inside the cloned dir** to actually take the workshop. That handoff is unavoidable.

## Available workshops (v1)

For now, one:

- **sample** — *Sample Workshop: Building an MCP Server*. Two lessons (~15 min). Repo: `schuettc/learning-with-court-sample-substrate` (private — needs collaborator access).

When more workshops land, this list grows.

## Steps

### 1. Confirm which workshop

If the user already named one, use it. Otherwise list options and ask. If only `sample` exists and the user said "the workshop," use it.

### 2. Check prerequisites

Run these silently and only surface failures. Don't proceed past a missing prereq.

- **gh CLI installed:** `gh --version`. If missing → tell them: `brew install gh` (macOS) or see <https://cli.github.com/>.
- **gh authenticated:** `gh auth status`. If not → tell them to run `gh auth login` and come back.
- **pnpm installed:** `pnpm --version`. If missing → `npm install -g pnpm`.
- **node version:** `node --version`. Workshops require Node 20+. If older → tell them to upgrade (recommend nvm).

If everything's there, briefly confirm to the user that prereqs are good and move on. Don't dump version output.

### 3. Pick a clone location — ASK the user

This is important: do NOT silently default to the current working directory. CWD might be `/tmp` or somewhere ephemeral.

Propose this default:

```
$HOME/learning-with-court/<workshop-id>-substrate
```

(Resolve `$HOME` with the user's actual home dir.)

Tell the user the proposed path and ask: "Is this OK, or would you like a different location?" Wait for their answer. If they say a path, use it.

If the chosen directory already exists:
- If it's a git repo with origin matching the workshop substrate → say "Looks like the substrate is already cloned at <path>; using it" and skip step 4.
- Otherwise → ask: pick a different name, or rename/remove the existing dir manually.

Use `mkdir -p` to create the parent dir if needed (e.g. `~/learning-with-court/`). Cross-platform: works on macOS, Linux, and Git Bash on Windows.

### 4. Clone the substrate

For the **sample** workshop:

```bash
gh repo clone schuettc/learning-with-court-sample-substrate <chosen-path>
```

If the clone fails with a 404 / permission error, the user needs collaborator access on the private repo. Tell them to ask the workshop owner.

### 5. Heads up about pnpm install + try it

Before running `pnpm install`, tell the user:

> I'll run `pnpm install` next. Claude Code's auto mode often asks for approval before installing dependencies — that's expected; it's a safety check. If you see a prompt, please approve.

Then run:

```bash
cd <chosen-path> && pnpm install
```

If it succeeds, great — proceed to step 6.

If it's denied (auto mode classifier blocks it and the user can't override mid-flight), don't keep retrying. Fall back gracefully: hand off to the user with explicit instructions in step 6 that include `pnpm install`.

### 6. Print the handoff block — always

Whether pnpm install ran or got denied, ALWAYS finish with a clean copy-pasteable handoff. Use the absolute path (resolve `$HOME` to the real path).

If pnpm install **succeeded**, print exactly:

> ✅ Setup complete. To start the workshop:
>
> 1. Exit this Claude Code session (`/exit` or Cmd-Q).
> 2. In a new terminal:
>    ```
>    cd <absolute-path>
>    claude
>    ```
> 3. Type "hi" — the workshop will greet you and pick up. Your progress is saved server-side; cross-session resume is automatic.

If pnpm install was **denied or skipped**, print:

> ✅ Substrate cloned at `<absolute-path>`. To finish setup and start:
>
> 1. Exit this Claude Code session (`/exit` or Cmd-Q).
> 2. In a new terminal:
>    ```
>    cd <absolute-path>
>    pnpm install
>    claude
>    ```
> 3. Type "hi" — the workshop will greet you and pick up. Your progress is saved server-side; cross-session resume is automatic.

The path must be **absolute** so the user can copy-paste from any terminal location. If you used `~/...` or `$HOME/...` to clone, expand it to the real path (`/Users/<name>/...` or `/home/<name>/...`) for the handoff.

### 7. Stop. Don't try to start the workshop.

After step 6, you're done. The deployed workshop server may be available as an MCP server in this session, but the substrate's project-scoped hooks aren't active here — the workshop is designed to run from inside the substrate dir.

If the user pushes ("let's just start it now"), explain briefly why a fresh session is needed and stop.

## Tone

Friendly, direct, brief. Treat the user as possibly non-technical — explain *what* each step does, not just the commands. But don't lecture; the goal is "set up in 30 seconds and out of your hair."

If anything goes wrong, be specific about what to do next. Never leave the user stuck without a clear next action.

## Cross-platform notes

- **macOS, Linux, WSL:** all commands work as written.
- **Windows native (PowerShell):** `gh`, `pnpm`, `claude` all work; `cd <path> && cmd` works in PowerShell 7+ but the `~/...` shorthand may not expand. Use `$HOME/...` instead, or absolute paths.
- **Git Bash on Windows:** treat as a Linux shell.

For now, assume bash-compatible shells. If a Windows-native user has trouble, document the issue and recommend WSL until proper PowerShell support lands.

## Future

When more workshops land, this skill expands its catalog. Multi-workshop projects, repo discovery from a hosted index, an upgrade path from a marketplace — all deferred until v1's one-workshop pattern is stable.
