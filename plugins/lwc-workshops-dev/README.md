> **Dev channel.** Generated from the `lwc` plugin by `scripts/gen-dev-plugin.mjs`; points at `mcp-dev.workshop.institute`. Do not edit by hand — edit the `lwc` plugin and regenerate.

# lwc

The Learning-with-Court workshops plugin. Ships three skills that take any LWC workshop from "I'd like to learn X" to the last lesson:

- **setup-workshop** — (Claude Code) clones a workshop's project codebase via the `lwc` CLI and hands you off to a fresh session inside it. In Cowork it redirects to the connector + orchestrator flow instead — no CLI steps.
- **workshop-orchestrator** — picks a workshop from your catalog and starts it
- **lesson-runner** — walks you lesson-by-lesson through a started workshop

The skills delegate to an MCP server that serves workshop-specific content at runtime. The plugin does **not** include an MCP server itself — you connect to one alongside the plugin:

## Cowork (claude.ai / Desktop)

Install the plugin **and** add the LWC Custom Connector. The connector is the MCP transport; the plugin is the walker skills.

Full instructions: <https://workshop.institute/add-to-claude>

## Claude Code (CLI)

In Code, the `lwc` CLI runs as a stdio MCP server out of each workshop's `.mcp.json`. Installing the plugin gives you the conversational entry point (`setup-workshop` — just say "set up the mcp workshop") plus the orchestrator/lesson-runner skills for guided lesson walks. Prefer the CLI directly? That works too:

```
curl -fsSL https://get.workshop.institute | sh -s -- --channel dev
lwc auth login
lwc setup <workshop-id>
```

Full instructions: <https://workshop.institute/add-to-claude>

## What this plugin used to do

Versions ≤ 0.3.x vendored the CLI as a single-file Node bundle and registered it as an stdio MCP server inside the plugin. As of 0.4.0 the bundle is gone — Cowork talks to the MCP server directly via the Custom Connector path, and Code uses the host-installed CLI. The plugin's job is now narrowly the walker skills.
