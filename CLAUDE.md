# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

NULLRUN is a spec-first project. `docs/NULLRUN-SPEC.md` is authoritative; the build is a
disposable render of it. There is no framework, no package manager, no build step, and no
dependency tree — the whole game is one self-contained HTML file (`nullrun.html` at the repo
root) with inline CSS and JS.

**Read `docs/NULLRUN-SPEC.md` in full before touching the build.** It is kept small by design
(M5) so a rebuild is a single pass with the whole spec in view.

The current spec is 0.3.0, imported from the design prototype in the Claude Design project
"Sci-fi Roguelite Card Game" (`7d8dbcae-bae0-44b1-9964-cb12e5769aab`, file `nullrun.html`),
readable with the DesignSync tool after `/design-login`. Note that project also carries its
own copy of `NULLRUN-SPEC.md`; the local one is authoritative and diverges from it where it
disagreed with the prototype.

## The method (Part I) — this is the part that changes how you work

- **The spec leads, the code follows.** Behavior in the build that is not traceable to a line
  in the spec means the build is wrong or the spec is incomplete. Fix the document first.
  Never "improve" the game by adding rules the spec does not describe.
- **Classify feedback before changing anything** (M3): `tune` → §T, `content` → §C,
  `defect` → patch build only, `gap` → amend the FR/NFR, `feature` → new FR, `feel` → §O and
  do nothing until it can be renamed.
- **Iterate vs rebuild** (M4). Iterate only when the change is confined to §T, one row of §C,
  or one system in §S, no §I invariant moves, and §K still passes. Otherwise regenerate the
  whole file and discard the old one. A rebuild is also forced by a change to FR-2, a change
  touching two or more systems, untraceable behavior, three accumulated patches (drift
  budget), or exceeding NFR-7.
- Every rebuild or requirement change gets a change log entry at the bottom of the spec.

## Architecture the spec dictates

Single file, top to bottom, with the sections marked by comment banners naming their spec
section (`§T`, `§C`, `S1`, `S2/S3`, `S7`, `S8`):

1. `CONFIG` — every balance number lives here and nowhere else (§T). A value hardcoded
   elsewhere is a defect.
2. Content tables as data, not code paths (§C): `CONTACTS`, `CONSTRUCTS`, `PERSONA`,
   `HARDWARE`, `POOL`. A contact is a row whose effect composes from a fixed vocabulary —
   damage, pierce, strip, firewall, trace, RAM refund. Adding a contact must not mean adding
   a branch.
3. One run-scoped RNG seeded from the run seed, consumed in a fixed order by node offers and
   payout offers (NFR-2). `Math.random` is only allowed for choosing a fresh random seed.
   Determinism (I1) is a hard invariant and the easiest thing to break by reordering draws.
4. A single mutable state object for the run, and one `render()` that rebuilds the view from
   it. Render on state change only (NFR-6) — no `requestAnimationFrame` loop.
5. Five screens (FR-16): loadout, offers, encounter, payout, end. Release is a state of
   payout, not a sixth screen.
6. Persistence is `localStorage` holding banked credits only, wrapped so failure degrades to
   a fresh collection (FR-15).

The invariants §I are the load-bearing constraints: roster conservation (I3), no damage that
was not displayed for the whole turn (I4), a legal action always available (I5), an
unaffordable contact changing nothing (I6). Check any change near the turn engine or the
roster against them explicitly.

## Constraints that are easy to violate accidentally

- **No network requests at runtime, ever** (NFR-1) — including web fonts. No CDN, no external
  assets; embed anything needed.
- Under 1,600 lines and under 150 KB (NFR-7). Exceeding it forces a rebuild.
- Portrait first (NFR-5): designed at 390px, playable from 360px, no horizontal scroll, and
  every interactive target at least 44px on its short edge (FR-17).
- Readable in greyscale: intents state their value in text, burned contacts are marked by
  label rather than tint (NFR-3).
- No motion the user did not trigger except the trace meter at critical level, all animation
  suppressed under `prefers-reduced-motion` (NFR-4).

## Running and verifying

Open the built file directly: `open nullrun.html`. There is no dev server, and adding one
would violate the self-contained premise.

Verification is the §K conformance checklist (K1–K14), not a test framework. A rebuild is
accepted only when all pass. Several are statistical (50 runs for node offers, 500 turns for
roster conservation), so they are run as throwaway harness scripts against the game's own
functions rather than as a committed suite. Do not claim a rebuild is done without running
them.
