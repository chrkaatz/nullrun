# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Three approaches to building the same game, kept side by side so they can be compared. The
game is NULLRUN, a short turn-based deckbuilder; the experiment is the *method*, not the game.

    ephemeral/     spec-driven, code disposable — complete, playable, at spec/0.9.5
    traditional/   not started
    goal-driven/   not started
    COST.md        the ledger comparing them

**Work inside one approach at a time.** Each carries its own guidance: `ephemeral/CLAUDE.md`
describes the spec-first method and is the one to read before touching anything in there. Do
not import habits from one approach into another — the differences between them are the
experiment.

## Shared infrastructure

`.githooks/pre-commit` runs every `*/tools/speclint.py` against the **staged** content, so a
broken spec cannot slip through on a clean working tree. It is wired via `core.hooksPath`, so
it is versioned rather than hidden in `.git/hooks`. Bypass deliberately with
`git commit --no-verify`.

An approach that ships no linter is simply skipped by the hook.

## Comparing honestly

`COST.md` is the ledger. Two things decide whether the comparison means anything, and both
are set by the person running the experiment, not by whoever writes the code:

- **The bar for "done" must be the same.** `ephemeral` gates on nineteen §K checks including
  a viability check that a build must be winnable at a sane rate. An approach with a weaker
  bar will look cheaper for the wrong reason.
- **Method-neutral work should be shared, not redone.** The art in `ephemeral/art/src/` is
  cut, colour-matched and reusable. Regenerating it in another approach measures nothing.

Record what an approach cost in the same shape as the `ephemeral` section: artifact sizes,
what the effort actually went into, and what the method failed to catch.
