---
shipped: 2026-05-05
---

# Shipped: Phase C Walker Port (Lessons 11-13)

## What landed

Three new `LessonDefinition` entries in `learning-with-court-workshops/workshops/mcp-workshop/src/lessons/`, plus updated `index.ts` (now lessons 1-13; Phase C flagged as optional in description):

| Lesson | Title | Walker covers |
|---|---|---|
| 11 | AWS deploy I (HTTP API v2 + Lambda + GitHub auth) | **Recursive-case framing**; three-step AWS prereq gate; CDK Data + Api stacks; deploy + GitHub-App round-trip |
| 12 | DynamoDB + KMS envelope encryption | Reinforces recursive case; walks `kms.ts` (sealWithDek/openWithDek) and `server.ts` (store_github_token / github_whoami); staged verify (write → read) |
| 13 | Shipping (wire Claude Code to your deployed server) | Two `.mcp.json` entries coexist (workshop's server + learner's deployed server); manual end-to-end validation; gated teardown |

## Lesson 11: recursive-case framing — confirmed

Verbatim opener:

> What you're about to deploy looks a lot like what you're talking to. The workshop server is itself an AWS Lambda + API Gateway + DynamoDB; you're now learning to deploy *your own* of the same shape. Two stacks, two URLs, two CloudFormation templates — both real, neither is the other.

Reinforced throughout via "the Lambda you're deploying" / "the Lambda hosting your workshop" naming. Lesson 12 reinforces; lesson 13 makes it concrete with two `.mcp.json` entries.

## Lesson 11: AWS prereq gate — confirmed

Walker runs three Bash calls **before** any deploy work, one at a time:
1. `aws configure list-profiles`
2. `aws sts get-caller-identity --profile <profile>`
3. `aws cloudformation describe-stacks --stack-name CDKToolkit` (CDK bootstrap check)

Stops cleanly if any fail; points the learner at the lesson 11 resource which has the prereq setup walk (mined from `mcp-workshop/plugin/skills/onboard-aws/SKILL.md`).

## Verify rubrics

- **L11:** `mustInclude: [/^OK lesson 11 verified/m, /GitHub App round-trip succeeded/]`. Excludes `AccessDenied`, `ValidationError`, `InvalidCiphertextException`, `Unauthorized`.
- **L12:** matches the substrate's `→ ← ✔` shape; `mustInclude: [/^✔/m, /lesson 12 verified/, /envelope-encrypted/, /store_github_token/]`. Excludes `AccessDenied`, `InvalidCiphertextException`, `FAIL token stored in plaintext`.
- **L13:** uses substrate's echo line as a benign success marker — `mustInclude: [/lesson 13 verify is the manual claude\.ai walkthrough/]`. Lesson 13 is fundamentally a manual workflow; the verify script just acknowledges that.

## Sanity checks (all green)

- `pnpm typecheck` in workshops repo passes.
- `targetFiles` paths exist in substrate at `workshop/lesson_1[1-3]_*/` (verified directly).
- `verifyCommand` package names match: `@workshop/lesson-11-aws-deploy`, `@workshop/lesson-12-aws-data`, `@workshop/lesson-13-shipping`.

## Workshop is content-complete

After this chunk, mcp-workshop has all 13 lessons authored as `LessonDefinition` entries — Phase A (1-6), Phase B (7-10), Phase C (11-13). The workshop is **content-complete** in the workshops repo.

## Still deferred

- **Deploy + routing.** Platform Lambda still registers only `sampleWorkshop`. mcpWorkshop is ready to register; the multi-workshop routing decision (separate Lambda vs. multi-register) is its own future chunk.
- **E2E walker testing.** Depends on deploy.
- **Real AWS deploy testing for Phase C.** Depends on a tester with an AWS account + working CDK environment.
- **Substrate access for testers.** Substrate is private; testers need collaborator access.

## Pushed branches

- `learning-with-court-workshops` `feature/phase-c-walker-port` — content (4 files modified)
- `learning-with-court` `feature/phase-c-walker-port` — plan tracker

## Unblocks

- The workshop's content backlog is closed for v1. Remaining backlog item: chunk 7 (first-user-polish), which is mostly user-action — recruiting testers, running sessions.
- The deploy/routing decision can be tackled whenever convenient. Today's substrate keeps using the `lwc-spike` URL placeholder; whenever we're ready, we either provision a new Lambda for mcp-workshop or switch to multi-register on the existing one.
