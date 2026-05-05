# learning-with-court

A platform for delivering hands-on technical workshops as **hosted MCP servers** instead of cloned repositories.

## Why this exists

Most technical workshops ship as a git repo: clone, follow a README, run scripts, hope nothing drifts. That model has three problems: every learner sees every line of the curriculum (no gating, no pacing control), the instructor can't track progress without a custom backend, and updates require every learner to `git pull`.

This project pivots to a different model. Each workshop is a **deployed MCP server** that any MCP client (Claude Code, the MCP Inspector, claude.ai's connector) can authenticate against and walk through. Lesson content lives server-side and is revealed at the right pacing moment. Progress is tracked per-user. Updates are zero-friction.

## Status

Early-stage planning. Plans live in [`docs/`](./docs/). The first workshop being ported is [`mcp-workshop`](https://github.com/schuettc/mcp-workshop) — a 13-lesson MCP-server workshop with three phases (local stdio → local HTTP+OAuth → hosted AWS Lambda).

Read first: [`docs/VISION.md`](./docs/VISION.md), [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), [`docs/REFERENCE_PROJECTS.md`](./docs/REFERENCE_PROJECTS.md), [`docs/ROADMAP.md`](./docs/ROADMAP.md).
