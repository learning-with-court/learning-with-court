---
id: phase-c-walker-port
name: Phase C walker port (lessons 11-13, optional)
type: Feature
priority: P2
effort: Large
impact: Low
created: 2026-05-05
---

# Phase C Walker Port (Lessons 11-13)

## Problem Statement

Phase C is the AWS deploy phase: lesson 11 deploys API Gateway + Lambda via CDK; lesson 12 adds DynamoDB with KMS envelope encryption; lesson 13 wires Claude Code's built-in MCP OAuth client to the deployed server. mcp-workshop has always treated Phase C as **optional** — a learner who finishes lesson 10 has built a working, useful local MCP server. Phase C is for learners who want a multi-tenant production deployment.

Two things make Phase C uniquely tricky in the learning-with-court delivery model:

1. **The recursive case.** The learner is deploying their own AWS Lambda + API Gateway + DynamoDB while interacting with a workshop hosted on… an AWS Lambda + API Gateway + DynamoDB. Walker prose has to keep "the Lambda you're deploying" and "the Lambda hosting your workshop" cleanly separated in the learner's mental model.

2. **AWS-account variance.** Unlike Phases A and B, Phase C's prereqs include real AWS access — a profile, CDK bootstrap, IAM permissions for CloudFormation/Lambda/DDB. A learner who has nailed Phases A and B might still bounce off Phase C if their AWS environment isn't ready.

## Why this matters (and why it's P2)

Phase C is **optional content**. A learner who completes Phases A + B has built something meaningful. We can ship the workshop as "Phases A + B available; Phase C coming for AWS-deploy enthusiasts." That's a defensible v1.

This chunk lands when (a) Phases A and B are stable, (b) the recursive-case framing has been thought through carefully, and (c) we're confident enough in chunk 7 (first user test) to know what the AWS-account onboarding looks like for our actual users.

## Proposed Solution

Three `LessonDefinition` entries. The substantive new pedagogical concerns:

- Lesson 11: CDK + Lambda + API Gateway. Walker prose includes an explicit identity-context sidebar — likely as an MCP resource the walker can pull up: "the workshop you're talking to right now is running on this exact pattern; here's the difference."
- Lesson 12: DynamoDB + KMS. Walker prose introduces envelope encryption and explains why session data is encrypted at rest.
- Lesson 13: Claude Code MCP OAuth client setup. The recursive moment — the learner connects Claude Code to *their* deployed server, takes their own deployed workshop for a spin.

Phase C's prereq check is a hard gate (no AWS account → walker stops cleanly with a setup guide). Phase C is reachable from any state of A/B completion (per platform's permissive pacing) but the first walker move is the prereq probe.

## Who benefits

Learners who specifically want to build and operate a real MCP server in AWS. A subset of the workshop's audience, but a meaningful one.

## What I'll need from you

- Strong opinion on the identity-context resource for lesson 11. We could ship a literal architecture diagram (as an SVG resource) or just prose.
- Decision on whether Phase C is gated behind explicit user action ("are you sure you want to deploy to your AWS account?") or just begins like any other lesson once A/B-state allows.
- AWS-onboarding guide: do we link to mcp-workshop's existing onboard-aws content, port it as a Phase C resource, or do something different?

## Affected Areas

- learning-with-court-workshops (workshops/mcp-workshop/)
- mcp-workshop-substrate (lessons 11-13 + the `infra/` directory finally getting used)

## Blocked by

- `phase-b-walker-port` (Phase C deploys what Phase B built locally)
