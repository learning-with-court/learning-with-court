# learning-with-court

Interactive technical and creative workshops that run inside Claude Code and Claude Cowork. This is the marketplace for both surfaces — add it once, then start any workshop in your catalog with a single prompt.

**Start here: <https://workshop.institute>** — sign up free, then come back for the install steps below.

## What's in this marketplace

| Plugin | Surface | What it does |
|---|---|---|
| `lwc` | Cowork (claude.ai / Desktop) and Claude Code | The whole workshop experience. `setup-workshop` (Claude Code: clones a workshop's project codebase via the `lwc` CLI and hands you off to a fresh session inside it), plus the runtime `workshop-orchestrator` + `lesson-runner` skills that drive any LWC workshop. Workshop content (lesson prose, verify scripts) is served at runtime from `workshop.institute`. |

New workshops appear automatically as they're added to your account — no plugin update needed.

## Install in Claude Cowork (claude.ai / Desktop)

1. **Plugin.** Customize → Plugins → Personal → + → Add marketplace → paste `learning-with-court/learning-with-court`. Enable the `lwc` plugin.
2. **Connector.** Customize → Connectors → + → Add custom connector. URL: `https://mcp.workshop.institute/mcp`. Advanced → OAuth Client ID: `OwQKvLdDebg2PZqs`. Add → Sign in.
3. Restart conversation. Say "let's start a workshop."

Full step-by-step (with screenshots): <https://workshop.institute/add-to-claude>

## Install in Claude Code

```
0. Open a terminal in a folder you want to use for workshops, e.g.:
     macOS / Linux / WSL:  mkdir -p ~/workshops && cd ~/workshops
     Windows PowerShell:   mkdir $HOME\workshops; cd $HOME\workshops
   Any folder works — this becomes the parent for everything you install.
1. Start Claude Code there:  claude
2. Type:  /plugin marketplace add learning-with-court/learning-with-court
3. Type:  /plugin install lwc@learning-with-court
4. Type:  /reload-plugins
5. Tell Claude:  set up the mcp workshop
```

That's the whole guide. Claude takes it from there — checks your tools, runs `lwc setup mcp-workshop --dir <your-folder>/mcp-workshop`, opens a browser for one-time sign-in, clones the workshop into `<your-folder>/mcp-workshop/` (or under `~/learning-with-court/` if you skipped step 0), and hands you off to a fresh Claude Code session inside.

The plugin installs at user scope by default, so once you've done steps 1-4 you don't need to do them again — additional workshops only need step 5.

Prefer the CLI directly? Install it once:

```
curl -fsSL https://get.workshop.institute | sh
```

(Windows PowerShell: `irm https://get.workshop.institute/install.ps1 | iex`)

Then `lwc setup <workshop-id>` — the cloned project wires up the workshop's MCP server on its own. `lwc update` self-updates the CLI; `lwc refresh <id>` pulls the latest workshop content into an existing clone.

## Requirements

- **Claude Code** (<https://claude.com/claude-code>) or **Claude Cowork** (claude.ai / Desktop)
- For Claude Code: **git**. The `lwc` CLI itself is a standalone binary — no Node/npm needed. (Individual workshops whose *content* uses Node still list that as a workshop-level prereq.)

That's it. **No `gh` CLI, no GitHub account, no pnpm install up front.** The CLI handles everything; first run prompts a browser sign-in.

## How MCP is wired

The plugin ships **skills only**. The MCP transport is a separate piece, and the right answer depends on which surface you're using:

- **Cowork** — add the **LWC Custom Connector** alongside the plugin. The connector signs in via OAuth and talks to `mcp.workshop.institute/mcp`. The plugin's skills then drive the workshop.
- **Claude Code** — each cloned workshop project ships its own `.mcp.json`, which spawns the `lwc` CLI as the MCP transport. The `lwc` plugin's orchestrator/lesson-runner skills give you guided lesson walks on top.

One install page covers both flows: <https://workshop.institute/add-to-claude>

## Other coding agents (Cursor, Codex, Cline, Zed, …)

The marketplace is Claude-specific, but the underlying CLI is agent-agnostic. Install it once (`curl -fsSL https://get.workshop.institute | sh`), then from any terminal:

```
lwc setup mcp-workshop
```

Add `--dir <path>` if you want it somewhere specific. Then `cd` into the cloned folder (the CLI prints the exact path) and open it in your agent. The cloned `.mcp.json` wires up the workshop server identically for any MCP-capable agent.

## First run: signing in

The first time you run `claude` inside a workshop project and the workshop tries to do anything, Claude Code will open a browser to sign you in. You'll either sign into an existing workshop.institute account or create one (sign-up is free).

After sign-in, your JWT is cached locally. Subsequent sessions skip the browser dance until the token expires (typically hours-to-days). If a session needs to re-authenticate, you'll see the browser open again — that's expected.

Your authenticated identity keys your workshop progress on the server. Sign in on a different machine with the same workshop.institute account, and your progress is preserved.

## Notes

- **You'll run `pnpm install` yourself once you `cd` in** (Claude Code workshops). Claude Code's auto-mode classifier blocks `pnpm install` from any context (lifecycle scripts run arbitrary code).
- **Cross-platform.** macOS, Linux, and Windows (WSL or Git Bash) all work. Native PowerShell is best-effort.

## What this marketplace isn't

- Not the workshop source code (those live in private LWC repos, cloned via your workshop.institute sign-in or served at runtime).
- Not where you upload your own personal skills (that's Cowork's Skills UI: Customize → Skills → +).
- Not affiliated with Anthropic's official plugin catalog (Anthropic & Partners tab).

## What's in this repo

- [`plugins/lwc-workshops/`](./plugins/lwc-workshops) — the `lwc` plugin: setup-workshop + workshop-orchestrator + lesson-runner skills.
- [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json) — marketplace metadata.
- [`docs/`](./docs) — design docs ([VISION](./docs/VISION.md), [ARCHITECTURE](./docs/ARCHITECTURE.md), [REFERENCE_PROJECTS](./docs/REFERENCE_PROJECTS.md), [ROADMAP](./docs/ROADMAP.md)). Not required reading to start a workshop.

## How it works (one paragraph)

A workshop is split in two: **content** (lessons, walker prose, rubrics) lives on a deployed MCP server we host; **code** (the codebase you edit) lives in a per-workshop *project* repo you clone once. The plugin in this repo handles the install-start-and-walk steps. In Claude Code the project ships with its own `.mcp.json` and `.claude/settings.json`, so once you `cd` into it and run `claude`, the workshop greets you and walks the lessons. Server-side state means your progress survives across machines and sessions.

## Status

Live. Both dev and prod environments are deployed; the workshop catalog is served from your account at <https://workshop.institute>.

| Env | Workshop API | Landing |
|-----|-------------|---------|
| Prod | `mcp.workshop.institute` | `workshop.institute` |
| Dev | `mcp-dev.workshop.institute` | `dev.workshop.institute` |
