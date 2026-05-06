---
started: 2026-05-05
---

# Implementation Plan: First-User Test + Polish Pass

## Overview

This isn't a code feature — it's a **runbook** for the empirical validation step. v1's audacious bet (the platform makes complex content accessible to non-developers) hasn't been tested. This chunk runs that test.

The deliverable is **findings**, not code. A `docs/findings/` document captures what worked, what didn't, where adaptive guidance was on/off target, where walker prose over- or under-explained, where prereq checks were unclear, where identity-context confusion in lessons 8 and 11 actually showed up.

Findings then become new backlog features for the next iteration.

## Prereqs (must be true before this chunk runs)

- Platform deployed with real Clerk URLs (post-clerk-auth follow-up).
- mcp-workshop registered on the platform Lambda (deploy/routing decision resolved — separate chunk that's currently deferred).
- mcp-workshop substrate accessible to testers (either repo opened up or specific testers invited as collaborators).
- At least one tester recruited.

## Implementation Steps (user-action runbook)

These steps are **for the user (you) to run**. The agent can prepare templates and capture findings, but the actual user testing is hands-on.

- [ ] Step 1: **Recruit 1-3 testers.** Mix of dev and non-dev experience levels. At least one true non-dev (the audacious bet's actual target audience). Profiles to consider:
  - Senior backend dev (validates expert-level walker behavior is appropriate)
  - Bootcamp grad / junior engineer (validates intermediate-level)
  - Non-dev curious about LLMs / Claude (validates beginner-level — the audacious bet)
- [ ] Step 2: **Set up tester access.** For each tester:
  - Add as collaborator on `learning-with-court` (plugin), `learning-with-court-mcp-workshop-substrate` (substrate).
  - Send them the install instructions from `learning-with-court/README.md`.
  - Confirm they have a Clerk-compatible identity (or whatever auth path is live).
- [ ] Step 3: **Decide observation mode.** Three options:
  - **Live over Zoom** — see their screen, ask probing questions in real-time. Highest signal, requires synchronous coordination.
  - **Async with screen recording** — they record their session; we watch async. Lower coordination, lose real-time clarification.
  - **Self-report via questionnaire** — they take the workshop alone, fill out structured feedback. Lowest coordination, lowest signal.
  - Recommendation: **live over Zoom** for at least the first non-dev tester; subsequent testers can be async.
- [ ] Step 4: **Choose scope.** Phase A only? Phase A + B? Full A+B+C? Phase C alone is fine if the tester has AWS comfort.
  - Recommendation: Phase A for first run (~30 min). Discover obvious friction before expanding scope.
- [ ] Step 5: **Run the session(s).** Watch (or replay) for these specific moments:
  - **First minute** after `claude` starts: did the walker greet appropriately? Was the inferred level right?
  - **Lesson 1 setup**: did the walker over-explain `pnpm install` for an expert? Under-explain for a non-dev?
  - **Lesson 2's first edit**: did the PreToolUse hook fire correctly? Did the learner know what to do when blocked?
  - **Verify failures**: when a learner's edit was wrong, did the walker's rubric-feedback help them iterate?
  - **Lesson 8's identity-confusion framing** (if testing Phase B): did the explicit framing actually prevent confusion? Did the learner ever ask "wait, am I logging in to the workshop again?"
  - **Lesson 11's recursive-case framing** (if testing Phase C): did the framing land? Did the learner stay clear on which Lambda is which?
- [ ] Step 6: **Capture findings.** Per session, write to `docs/findings/2026-XX-XX-<tester-id>.md`:
  - Tester profile (level expert/intermediate/beginner-self-described)
  - Inferred level (what the system inferred via env probing)
  - Match between inferred and actual? (informs adaptive-guidance heuristic tuning)
  - Workshop completion? (which lessons completed; which got stuck)
  - Friction moments (specific lesson, specific paragraph, what was confusing)
  - Walker tone: too patient / too terse / right
  - Open-ended: what surprised the tester
- [ ] Step 7: **Synthesize.** After 1-3 sessions, write `docs/findings/2026-XX-XX-synthesis.md` summarizing:
  - Patterns across testers
  - Top 3-5 things to fix (each becomes a new backlog feature)
  - Validation/refutation of the audacious bet (did the non-dev actually complete? Did they understand?)
- [ ] Step 8: **File new features** for each top fix. Use `/feature-capture` for each — they slot into the backlog and get planned/shipped via autopilot in subsequent rounds.

## Success bar

Per the v1 spec:

> One non-dev tester completes Phase A unaided AND can explain in their own words what an MCP tool, resource, and prompt do, the difference between them, and why their tool needed a Zod schema.

That bar is **completion + understanding**, not just "made it through." If completion is met but understanding isn't, that's a finding worth its own feature.

## Templates (agent-prepared; ready when you start)

The following templates can be authored by the agent in advance, ready for you to fill in:

- `docs/findings/_template-session.md` — per-session findings template (tester profile, level, completion, friction moments, etc.)
- `docs/findings/_template-synthesis.md` — multi-session synthesis template

If desired, the agent can write these now (separate sub-task) so they're ready when you start running sessions.

## Out of scope (deferred)

- The findings themselves (depend on actual testing).
- Iterations on walker prose / hooks / adaptive guidance based on findings (separate features for each).
- Quantitative metrics (completion times, drop-off rates) — could be added later via CloudWatch logs / DDB scan, but not for v1.
- A formal moderator script or interview protocol — keep it conversational for v1.

## Risks

### Risk: No testers available

The audacious bet can't be tested without a non-dev tester. **Mitigation:** the chunk waits. Other chunks (deploy decision, additional content) can land while we recruit. The plan is preserved; ship it whenever testers are available.

### Risk: First non-dev tester drops off in lesson 1

If the substrate-clone or `pnpm install` step is too friction-heavy, the test ends before the workshop content matters. **Mitigation:** observation captures *exactly where* drop-off happens. That's still a valid finding — the friction needs fixing before the bet can really be tested.

### Risk: Findings reveal the bet doesn't hold

If non-devs can't complete Phase A despite the platform's adaptive guidance + walker prose tuning, the audacious bet was wrong. **Mitigation:** the response is honest. Either accept the platform serves devs only (drop the non-dev framing in VISION.md) or pivot to a workshop more appropriate for non-devs. Both are valid; the data informs which.
