# learning-with-court

Interactive technical and creative workshops that run inside Claude Code. This is the marketplace for the `lwc` plugin, which helps you pick a workshop from Claude Code.

## Start a workshop

Pick a workshop at <https://workshop.institute/workshops>. Each workshop's page shows one line to paste into a terminal, with that workshop's id in place of `<id>`.

macOS and Linux:

```
curl -fsSL https://get.workshop.institute | sh -s -- --start <id>
```

Windows (PowerShell):

```
$script = iwr https://get.workshop.institute/install.ps1 -useb; Invoke-Expression "& { $script } -Start <id>"
```

The line installs the `lwc` CLI and runs `lwc start <id>`. A browser tab then checks your computer, installs what the workshop needs, signs you in, and opens the workshop with the first lesson beside Claude Code. What happens at each step is at <https://workshop.institute/getting-started>.

`lwc start` installs this marketplace's plugin itself, so you don't add it by hand. To come back to a workshop later, run `lwc start` in any terminal, and your workshops are listed.

## What's in this marketplace

| Plugin | What it does |
|---|---|
| `lwc` | Helps you choose a workshop. Its `setup-workshop` skill lists the catalog with `lwc catalog` and hands you `lwc start <id>` to paste into a new terminal window. Workshop content (lesson prose, verify scripts) is served at runtime from `workshop.institute`. |

New workshops appear automatically as they're added to your account — no plugin update needed.

## Requirements

- **A Claude plan.** Claude Code needs a Claude Pro, Max, Ultra, Team or Enterprise plan, or a Claude Console account.
- **Claude Code and git.** The start page installs them if they're missing. The `lwc` CLI itself is a standalone binary, with no Node or npm needed.

Each workshop's page lists anything else it needs. The start page installs what it can and names the rest before setup begins.

## How MCP is wired

The plugin ships **no MCP server**. Each cloned workshop project ships its own `.mcp.json`, which spawns the `lwc` CLI as the MCP transport, on the token from `lwc`'s sign-in.

Getting started: <https://workshop.institute/getting-started>

## Other coding agents (Cursor, Codex, Cline, Zed, …)

The marketplace is Claude-specific, but the workshop server isn't. A workshop folder that `lwc start` set up ships a `.mcp.json` that runs the `lwc` CLI as its MCP server, so any MCP-capable agent can open that folder and reach the same workshop.

## Signing in

The start page signs you in through your browser the first time. You either sign in to an existing workshop.institute account or create one.

After that, Claude Code doesn't ask you to sign in again. Each workshop's MCP server runs through `lwc`, on the token `lwc` cached, and `lwc` refreshes that token silently. If your sign-in ever lapses, `lwc` opens the browser again to renew it.

Your signed-in identity keys your workshop progress on the server. Sign in on a different machine with the same workshop.institute account, and your progress is preserved.

## Notes

- **Cross-platform.** macOS, Linux and Windows all work. On Windows, paste the PowerShell line.

## What this marketplace isn't

- Not the workshop source code (those live in private LWC repos, cloned via your workshop.institute sign-in or served at runtime).
- Not affiliated with Anthropic's official plugin catalog (Anthropic & Partners tab).

## What's in this repo

- [`plugins/lwc-workshops/`](./plugins/lwc-workshops) — the `lwc` plugin: the setup-workshop skill, which hands you `lwc start <id>`.
- [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json) — marketplace metadata.
- [`docs/`](./docs) — design docs ([VISION](./docs/VISION.md), [ARCHITECTURE](./docs/ARCHITECTURE.md), [REFERENCE_PROJECTS](./docs/REFERENCE_PROJECTS.md), [ROADMAP](./docs/ROADMAP.md)). Not required reading to start a workshop.

## How it works (one paragraph)

A workshop is split in two: **content** (lessons, walker prose, rubrics) lives on a deployed MCP server we host; **code** (the codebase you edit) lives in a per-workshop *project* repo you clone once. `lwc start` sets the project up and opens it. The project ships with its own `.mcp.json` and `.claude/settings.json`, so Claude Code opens inside it and the workshop walks the lessons with you. Server-side state means your progress survives across machines and sessions.

## Status

Live. Both dev and prod environments are deployed; the workshop catalog is served from your account at <https://workshop.institute>.

| Env | Workshop API | Landing |
|-----|-------------|---------|
| Prod | `mcp.workshop.institute` | `workshop.institute` |
| Dev | `mcp-dev.workshop.institute` | `dev.workshop.institute` |
