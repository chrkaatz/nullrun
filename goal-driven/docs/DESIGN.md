# NULLRUN — design language

Imported 2026-09-17 from the Claude Design project *Sci-fi Roguelite Card Game*
(`7d8dbcae-bae0-44b1-9964-cb12e5769aab`, file `nullrun.html`), read with the DesignSync tool.

**This is the look and the voice, not the rules.** Nothing here changes a mechanic, a number or a
criterion. The build's own balance is tuned against a bar and must stay as it is.

**Nothing checks this document.** No criterion reads it, and the kill matrix cannot see it. It is
product input, in the same sense as `docs/PRODUCT.md`, and whether the build honours it is a
measurement rather than a requirement.

## Palette

Three semantic colours carry meaning, and the meaning is what matters more than the hex:

| token | value | means |
|---|---|---|
| `--you` | `#4fc4c4` | you, your resources, anything you own or control |
| `--world` | `#d9a13b` | the world: construct integrity, the trace meter climbing |
| `--harm` | `#cf6242` | harm, incoming and arriving |

Ground and ink:

    --bg #0b0d11   --panel #12151b   --panel2 #0f1217   --line rgba(255,255,255,.08)
    --ink #eceef1  --dim #9aa1ab     --faint #5f6873

The page sits on `#08090b` under a radial wash to `#141821` at the top. Colour is never the only
carrier of state — every value is also stated in text.

## Type

System sans for content, monospace for labels and numbers.

- titles: `700 27px/1.08`, letter-spacing `-.02em`, two short lines
- kicker: `400 11px` mono, letter-spacing `.16em`, `--faint`, uppercase — the small label above a title
- chips and readouts: mono, `.06–.14em` tracking
- body notes: `400 12px/1.55` sans, `--dim`

## Shape

A single centred console column, `max-width: 430px`, bordered left and right so it reads as a
device rather than a page. Above it a persistent bar: an identity on the left
(`ZAIBATSU CONSOLE`), run status on the right (`SEED ABC123 · LAYER 3 OF 8`).

Screens are a vertical stack with `13px` gaps and `20px 18px 24px` padding, a flexible spacer that
pushes the primary action to the bottom edge. Radii step down by role: panels `16px`, buttons and
art `14px`, cards `12px`, chips and meters `99px`.

## Components

- **panel** — the default container; `.flat` is the quieter recessed variant
- **chip** — a pill-shaped readout, tinted `you` / `world` / `harm` by what it describes
- **meter** — a 6px bar; the trace meter pulses at critical, and only at critical
- **node** — a large tappable route option, at least 88px, name and tag on one line, the terms
  underneath
- **card** — a roster contact, three to a row: a coloured band carrying role and cost, a portrait
  window, the name, then a sentence of effect. Spent cards go grey-banded; unaffordable cards go
  dashed and dim
- **lrow** — a list row with a 4px colour rail down its left edge
- **feed** — a single line of narration under the action, telling you what just happened
- **dash** — a dashed advisory box for a rule the player should know
- **keys** — a dim monospace line naming the keyboard shortcuts

## Voice

Second person, present tense, short. Titles are a sentence or a question, never a label:

> Who are you taking in? · Choose your way down. · Node is yours. · Someone has to go. ·
> The arcology goes quiet. · You got out with less than you brought.

Kickers are uppercase mono status, not prose: `PRE-RUN / TEAM`, `ON RETAINER`,
`LAYER 3 OF 8 · ALARM 1 · 240¤`.

Every contact states what it does in one flat sentence — *"Drone strike. 8 damage, ignores
armour."* — and every contact carries a role: `RIGGER`, `FACE`, `SAMURAI`, `DECKER`, `SCOUT`,
`MEDIC`, `FIXER`, `COURIER`, `MUSCLE`, `FORGER`, `INFILTRATOR`, `EX-CORPSEC`. Credits take a `¤`
suffix.

Constructs are named as places and machines, with a one-word tag: `ICE WALL` (COMBAT),
`CORPSEC SWEEP` (HARD), `COLD STORAGE` (QUIET), `HUNTER` (HARD), `ARCHON` (CORE).

## Interaction

Touch and keyboard mirror each other completely: digits select, `ENTER` confirms the primary
action, `ESC` bails. A screen change rises `8px` over `.28s`; nothing else moves except the trace
meter at critical. All motion is off under `prefers-reduced-motion`.

Below 380px the roster drops from three cards a row to two.
