# learning-with-court

Hosted-MCP workshops driven by Claude Code.

**Start here: <https://workshop.institute>** — sign up free, then come back for the install steps below.

## Take a workshop

```
1. Open Claude Code in any directory.
2. Type:  /plugin marketplace add learning-with-court/learning-with-court
3. Type:  /plugin install learning-with-court@learning-with-court
4. Type:  /reload-plugins
5. Tell Claude:  set up the mcp workshop
```

That's the whole guide. Claude takes it from there — checks your tools, runs `npx @learning-with-court/cli setup mcp-workshop`, opens a browser for one-time Clerk sign-in, clones the workshop into `~/learning-with-court/mcp-workshop/`, and hands you off to a fresh Claude Code session inside.

The plugin installs at user scope by default, so once you've done steps 1-4 you don't need to do them again — additional workshops only need step 5.

## Requirements

- **Claude Code** — <https://claude.com/claude-code>
- **Node 20+** — gives you `npx` and `git`. Use nvm if you need to upgrade.

That's it. **No `gh` CLI, no GitHub account, no pnpm install up front.** The CLI handles everything; first run prompts a browser sign-in via Clerk.

## Available workshops

| Workshop | What you build |
|---|---|
| **mcp-workshop** | Build a real MCP server. 13 lessons across 3 phases (A: stdio basics; B: auth + HTTP; C: AWS deploy). |

Workshop project repos are private and gated by Clerk auth — the CLI handles cloning via short-lived GitHub App tokens. More workshops land here over time.

## Other coding agents (Cursor, Codex, Cline, Zed, …)

The marketplace plugin is Claude Code-specific, but the underlying CLI is agent-agnostic. From any terminal:

```
npx -y @learning-with-court/cli@latest setup mcp-workshop
```

…then `cd ~/learning-with-court/mcp-workshop` and open the dir in your agent. The cloned `.mcp.json` wires up the workshop server identically for any MCP-capable agent.

## First run: signing in

The first time you run `claude` inside a workshop project and the workshop tries to do anything, Claude Code will open a browser to sign you in. The workshop server runs behind Clerk OAuth — you'll either sign into an existing account or create one (sign-up is free).

After sign-in, your JWT is cached locally. Subsequent sessions skip the browser dance until the token expires (typically hours-to-days). If a session needs to re-authenticate, you'll see the browser open again — that's expected.

Your authenticated identity (Clerk `sub`) keys your workshop progress on the server. Take the workshop on a different machine with the same Clerk identity, and your progress is preserved.

## Notes

- **You'll run `pnpm install` yourself once you `cd` in.** Claude Code's auto-mode classifier blocks `pnpm install` from any context (lifecycle scripts run arbitrary code).
- **Cross-platform.** macOS, Linux, and Windows (WSL or Git Bash) all work. Native PowerShell is best-effort.

## What's in this repo

- [`plugin/`](./plugin) — the Claude Code plugin. Provides `@setup-workshop`.
- [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json) — marketplace metadata.
- [`docs/`](./docs) — design docs ([VISION](./docs/VISION.md), [ARCHITECTURE](./docs/ARCHITECTURE.md), [REFERENCE_PROJECTS](./docs/REFERENCE_PROJECTS.md), [ROADMAP](./docs/ROADMAP.md)). Not required reading to take a workshop.

## How it works (one paragraph)

A workshop is split in two: **content** (lessons, walker prose, rubrics) lives on a deployed MCP server we host; **code** (the codebase you edit) lives in a per-workshop *project* repo you clone once. The plugin in this repo handles the clone-and-wire-up step. The project ships with its own `.mcp.json` and `.claude/settings.json`, so once you `cd` into it and run `claude`, the workshop greets you and walks the lessons. Server-side state means your progress survives across machines and sessions.

## Status

Live. One workshop in the catalog (`mcp-workshop`). Both dev and prod environments are deployed:

| Env | Workshop API | Landing |
|-----|-------------|---------|
| Prod | `mcp.workshop.institute` | `workshop.institute` |
| Dev | `mcp-dev.workshop.institute` | `dev.workshop.institute` |

Clerk auth is live on both envs — multi-tenant, per-user identity keying server-side progress. The project repo's `.mcp.json` defaults to prod. E2E content validation (walking lesson 1 as a real learner) is the next open item.
