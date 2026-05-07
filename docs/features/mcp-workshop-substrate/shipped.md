---
shipped: 2026-05-06
---

# Shipped: mcp-workshop project repo

## What landed

The progressive project repo (`learning-with-court-mcp-workshop`) shipped as part of the phase-A/B/C walker ports and subsequent rename work.

- Repo lives at `github.com/schuettc/learning-with-court-mcp-workshop`
- 13 lesson packages across 3 phases (A: stdio basics, B: auth + HTTP, C: AWS deploy)
- `.mcp.json` pre-configured pointing at `mcp.workshop.institute` (prod)
- `.claude/` hooks: SessionStart (greeting + lesson nav) + PreToolUse (scope guard)
- Clerk OAuth wired: `clientId: WJmjQU1SDxwBBFyl`, callback on `localhost:8080`

## Notes

Renamed from the original `learning-with-court-mcp-workshop-substrate` naming (dropped "substrate" vocabulary in `drop-sample-rename-project`). The progressive single-package substrate shape described in the idea was superseded by the lesson-package approach already present in the repo — the existing structure works well enough for the walker model.
