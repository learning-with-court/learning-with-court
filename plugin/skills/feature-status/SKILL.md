---
name: feature-status
description: Live survey of all repos, feature backlog, and API health. Use at the start of a working session or any time you want the full project picture.
---

Run the following checks and report a structured summary. Run git checks and health checks in parallel.

## Git state (all four sub-repos)

For each repo path below, run these three commands:
- Branch: `git -C <path> branch --show-current`
- Dirty files: `git -C <path> status --short`
- Commits ahead of origin: `git -C <path> log --oneline @{u}..HEAD 2>/dev/null | wc -l | tr -d ' '`

Repo paths (relative to the workspace root at `/Users/courtschuett/GitHub/schuettc/learning-with-court-workspace`, or use absolute paths):
- `learning-with-court`
- `platform`
- `learning-with-court-workshops`
- `workshop-mcp`

## Feature dashboard

Read `docs/features/DASHBOARD.md` from the workspace root (`/Users/courtschuett/GitHub/schuettc/learning-with-court-workspace/docs/features/DASHBOARD.md`) and extract:
- Every item in **In Progress** (id, name, started date)
- Every item in **Backlog** (id, name, priority)
- Count of Completed items

## Health checks

```bash
for url in https://mcp.workshop.institute/health https://mcp-dev.workshop.institute/health; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$url")
  echo "$url $code"
done
```

## Report format

Print this structure to the terminal:

```
=== learning-with-court status (<date> <time>) ===

REPOS
  learning-with-court              <branch>  <clean | N dirty>  <N ahead | up-to-date>
  platform     <branch>  <clean | N dirty>  <N ahead | up-to-date>
  learning-with-court-workshops    <branch>  <clean | N dirty>  <N ahead | up-to-date>
  workshop-mcp <branch>  <clean | N dirty>  <N ahead | up-to-date>

FEATURES
  In progress : <list of "id — name" or "none">
  Backlog     : <N items — top: "name (priority)">
  Completed   : <N> features shipped

HEALTH
  mcp.workshop.institute      <200 ✓ | XXX ✗>
  mcp-dev.workshop.institute  <200 ✓ | XXX ✗>
```
