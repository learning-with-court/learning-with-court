---
name: setup-workshop
description: Use this when the user wants to start a learning-with-court workshop they don't have set up yet — phrases like "I'd like to learn <topic>", "I want to learn how to <build X>", "teach me <topic>", "help me get started", "set up a workshop", "start a workshop", "set up the <name> workshop", "begin the lwc workshop". This helps the user pick a workshop from the live `lwc catalog`, then hands them `lwc start <id>` to paste into a new terminal window, where a browser tab takes them through setup. Do NOT use this if the user is already inside a workshop project (look for a .mcp.json with an `lwc-*` server entry — they're already set up).
---

You're helping the user start a learning-with-court workshop.

## Stay quiet about internals — read this first

Do every routing check **silently**. Whether you're inside a workshop project, which step you're on — all of that is INTERNAL plumbing the learner must never see. Don't narrate it, and don't preface the catalog with step-by-step rationale for your tool calls.

Specifically, never say things like "Step 1 is non-optional", or name which skill you're switching to.

**Your first learner-visible output is a short greeting plus the workshop catalog** (the grouped list from `lwc catalog`) — nothing before it. A friendly one-liner ahead of the list is fine ("Here's what's available:"). All the routing logic below must still HAPPEN — just do it silently and lead with the catalog. (The one exception is a genuine failure the learner must act on — e.g. `lwc` not installed — which you surface per the relevant section.)

## Background

learning-with-court hosts technical workshops. The `lwc` CLI (a standalone Go binary, installed by a one-line script, no Node/npm required) is the entry point for all of them. `lwc start <id>` sets a workshop up: it opens a start page in the browser that checks the computer, installs what the workshop needs, signs the learner in, sets the workshop up, and opens it with the lesson beside Claude Code.

This skill only helps the learner choose. It doesn't run setup itself, because `lwc start` needs a terminal of its own: some installs ask for the computer's password there, and Claude Code's working directory can't move into the new workshop mid-session.

## Available workshops

The current catalog is fetched live by the CLI. Run this in Bash to see what's available in the user's environment:

```bash
lwc catalog
```

**`lwc catalog` already groups its output — present it the way the CLI grouped it; don't re-sort or flatten.** It renders two kinds of entries:

- A **series** prints as one block: a `<Series Title> (series)` header followed by its member workshops numbered in order (`1. <id>`, `2. <id>`, …) with each member's title, difficulty, and `Trigger:` phrase indented under it. A series is one learning path taken in order across its N workshops — treat it as a **single choice**, not N peers.
- A **standalone** workshop (a series-of-one) prints individually below the series blocks: `<id>`, then its title/difficulty/`Trigger:`.

