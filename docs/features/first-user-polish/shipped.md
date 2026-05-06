---
shipped: 2026-05-05
status: runbook-ready
---

# Shipped: First-User Test + Polish Pass (runbook)

## What "shipped" means here

This chunk is fundamentally **user-action** — recruiting testers, observing sessions, capturing findings. The agent can't execute the steps; the user does.

**What's actually shipped:** the runbook (`plan.md`) is complete and ready. When testers are recruited and prereqs are met (real Clerk auth deployed, mcp-workshop registered on the platform, substrate accessible to testers), the user follows the 8 steps in the plan to run the first-user test pass.

The findings produced by running the runbook are *output* — they become the next iteration's backlog. They're not in this feature's deliverable.

## Prereqs to actually run this

The plan is **blocked** by deferred items from other chunks:

1. **clerk-auth deploy completion** — real Clerk URLs swapped in for the placeholders. Shipped as code, runtime config pending.
2. **Multi-workshop deploy decision** — mcp-workshop currently isn't registered on any deployed Lambda. Either provision a new stack (option A) or multi-register on the existing Lambda (option B). Pick one and execute; this is a separate feature that should be captured.
3. **Substrate access for testers** — `learning-with-court-mcp-workshop-substrate` is private; testers need collaborator access (or the repo gets opened up).

None of these are agent-implementable end-to-end without user action. Ship this runbook now; pick up the user-action items when you're ready.

## When you're ready to run the test pass

Open `plan.md` and follow the 8 steps. If you want me to prepare the findings templates first (Step's "Templates" section), tell me and I'll author them; they're a tiny piece of work.

## Bar (from the v1 spec)

> One non-dev tester completes Phase A unaided AND can explain in their own words what an MCP tool, resource, and prompt do, the difference between them, and why their tool needed a Zod schema.

Completion + understanding. The audacious bet is tested empirically.

## Capture path for findings

`docs/findings/YYYY-MM-DD-<id>.md` per session. `docs/findings/YYYY-MM-DD-synthesis.md` after 1-3 sessions. Each top finding becomes a new feature via `/feature-capture`.

## Closing this v1 backlog

After this chunk's runbook ships, the v1 backlog as defined in `2026-05-05-mcp-workshop-port-design.md` is content-complete:
- 1-6: shipped as code/content (clerk-auth, adaptive-guidance, mcp-workshop-substrate, phase-a-walker-port, phase-b-walker-port, phase-c-walker-port).
- 7: shipped as runbook (this).

The deferred items (clerk URL swap; multi-workshop deploy/routing decision; substrate visibility) are not new backlog features. They should each be captured via `/feature-capture` whenever you want to run them.

## Pushed

This chunk has no code; just `plan.md` + `shipped.md` in the tracker.
