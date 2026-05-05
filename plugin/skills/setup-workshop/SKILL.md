---
name: setup-workshop
description: Use this when the user wants to start a learning-with-court workshop they don't have set up yet — phrases like "let's start the mcp workshop", "set up the sample workshop", "I want to take the workshop", "begin the lwc workshop", "start a workshop". Drives the clone of the workshop's substrate codebase, runs pnpm install, and tells the user how to switch into the cloned dir to begin. Do NOT use this if the user is already inside a workshop substrate (look for a .mcp.json with an lwc-* server entry — that means they're already set up).
---

You're setting up a learning-with-court workshop for the user.

## Background

learning-with-court hosts technical workshops as deployed MCP servers. Each workshop has a *substrate* — a real codebase the learner edits. The substrate is a sibling repo cloned to the learner's machine. Once cloned, the learner runs Claude Code in the substrate directory; the workshop server walks them through.

This skill handles the clone + setup. The workshop server itself can't drive the clone — it has no shell access on the learner's machine. The companion plugin (you, right now) is the workshop's "hands" for the setup step.

## Critical constraint: Claude Code's CWD is fixed

Claude Code's working directory is set at process start; it can't change mid-session. So this skill's job ends at "the substrate is cloned + installed." The learner has to **exit Claude Code and start a new session inside the cloned dir** to actually take the workshop.

This is the one moment of friction. Don't try to start the workshop in the current session — it won't work; the substrate's hooks aren't loaded here.

## Available workshops (v1)

For now, one:

- **sample** — *Sample Workshop: Building an MCP Server*. Two lessons (~15 min total). Repo: `schuettc/learning-with-court-sample-substrate` (private — needs collaborator access).

When more workshops are added, this list grows.

## Steps

### 1. Confirm which workshop

If the user mentioned a specific workshop, use it. Otherwise, list options and ask. Default to **sample** if it's clearly the only choice.

### 2. Check prerequisites

Run these checks first; if any fail, share install instructions and stop. Don't proceed past a missing prereq.

- **gh CLI installed:** `gh --version`. If missing → tell them: `brew install gh` (macOS) or see https://cli.github.com/.
- **gh authenticated:** `gh auth status`. If not authenticated → tell them to run `gh auth login` in their terminal, then come back.
- **pnpm installed:** `pnpm --version`. If missing → tell them: `npm install -g pnpm`.
- **node version:** `node --version`. Workshops require Node 20+. If older → tell them to upgrade (recommend nvm).

### 3. Pick a clone location

Default: `<workshop-id>-substrate/` relative to the current directory. So if the user is in `~/projects/`, the clone lands at `~/projects/sample-substrate/`.

Show the user the proposed path before cloning. If the directory already exists:
- If it's a git repo with the expected origin → just say "looks like it's already cloned at <path>; we can use it" and skip to step 5 (install).
- Otherwise → ask: pick a different name, or rename/remove the existing dir manually.

### 4. Clone the substrate

For the **sample** workshop:

```bash
gh repo clone schuettc/learning-with-court-sample-substrate <target-dir>
```

If the clone fails with a 404 / permission error, the user needs to be added as a collaborator on the private repo. Tell them to ask the workshop owner for access.

### 5. Install dependencies

```bash
cd <target-dir> && pnpm install
```

This pulls @modelcontextprotocol/sdk, vitest, zod, etc. Takes a few seconds.

### 6. Tell the user how to continue

Print clearly (not buried in a paragraph):

> ✅ Setup complete. To start the workshop:
>
> 1. Exit this Claude Code session (Cmd-Q on macOS, or `/exit`).
> 2. In a new terminal:
>    ```
>    cd <full-absolute-path>
>    claude
>    ```
> 3. Type "hi" or anything; the workshop will greet you and pick up from there. Your progress is saved server-side — cross-session resume is automatic.

Use `realpath <target-dir>` (or just the absolute path you cloned to) so the user gets a copy-paste-ready path. Don't make them figure out where they are.

### 7. Stop. Don't try to start the workshop.

After step 6, your job is done. The deployed workshop server may be available as an MCP server in this session, but the substrate's project-scoped hooks aren't active here. The workshop's design assumes you're running inside the substrate dir.

If the user pushes ("let's just start it now"), explain — briefly — why a restart is needed and stop.

## Tone

Friendly, direct, brief. Treat the user as possibly non-technical — explain *what* each step is doing, not just the commands. But don't lecture; the goal is "get them set up in 30 seconds and out of your hair."

If anything goes wrong, be specific about what to do next. Never leave the user stuck without a clear next action.

## Future

When more workshops land, this skill expands its catalog. The tedious bits (handling marketplaces, multi-workshop projects, repo discovery from a hosted index) are deferred — for now, the catalog is hardcoded right here.
