---
started: 2026-05-05
---

# Implementation Plan: Phase C Walker Port (Lessons 11-13)

## Overview

Author three `LessonDefinition` entries for mcp-workshop's Phase C — the optional AWS-deploy phase. Same pattern as Phase A/B (chunks 4/5). Adds lessons 11-13 to the existing `workshops/mcp-workshop/`.

Phase C is **optional**. Learners who finished Phase B have a working local MCP server with auth + state + HTTP + PKCE — that's enough. Phase C is for those who want a deployed AWS production-shaped server.

## Two new pedagogical concerns specific to Phase C

### 1. The recursive case

The learner is deploying their own AWS Lambda + API Gateway + DynamoDB while interacting with a workshop hosted on… an AWS Lambda + API Gateway + DynamoDB. Walker prose must keep "the Lambda you're deploying" and "the Lambda hosting your workshop" cleanly separated in the learner's head.

Lesson 11's walker should open with explicit framing similar to lesson 8's identity-confusion framing:

> What you're about to deploy looks a lot like what you're talking to. The workshop server is an AWS Lambda + API Gateway + DynamoDB; you're now learning to deploy *your own* of the same shape. Two stacks, two URLs, two CloudFormation templates — both real, neither is the other.

### 2. AWS-account hard prereq

Phase A and Phase B work on any developer machine. Phase C requires:
- An AWS account
- AWS CLI installed + a configured profile
- CDK bootstrapped in that account/region
- IAM permissions for CloudFormation, Lambda, API Gateway, DynamoDB, KMS, IAM

This is a hard prereq — without it, the lesson literally can't run. Walker prose for lesson 11 must check this up-front and stop cleanly with setup pointers if missing. (mcp-workshop has an existing `onboard-aws` skill that walks through this; we can reference it from the lesson resource or replicate the gist in a Phase C "prereqs" resource.)

## Implementation Steps

- [x] Step 1: Read source material:
  - `~/GitHub/schuettc/claude-code-mcp-workshop/plugin/skills/lesson-11-aws-deploy/SKILL.md`
  - `.../lesson-12-aws-data/SKILL.md`
  - `.../lesson-13-shipping/SKILL.md`
  - Plus the three `workshop/lesson_NN_*/README.md` and `verify.ts` files.
  - Also read `plugin/skills/onboard-aws/SKILL.md` for the AWS prereq-walk content (mining for our Phase C prereqs resource).

- [x] Step 2: Write `lesson-11.ts`, `lesson-12.ts`, `lesson-13.ts` in `workshops/mcp-workshop/src/lessons/`. Same shape as Phase A/B. Notable differences:
  - Lesson 11's walkerPrompt opens with the **recursive-case framing** (verbatim guidance above).
  - Lesson 11's walker also runs the **AWS-prereq check** before any deploy work — if missing, walker stops with an explicit "do this setup first" message; doesn't proceed.
  - Lessons 11-12 verify scripts may not exist as in-memory transport tests — they may verify the deployed stack via AWS CLI calls. Read each verify.ts to learn the actual mechanism.
  - Lesson 13 is largely a `.mcp.json` + README change in mcp-workshop's existing structure — its walker should map onto our existing `lwc-mcp-workshop` server-name in `.mcp.json` rather than re-deriving.

- [x] Step 3: Update `workshops/mcp-workshop/src/index.ts` — add lessons 11-13 to the `lessons` array. Update workshop description to mention all three phases now available; flag Phase C as optional.

- [x] Step 4: `pnpm typecheck` from workshops repo root — must pass.

- [x] Step 5: Sanity check each lesson:
  - `targetFiles` exist in substrate (`workshop/lesson_1[1-3]_*/`).
  - `verifyCommand` package name matches substrate's `package.json`.
  - Verify rubric regex matches what the lesson's `verify.ts` actually emits (read carefully — Phase C verify scripts may differ in shape from Phase A/B).

- [x] Step 6: Commit + push to feature branch. Don't open PRs; orchestrator handles ship.

## Rubric tuning per lesson

Phase C verify scripts likely differ from Phase A/B's narrate.ts pattern. Possibilities:
- Lesson 11/12 might verify via AWS CLI calls (`aws cloudformation describe-stacks`, etc.) emitting AWS-CLI-shaped output (JSON or text).
- Lesson 13 might verify the `.mcp.json` content + that Claude Code can connect to it.

Read each `verify.ts` carefully. Tune rubric accordingly. If the verify involves AWS CLI calls, match against expected output strings; exclude AWS error patterns (`ValidationError`, `AccessDenied`, etc.).

## Walker prose: special structure for Phase C

For lesson 11 specifically, the walker prompt's opening 3-4 paragraphs should be:

1. Tie-back to Phase B (you have a working local server).
2. **Recursive-case framing** (verbatim guidance above).
3. **AWS prereq check** — walker runs `aws sts get-caller-identity` and `cdk --version`, stops cleanly if missing.
4. Only after prereqs pass, walks the actual deploy.

For lesson 13, the walker maps the existing `lwc-mcp-workshop` server in `.mcp.json` to "the deployed server you just made in lesson 12." Be explicit: the workshop server (Clerk-authed, deployed by us) and the server they just built (their AWS account, their auth) are both real MCP servers — you can have both in `.mcp.json` simultaneously.

## Out of scope

- Deploy / routing decision (still deferred — Phase C content is code-ready but not e2e-validated).
- Real AWS deploy testing (depends on tester having an AWS account).
- The substrate's `infra/` directory contents — already shipped in chunk 3.
