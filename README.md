# learning-with-court

Hosted-MCP workshops driven by Claude Code.

## Take a workshop

```
1. Open Claude Code in any directory.
2. Type:  /plugin marketplace add schuettc/learning-with-court
3. Type:  /plugin install learning-with-court@learning-with-court
4. Restart Claude Code when prompted.
5. Tell Claude:  set up the sample workshop
```

That's the whole guide. Claude takes it from there — checks your tools, clones the workshop's codebase, walks you through.

## Requirements (Claude helps install missing pieces)

- **Claude Code** — <https://claude.com/claude-code>
- **gh CLI** — `brew install gh && gh auth login`
- **Node 20+** and **pnpm** — `npm install -g pnpm`

You don't have to install these up front. Claude will check what's missing and show you the command to run.

## Available workshops

| Workshop | What you build | Substrate repo |
|---|---|---|
| **sample** | A small MCP server with a Zod-validated tool and a resource (2 lessons, ~15 min). | `schuettc/learning-with-court-sample-substrate` (private — needs collaborator access) |

More workshops land here over time.

## What's in this repo

- [`plugin/`](./plugin) — the Claude Code plugin. Provides `@setup-workshop`, the skill that handles the substrate clone + setup choreography. After setup, the substrate's own hooks and the deployed workshop server take over.
- [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json) — marketplace metadata for `/plugin marketplace add` discovery.
- [`docs/`](./docs) — design docs ([VISION](./docs/VISION.md), [ARCHITECTURE](./docs/ARCHITECTURE.md), [REFERENCE_PROJECTS](./docs/REFERENCE_PROJECTS.md), [ROADMAP](./docs/ROADMAP.md)). Not required reading to take a workshop.

## How it works (one paragraph)

A workshop is split in two: **content** (lessons, walker prose, rubrics) lives on a deployed MCP server we host; **code** (the codebase you edit) lives in a sibling "substrate" repo you clone once. The plugin in this repo handles the clone-and-wire-up step. The substrate ships with its own `.mcp.json` and `.claude/settings.json`, so once you `cd` into it and run `claude`, the workshop greets you and walks the lessons. Server-side state means your progress survives across machines and sessions.

## Status

Early. One workshop, single-user shared identity, private repos. Auth (Clerk) and a real marketplace publish are the next big pieces.
