# What each approach cost

Three approaches to the same game, kept side by side so they can be compared rather than
argued about. This file is the ledger. Fill a column when an approach reaches a playable,
checked build.

**On money.** Claude cannot see its own token usage or billing, so no figure here is a
dollar amount. Session spend comes from `/cost` in Claude Code; `rtk gain` and
`rtk gain --history` report the proxy's token savings per command. What is recorded below is
the part that can be counted from the repository itself.

---

## ephemeral — spec-driven, code disposable

Method: `ephemeral/docs/NULLRUN-SPEC.md` is authoritative; the build is a disposable render of
it. Rebuild rather than patch whenever an invariant, the turn contract, or two systems change.

Measured 2026-09-10, at `spec/0.9.5`.

| | |
|---|---|
| commits | 18 |
| spec versions | 14 tagged, spanning 2 days |
| **spec** | **2,988 words** |
| **build** | **595 lines, 112 KB** — one self-contained HTML file |
| conformance records | 7,127 words across 11 measured runs |
| change log | 2,100 words, 20 versions |
| linter | 111 lines |
| under test | 19 FR · 8 NFR · 8 invariants · 19 checks · 12 open questions |

### Where the effort actually went

The code is the smallest artifact. 595 lines of build against roughly 12,000 words of spec,
measurement and history — a ratio of about 1:20. If the premise holds that code is ephemeral,
the 112 KB thrown away at the next rebuild is the cheap part, and the expensive part is what
lets that rebuild happen in a single pass.

A large share of the session went into finding defects in the process rather than building
the game:

| found | what it was |
|---|---|
| `K16` rigged harness | passed for six versions by zeroing trace and firewall each turn |
| `NFR-8` corruption | `replace('FR-8','FR-9')` matched inside `NFR-8`; wrong for five versions |
| `K15` hollow wins | 40% win rate bought by collapsing encounters to one turn |
| `I2` deleted with alarm | took the guarantee of a takeable node with it; found by playtest |
| missing change log entry | 0.9.1 recorded in spec and conformance but not the log |
| untested claim | conformance note asserted a linter catch that would not have happened |

That is not overhead on the method — it is what the method produced. The linter now costs
111 lines instead of another five versions of the same class of bug.

### What it did not deliver

Playability arrived at `0.7.0`, the seventh version. The first build passed **all fourteen**
conformance checks while being mathematically unwinnable, because §K tested that the rules
held and never that the game could be finished.

---

## traditional

Not started. Fill this in the same shape when it has a playable, checked build.

## goal-driven

Not started.

---

## Comparing fairly

For the comparison to mean anything, the approaches need the same target and the same
definition of done. Two things to settle before the second one starts:

1. **What counts as finished.** `ephemeral` uses §K, nineteen checks including viability. If
   the other approaches use a weaker bar, they will look cheaper for the wrong reason.
2. **What is shared.** The art in `ephemeral/art/src/` is method-neutral and reusable;
   regenerating it would cost effort that has nothing to do with the approach being tested.