So when you present the catalog to the user, mirror that grouping: show each series as ONE option (its title, that it's an N-workshop series taken in order, optionally a one-line tagline) and list standalone workshops individually. Never list a series' member workshops as separate peer choices and never reorder by difficulty.

Each entry includes a `Trigger:` phrase showing how the user might ask for it. Match the user's request:

- **If the user named a workshop or series** (id or title fragment), confirm the match by stating which one and what it teaches; ask only if their phrasing is ambiguous. For a series match, confirm the series (not a single member).
- **If the user's phrasing is generic** ("I want to learn about X", "start a workshop", "let's begin"), list the available options as the CLI grouped them — each series as one entry, each standalone individually, with one-line titles — and ask which one they want. Do NOT auto-pick even if one is a strong tag/title match — generic phrasing means intent isn't established.
- **If only ONE option is in the catalog AND the user named it or used a topic word that's unambiguous for it**, default-pick it but say its title + one-line summary in your confirmation so the user can correct.
- **If multiple options match**, list candidates and ask.
- **If the user picked a series**, see the series note in Step 3: the id you hand them is its FIRST (order-1) member; the orchestrator carries the learner through the rest in order.
- **If the user named a workshop or member that's `(coming soon)`**, tell them politely it isn't ready yet — don't hand them a line for it.

## Steps

### 1. Check that lwc is installed

Run `command -v lwc` silently (`Get-Command lwc` in PowerShell). If it succeeds, go on. If it fails, the learner hasn't installed `lwc` yet. Skip to Step 2 to help them choose, then in Step 3 give them the full one line instead of `lwc start <id>`: it installs `lwc` and starts the workshop in one go.

### 2. Confirm which workshop (always do this — never skip)

This step is mandatory, but keep that fact to yourself — never tell the learner a step is "non-optional" or narrate that you're on it.

**Run `lwc catalog` before anything else the learner sees.** Parse the output. Apply the matching rules above. The user should ALWAYS see what's in the catalog OR a clear statement of which workshop you're about to hand them and what it teaches. If `lwc` isn't installed, you can't run `lwc catalog`: point them to <https://workshop.institute/workshops> to choose, and ask which one they picked.

**Never go to Step 3 without having either listed the catalog to the user OR confirmed an unambiguous single match.** Semantic guesses are not confirmation; if you "feel" you know the answer without enumerating the catalog, you're skipping this step — go back and run `lwc catalog`.

This rule has two failure modes that get hit in practice and that you MUST avoid:

1. **User says the landing page's example phrase verbatim** ("I'd like to learn how to work with Claude Code"). That phrase is anchoring copy from the landing page — treat it like any other natural-language request. Run `lwc catalog`, see what's available, list candidates if the phrase matches more than one workshop, ask. Do NOT default-pick `claude-code-basics` without listing the catalog just because the words "Claude Code" are present.
2. **User says something generic** ("I'd like to start a workshop", "what workshops are there?", "let's begin"). Generic phrasing means intent isn't established. Run `lwc catalog`, list the options as the CLI grouped them — each series as one entry, each standalone individually, with one-line titles — and ask.

If you've run `lwc catalog` and the catalog has exactly one workshop in `status: available` AND the user named a topic that's unambiguous for that workshop, default-picking is fine. In every other case, ask.

If `lwc env switch dev` is active, the catalog you fetch reflects the dev set. Mention the active env in your confirmation when it's not prod — e.g. "`git-basics` (from the dev catalog)". Get the active env from `lwc env current` if you need to double-check.

### 3. Hand off to lwc start

**Series → first workshop.** `lwc start` takes a *workshop* id, not a series id. If the user picked a series, the id you hand them is its **order-1 member** — the workshop numbered `1.` in that series' block in `lwc catalog`. Tell the learner in one line that the series runs in order across its N workshops and the orchestrator will carry them through the rest. For a standalone, use its id directly.

Tell the learner, substituting the real id:

> To start `<id>`, open a new terminal window and paste this line:
>
> ```
> lwc start <id>
> ```
>
> A browser tab then takes you through setup: it checks your computer and installs anything the workshop needs, signs you in, and opens the workshop with the first lesson beside Claude Code. If your computer asks for its password, type it in that terminal window. Nothing shows as you type, and that's expected.

If `lwc` isn't installed (Step 1), give the full line in place of `lwc start <id>`, one code block for each OS:

> **macOS / Linux:**
> ```
> curl -fsSL https://get.workshop.institute | sh -s -- --start <id>
> ```
>
> **Windows (PowerShell):**
> ```
> $script = iwr https://get.workshop.institute/install.ps1 -useb; Invoke-Expression "& { $script } -Start <id>"
> ```

What happens after they paste it, step by step, is at <https://workshop.institute/getting-started>.

### 4. Handy follow-ups (don't run unprompted)

If the user asks "what else can I do?":

- `lwc start` — open your workshop again, or choose one if you have several
- `lwc list` — show installed workshops
- `lwc refresh [<id>]` — pull workshop content updates
- `lwc update` — self-update the `lwc` CLI itself
- `lwc remove <id> [--delete-files]` — uninstall
- `lwc auth status` — confirm signed in

### 5. Stop. Don't try to start the workshop.

After Step 3, you're done. The workshop runs from the session `lwc start` opens. If the user asks you to run `lwc start` for them, explain briefly that it needs a terminal window of its own, because it may ask for their computer's password there.

## Tone

Friendly, direct, brief. The goal is "pick a workshop and get going." If anything goes wrong, be specific about what to do next.
