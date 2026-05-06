# learning-with-court

Hosted-MCP workshops driven by Claude Code.

## Take a workshop

```
1. Open Claude Code in any directory.
2. Type:  /plugin marketplace add schuettc/learning-with-court
3. Type:  /plugin install learning-with-court@learning-with-court
4. Type:  /reload-plugins
5. Tell Claude:  set up the sample workshop
```

That's the whole guide. Claude takes it from there — checks your tools, asks where to put the workshop folder, clones it, hands you off to a fresh Claude Code session inside the cloned dir.

The plugin installs at user scope by default, so once you've done steps 1-4 you don't need to do them again — the next workshop only needs step 5.

## Requirements (Claude helps install missing pieces)

- **Claude Code** — <https://claude.com/claude-code>
- **gh CLI** — `brew install gh && gh auth login`
- **Node 20+** and **pnpm** — `npm install -g pnpm`

You don't have to install these up front. Claude will check what's missing and show you the command to run.

## Available workshops

| Workshop | What you build | Substrate repo |
|---|---|---|
| **sample** | A small MCP server with a Zod-validated tool and a resource (2 lessons, ~15 min). | `schuettc/learning-with-court-sample-substrate` |
| **mcp-workshop** | Build a real MCP server. 13 lessons across 3 phases (A: stdio basics; B: auth + HTTP; C: AWS deploy). | `schuettc/learning-with-court-mcp-workshop-substrate` |

More workshops land here over time.

## First run: signing in

The first time you run `claude` inside a substrate and the workshop tries to do anything, Claude Code will open a browser to sign you in. The workshop server runs behind Clerk OAuth — you'll either sign into an existing account or create one (sign-up is free).

After sign-in, your JWT is cached locally. Subsequent sessions skip the browser dance until the token expires (typically hours-to-days). If a session needs to re-authenticate, you'll see the browser open again — that's expected.

Your authenticated identity (Clerk `sub`) keys your workshop progress on the server. Take the workshop on a different machine with the same Clerk identity, and your progress is preserved.

## Notes

- **You'll run `pnpm install` yourself.** Claude Code's auto-mode classifier blocks `pnpm install` from any context (lifecycle scripts run arbitrary code; CC won't run it for you even with approval). The setup skill clones the workshop and hands you a single chained command: `cd <path> && pnpm install && claude`. Copy-paste once.
- **Cross-platform.** macOS, Linux, and Windows (WSL or Git Bash) all work today. Native PowerShell is best-effort.

## What's in this repo

- [`plugin/`](./plugin) — the Claude Code plugin. Provides `@setup-workshop`.
- [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json) — marketplace metadata.
- [`docs/`](./docs) — design docs ([VISION](./docs/VISION.md), [ARCHITECTURE](./docs/ARCHITECTURE.md), [REFERENCE_PROJECTS](./docs/REFERENCE_PROJECTS.md), [ROADMAP](./docs/ROADMAP.md)). Not required reading to take a workshop.

## How it works (one paragraph)

A workshop is split in two: **content** (lessons, walker prose, rubrics) lives on a deployed MCP server we host; **code** (the codebase you edit) lives in a sibling "substrate" repo you clone once. The plugin in this repo handles the clone-and-wire-up step. The substrate ships with its own `.mcp.json` and `.claude/settings.json`, so once you `cd` into it and run `claude`, the workshop greets you and walks the lessons. Server-side state means your progress survives across machines and sessions.

## Status

Early but real. Two workshops in the catalog (`sample` + `mcp-workshop`). Clerk auth is live — multi-tenant, per-user identity keying server-side progress. The dev environment is deployed at `*.execute-api.us-east-1.amazonaws.com` and is what the substrates point at today. A prod environment is one feature away — gated on provisioning a Clerk prod app.
