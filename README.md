# learning-with-court

A platform for delivering hands-on technical workshops as **hosted MCP servers** instead of cloned repositories.

## Why this exists

Most technical workshops ship as a git repo: clone, follow a README, run scripts, hope nothing drifts. That model has three problems: every learner sees every line of the curriculum (no gating, no pacing control), the instructor can't track progress without a custom backend, and updates require every learner to `git pull`.

This project pivots to a different model. Each workshop is a **deployed MCP server** that any MCP client (Claude Code, the MCP Inspector, claude.ai's connector) can authenticate against and walk through. Lesson content lives server-side and is revealed at the right pacing moment. Progress is tracked per-user. Updates are zero-friction.

## Status

Early-stage planning. Plans live in [`docs/`](./docs/). The first workshop being ported is [`mcp-workshop`](https://github.com/schuettc/mcp-workshop) — a 13-lesson MCP-server workshop with three phases (local stdio → local HTTP+OAuth → hosted AWS Lambda).

Read first: [`docs/VISION.md`](./docs/VISION.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`docs/REFERENCE_PROJECTS.md`](./docs/REFERENCE_PROJECTS.md), [`docs/ROADMAP.md`](./docs/ROADMAP.md).

## Companion plugin

`plugin/` contains the Claude Code plugin learners install to take a workshop. It currently provides one skill, `@setup-workshop`, which clones the workshop's substrate codebase and walks the learner through the post-setup restart. After setup, the substrate's own (project-scoped) hooks take over.

### Test the plugin locally (development)

```bash
# from any empty directory
claude --plugin-dir ~/GitHub/schuettc/learning-with-court/plugin
# then in Claude Code:
> set up the sample workshop
```

The skill drives `gh repo clone` + `pnpm install` + tells you how to switch into the cloned dir.

### Install the plugin (user-scoped, eventual)

Once we publish to a marketplace, the plugin can be installed via Claude Code's plugin system. Until then, `--plugin-dir` is the supported install path for testers.
