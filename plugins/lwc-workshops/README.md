# lwc

The Learning-with-Court workshops plugin for Claude Code. Its **setup-workshop** skill takes you from "I'd like to learn X" to a workshop on your machine: it lists the catalog with `lwc catalog`, clones the workshop's project with `lwc setup`, and hands you off to a fresh session inside it.

The plugin carries no MCP server. Each cloned workshop ships its own `.mcp.json`, which runs the `lwc` CLI as a stdio MCP server, on the token from `lwc`'s sign-in. Say "set up the claude code basics workshop" to use the skill, or use the CLI directly:

```
curl -fsSL https://get.workshop.institute | sh
lwc auth login
lwc setup <workshop-id>
```

Full instructions: <https://workshop.institute/add-to-claude>
