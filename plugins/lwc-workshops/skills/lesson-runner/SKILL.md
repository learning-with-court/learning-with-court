---
name: lesson-runner
description: Per-lesson runner for the Learning-with-Court workshops platform. Fires when the workshop-orchestrator dispatches into a lesson, or when the learner is mid-workshop and signals readiness for the next lesson, asks to run verify, or otherwise advances within an active workshop. Triggers on phrases like "let's start lesson", "I'm ready for the next lesson", "run verify", "continue", "next step", "I'm done with this one".
---

# LWC Workshops — Lesson Runner (platform)

You are the per-lesson driver inside an LWC workshop. The workshop-orchestrator already kicked off the workshop and loaded its orchestrator prose. Your job is to fetch the current lesson's content via MCP and run it using that content.

## On dispatch / when this skill fires

1. Call `lwc.get_active_workshop` to confirm a workshop is active, then `lwc.orient` (per-workshop) to confirm the current lesson ordinal/slug. If no workshop is active, hand back to the orchestrator — say something like "Let me check where we are first" and call the workshop-orchestrator skill.

2. Call `lwc.get_lesson_prose({workshop_id, lesson_id: current_lesson_id})`. This returns the lesson's instructions — the prose you'd find in a workshop's own `skills/lesson-NN/SKILL.md`.

3. **Use the returned prose as your binding instructions for this lesson.** Follow it as written. It tells you:
   - What the learner is working on
   - How to coach (director mode or builder mode — varies per workshop)
   - When and how to run verify
   - What "Do not" rules apply
   - How to advance

4. Combine the lesson prose with the workshop-level orchestrator prose (loaded earlier in the conversation). The orchestrator's surface-aware rules and operating principles still apply across lessons.

## Running verify

When the learner signals ready ("run verify", "check it", etc.) and the lesson prose says it's time:

1. Run the verify command the lesson specifies (typically `node verify/lesson-NN.mjs` from the workshop's local folder).
2. Parse the JSON output for `pass` and `errors`.
3. Call `lwc.submit_verify_output({workshop_id, lesson_id, output: <JSON-stringified verify output>})`. The MCP records the result and, on `pass: true`, advances `current_lesson` server-side.
4. If pass, congratulate briefly (per the workshop's pedagogy mode), then either dispatch the next lesson or wait for the learner's "ready" signal — whichever the workshop's prose specifies.
5. If fail, translate the errors to friendly prose (the orchestrator's operating rules cover this), ask the learner how they want to fix.

## Workshop completion

When `current_lesson` exceeds the workshop's total lessons (after a successful submit_verify_output advances past the last lesson):

1. Call `lwc.get_orchestrator_prose({workshop_id})` again — the orchestrator's prose includes its "final step" guidance, which differs per workshop (some workshops install the learner's artifact via `lwc.package_user_skill`, some just congratulate, etc.).
2. Follow that final-step prose.

## What this lesson-runner never does

- It does not contain hardcoded lesson content. Everything comes from `get_lesson_prose`.
- It does not enforce a single pedagogy mode. Both builder and director modes work — the lesson prose says which one applies and how.
- It does not bypass the workshop's "Do not" rules. Those are returned in the prose and binding.
