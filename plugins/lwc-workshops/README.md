# lwc

The Learning-with-Court workshops plugin. Ships two skills that drive any LWC workshop:

- **workshop-orchestrator** — picks a workshop from your catalog and starts it
- **lesson-runner** — walks you lesson-by-lesson through a started workshop

The skills delegate to an MCP server that serves workshop-specific content at runtime. The plugin does **not** include an MCP server itself — you connect to one alongside the plugin:

## Cowork (claude.ai / Desktop)

Install the plugin **and** add the LWC Custom Connector. The connector is the MCP transport; the plugin is the walker skills.

Full instructions: <https://workshop.institute/add-to-claude>

## Claude Code (CLI)

In Code, the `@learning-with-court/cli` runs as a stdio MCP server out of each workshop's `.mcp.json`. The plugin's skills are not strictly required — the CLI's own MCP tools handle setup — but installing the plugin gives you the same orchestrator/lesson-runner skills if you want guided lesson walks.

```
npm i -g @learning-with-court/cli@latest
lwc auth login
lwc setup <workshop-id>
```

Full instructions: <https://workshop.institute/add-to-claude>

## What this plugin used to do

Versions ≤ 0.3.x vendored the CLI as a single-file Node bundle and registered it as an stdio MCP server inside the plugin. As of 0.4.0 the bundle is gone — Cowork talks to the MCP server directly via the Custom Connector path, and Code uses the host-installed CLI. The plugin's job is now narrowly the walker skills.
