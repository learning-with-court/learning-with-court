# Vision: Hosted-MCP Workshops

## The pivot

Today's standard for technical workshops is the git-clone model: a repo with a README, lesson files, and a verify script. The instructor puts the curriculum in the repo; learners clone it, follow along, and hope their environment matches what was tested.

We're pivoting to a different delivery model: each workshop is a **deployed MCP server** that any MCP client (Claude Code, MCP Inspector, claude.ai's connector) authenticates against and walks through interactively. The MCP protocol's primitives — tools, prompts, resources — turn out to be a remarkably good fit for workshop pedagogy when you stop thinking of them as "API surface for an LLM" and start thinking of them as "pacing controls for a guided experience."

## Why this is better

**For learners:**
- No `git clone`, no `pnpm install` of a curriculum repo (they still install their own project tooling). Add an MCP server URL to `.mcp.json`, sign in once, start.
- Progress is tracked across machines and sessions. Resume from any device.
- Lessons reveal at the right pacing moment — you can't accidentally read ahead or skip prereqs.
- The same workshop can be taken with different MCP clients; the server doesn't care which one you use.

**For workshop authors:**
- **Single source of truth for lesson content.** Walker prose, rubrics, and lesson sequencing live server-side, authored once. No more "fix a typo, ask everyone to `git pull`."
- **Walker prose is model-directed content, not private content.** It's *intended* for the model to read and act on, not for the learner to scan as raw text. By default Claude Code surfaces it on demand (`prompts/get`) but doesn't display it inline; that's UX convention, not enforced privacy. Workshops needing genuinely private content (paid-content gating, answer keys) use *gated tools* — the server returns content only when prereqs are met — not prompts.
- **Updates are zero-friction.** Push to the server; every learner's next call sees the new content.
- **Per-learner progress** falls out for free — DynamoDB row keyed on the learner's authenticated identity. Resume across machines.
- **Pacing is a server concern, but advisory.** The platform tracks "you've completed lessons 1-3"; whether to *enforce* an order is a workshop choice, expressible in walker prose (the platform itself defaults to permissive — skip-ahead and replay are allowed).
- **Telemetry** for free: where do learners get stuck? Server logs answer.
- **Monetizable / cohort-able** if desired: gate by subscription, by team, by enrollment date.

**For the workshop content itself:**
- The protocol forces you to write content as composable units — a prompt body, a resource document, a verification rubric — instead of a free-form README. That structure pays off at the third workshop.

## What you give up

- **Edit-blocking hooks.** "Don't let the user edit `infra/api-stack.ts` while we're on lesson 4" requires PreToolUse hooks in Claude Code's plugin system. MCP servers can't intercept tool calls before they execute. Mitigated by a small companion plugin (~50-80 lines) that pairs with each hosted workshop.
- **Free-text NLU triggers.** "Say `run verify`" can't be intercepted server-side. The user has to invoke a tool by name, or the companion plugin maps the natural-language phrase to a tool call.
- **The "tutor in the room" feel** unless the companion plugin is installed. With the plugin, the experience is the same as today's plugin-only model. Without it, the user calls tools more directly — closer to a CLI walkthrough than a conversation. Still good; not as warm.
- **Real content privacy.** MCP exposes prompts and resources by design — `prompts/get` is part of the spec. Walker prose reaches the model in normal use; a curious learner can fetch it. Workshops needing answer-key-style privacy use *gated tools* (server returns content only after prereqs are met), not prompts. MCP is a delivery substrate, not a privacy boundary.

## The vision

A directory of hosted MCP workshops at `learning-with-court`, each a deployed Lambda + DynamoDB + companion plugin. Authors write workshops by following a template (server scaffolding, content schema, prompt structure). Learners discover workshops, install the companion plugin once, and authenticate per-workshop with their identity provider of choice.

The first workshop (`mcp-workshop`) is itself about how to build MCP servers — which makes it both the proof of concept *and* the canonical example new workshop authors learn from.

## What this is not

- **Not a SaaS for arbitrary tutorials.** This is for hands-on technical workshops where the learner runs code, gets feedback, and progresses through a graph of prerequisites. Pure-prose tutorials don't need this infrastructure.
- **Not a replacement for documentation.** Workshops teach a skill end-to-end through doing; docs answer specific questions. Each is best at what it does.
- **Not bound to Claude Code.** MCP is a protocol; any client can drive a hosted workshop. The companion plugin is Claude-Code-specific (it's a Claude Code plugin), but a workshop's *server* should be client-agnostic.
