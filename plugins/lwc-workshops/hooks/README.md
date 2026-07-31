# Plugin hooks

These hooks are the **learner-side transport for live assist** (instructor-led
events only). They do no HTTP themselves — each one pipes its stdin payload to
`lwc assist turn`, which already owns endpoint resolution, the token cache, and
workshop-context detection.

| Hook | Sends | Prints |
|---|---|---|
| `UserPromptSubmit` | the learner's prompt | pending operator whispers/messages, as session context |
| `Stop` | a bounded summary of the guide's last response | nothing |

## Why this is quiet by default

`lwc assist turn` always exits 0 and prints nothing unless **all** of these
hold: the session is inside an installed workshop, a cached token exists, and
the learner is registered for an event whose definition sets `liveAssist:
true`. Outside a live event the platform returns `{streaming:false}` and no
data is retained. A learner not in an event pays one silent, capped
(2s) local call per turn and nothing else.

Nothing here can block or slow a workshop: no failure mode — endpoint down,
slow, malformed response, no token — produces output or a non-zero exit.

See `docs/superpowers/specs/2026-07-30-live-learner-assist-design.md` in the
workspace repo for the consent model and the full design.
