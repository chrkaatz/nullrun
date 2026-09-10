# NULLRUN — traditional arm, design

**Date:** 2026-09-10 · **Status:** approved in chat, pending written review

## Purpose

Build NULLRUN a second time with mainstream tooling and a conventional workflow, so it can be
compared against `ephemeral/`, which built it spec-first with a disposable single-file build.

The game is the constant. **The method is what is being measured.**

## What this arm is handed

### Part II of the ephemeral spec, verbatim

234 words: identity, primary job, four design pillars. This is the shared target — both arms
must aim at the same product or the comparison measures two different games.

**It is not a clean-room brief, and the leak is recorded rather than pretended away.** Part II
was itself revised by findings from the first arm. Specifically, pillar 3 now reads:

- "gone for the rest of the **node**" — was "the rest of the run" until 0.6.0, when run-scoped
  burn was measured unwinnable
- "Beneath that sits a floor you can never spend: you always have something, it is simply never
  enough" — added in 0.4.0. That sentence *is* the free renewable action, described

So this arm starts knowing that capability exhausts per encounter and that some unspendable
floor exists. It does not know what either looks like.

### Acceptance criteria, translated to be design-neutral

`ephemeral`'s §K has 19 checks. Only four (K7, K10, K11, K12) are free of vocabulary the first
arm invented; K16 alone names eight such terms. Handed over verbatim they would smuggle across
most of the requirements.

They are therefore restated as properties any implementation of the brief must have. The bar
is identical. The mechanism is not supplied.

| # | criterion | from |
|---|---|---|
| A1 | Same seed and same input sequence reproduce a run exactly, including its final score. | K1, K7 |
| A2 | Every choice point offers distinct options, priced differently, at least one of which is achievable with what the player currently has. | K2 |
| A3 | Resource accounting is conserved: nothing is silently created, duplicated or destroyed, over at least 500 turns of play. | K3, K4 |
| A4 | No harm reaches the player that was not shown, at its exact value, before it landed. | K5 |
| A5 | An action the player cannot afford changes no state at all. | K6 |
| A6 | The player always has a legal action, and every screen offers a way onward. | K8 |
| A7 | Every entity, value and state is readable in greyscale. State is never carried by colour alone. | K9 |
| A8 | No network request is issued at runtime. | K10 |
| A9 | No horizontal scroll at 360px wide. | K11 |
| A10 | Every interactive target is at least 44px on its short edge. | K12 |
| A11 | Any declared cap is enforced and never exceeded. | K13 |
| A12 | Damage mitigation never reduces an attack to nothing unless the rules say so explicitly. | K14 |
| A13 | **No resource may be bounded such that the outcome is decided before play begins.** | K16 |
| A14 | **Every pressure mechanic must bind: removing it changes outcomes materially.** | K17 |
| A15 | **No free or renewable action may trivialise the primary resource.** | K19 |
| A16 | The player can see whether a choice is achievable before committing to it. | K18 |
| A17 | **Viability.** A competent scripted policy wins 15–65% of 200 seeds, encounters average at least 2.5 decisions, under a tenth end before a decision is taken, and every piece of content is reached across the sample. | K15 |

A13, A14, A15 and A17 are the first arm's hardest-won findings, and each cost several versions
to discover. Handing them over is deliberate — a real team does not re-learn — but it means a
cost comparison **must not** be read as "traditional was cheaper." It was cheaper partly
because it was told.

### Shared assets

Art is reused from `ephemeral/art/src/` — 19 tiles, already cut and colour-matched. It is
method-neutral; regenerating it would measure nothing.

## What this arm is NOT handed

Part III of the ephemeral spec: 19 functional requirements, 8 invariants, the tunables, and the
content tables. That is 2,236 words and represents the entire design output of the first arm.
This arm discovers its own turn contract, its own pressure mechanic, its own economy and its
own balance.

## Architecture

    traditional/
      src/engine/        pure TypeScript, no React — rules, state, RNG
      src/engine/*.test.ts
      src/ui/            React components, rendering only
      src/main.tsx
      index.html
      vite.config.ts

**The engine is framework-free by rule.** Three reasons:

1. It is the artifact directly comparable to `nullrun.html`'s logic.
2. The statistical criteria — A3 over 500 turns, A17 over 200 seeds — run headless in
   milliseconds. The first arm drove every one of these through Playwright by hand, which was
   the single largest cost in its conformance runs.
3. A pure engine is testable without a DOM, which is what makes TDD practical here.

React renders state and dispatches intent. It holds no rules.

## Testing

Vitest. The acceptance criteria above become executable tests, written **before** the engine,
per the superpowers TDD workflow. A1–A6 and A11–A17 are engine tests. A7–A10 are DOM or build
assertions.

The contrast with the first arm is the point: there, conformance was a hand-driven browser
harness re-written each version, which is how `K16` came to pass for six versions on a rigged
harness that zeroed the state it was meant to check. Here the criteria are ordinary tests that
run on every change.

## Definition of done

All seventeen criteria pass, with A17 — viability — being the one that decides whether the
thing is a game. The first arm shipped a build that passed all fourteen checks it had while
being mathematically unwinnable, because none of them asked whether the game could be finished.

## Cost recording

`COST.md` at the repository root, in the same shape as the `ephemeral` section: artifact sizes,
where the effort actually went, and what the method failed to catch. The handover caveat above
goes in that entry.
