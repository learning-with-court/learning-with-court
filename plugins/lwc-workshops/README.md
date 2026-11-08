# lwc

The Learning-with-Court workshops plugin for Claude Code. Its **setup-workshop** skill takes you from "I'd like to learn X" to a workshop: it lists the catalog with `lwc catalog`, helps you pick one, and hands you `lwc start <id>` to paste into a new terminal window. A browser tab then takes you through setup.

The plugin carries no MCP server. Each workshop folder ships its own `.mcp.json`, which runs the `lwc` CLI as a stdio MCP server, on the token from `lwc`'s sign-in. Say "set up the claude code basics workshop" to use the skill, or start from a terminal with the one line on any workshop's page:

```
curl -fsSL https://get.workshop.institute | sh -s -- --start <id>
```

What happens after you paste it: <https://workshop.institute/getting-started>
