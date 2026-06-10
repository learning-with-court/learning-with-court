# learning-with-court

Hosted-MCP workshops driven by Claude Code.

**Start here: <https://workshop.institute>** — sign up free, then come back for the install steps below.

## Start learning

```
0. Open a terminal in a folder you want to use for workshops, e.g.:
     macOS / Linux / WSL:  mkdir -p ~/workshops && cd ~/workshops
     Windows PowerShell:   mkdir $HOME\workshops; cd $HOME\workshops
   Any folder works — this becomes the parent for everything you install.
1. Start Claude Code there:  claude
2. Type:  /plugin marketplace add learning-with-court/learning-with-court
3. Type:  /plugin install learning-with-court@learning-with-court
4. Type:  /reload-plugins
5. Tell Claude:  set up the mcp workshop
```

That's the whole guide. Claude takes it from there — checks your tools, runs `npx @learning-with-court/cli setup mcp-workshop --dir <your-folder>/mcp-workshop`, opens a browser for one-time sign-in, clones the workshop into `<your-folder>/mcp-workshop/` (or under `~/learning-with-court/` if you skipped step 0), and hands you off to a fresh Claude Code session inside.

The plugin installs at user scope by default, so once you've done steps 1-4 you don't need to do them again — additional workshops only need step 5.

## Requirements

- **Claude Code** — <https://claude.com/claude-code>
- **Node 20+** — gives you `npx` and `git`. Use nvm if you need to upgrade.

That's it. **No `gh` CLI, no GitHub account, no pnpm install up front.** The CLI handles everything; first run prompts a browser sign-in.

## Available workshops

| Workshop | What you build |
|---|---|
| **mcp-workshop** | Build a real MCP server. 13 lessons across 3 phases (A: stdio basics; B: auth + HTTP; C: AWS deploy). |

Workshop project repos are private and gated by your workshop.institute sign-in — the CLI handles cloning via short-lived GitHub App tokens. More workshops land here over time.

## Other coding agents (Cursor, Codex, Cline, Zed, …)

The marketplace plugin is Claude Code-specific, but the underlying CLI is agent-agnostic. From any terminal:

```
npx -y @learning-with-court/cli@latest setup mcp-workshop
```

Add `--dir <path>` if you want it somewhere specific. Then `cd` into the cloned folder (the CLI prints the exact path) and open it in your agent. The cloned `.mcp.json` wires up the workshop server identically for any MCP-capable agent.

## First run: signing in

The first time you run `claude` inside a workshop project and the workshop tries to do anything, Claude Code will open a browser to sign you in. You'll either sign into an existing workshop.institute account or create one (sign-up is free).

After sign-in, your JWT is cached locally. Subsequent sessions skip the browser dance until the token expires (typically hours-to-days). If a session needs to re-authenticate, you'll see the browser open again — that's expected.

Your authenticated identity keys your workshop progress on the server. Sign in on a different machine with the same workshop.institute account, and your progress is preserved.

## Notes

- **You'll run `pnpm install` yourself once you `cd` in.** Claude Code's auto-mode classifier blocks `pnpm install` from any context (lifecycle scripts run arbitrary code).
- **Cross-platform.** macOS, Linux, and Windows (WSL or Git Bash) all work. Native PowerShell is best-effort.

## What's in this repo

- [`plugin/`](./plugin) — the Claude Code plugin. Provides `@setup-workshop`.
- [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json) — marketplace metadata.
- [`docs/`](./docs) — design docs ([VISION](./docs/VISION.md), [ARCHITECTURE](./docs/ARCHITECTURE.md), [REFERENCE_PROJECTS](./docs/REFERENCE_PROJECTS.md), [ROADMAP](./docs/ROADMAP.md)). Not required reading to start a workshop.

## How it works (one paragraph)

A workshop is split in two: **content** (lessons, walker prose, rubrics) lives on a deployed MCP server we host; **code** (the codebase you edit) lives in a per-workshop *project* repo you clone once. The plugin in this repo handles the clone-and-wire-up step. The project ships with its own `.mcp.json` and `.claude/settings.json`, so once you `cd` into it and run `claude`, the workshop greets you and walks the lessons. Server-side state means your progress survives across machines and sessions.

## Status

Live. One workshop in the catalog (`mcp-workshop`). Both dev and prod environments are deployed:

| Env | Workshop API | Landing |
|-----|-------------|---------|
| Prod | `mcp.workshop.institute` | `workshop.institute` |
| Dev | `mcp-dev.workshop.institute` | `dev.workshop.institute` |

Clerk auth is live on both envs — multi-tenant, per-user identity keying server-side progress. The project repo's `.mcp.json` defaults to prod. E2E content validation (walking lesson 1 as a real learner) is the next open item.
