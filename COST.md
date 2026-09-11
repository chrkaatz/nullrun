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

## traditional — plan-driven, code durable

Method: a written design (`traditional/docs/superpowers/specs/`) and an implementation plan
(`traditional/docs/superpowers/plans/`) carrying the complete code for all ten tasks, executed
task-by-task with a fresh implementer and a fresh reviewer per task, and a fix round whenever a
review found something. The code is meant to be kept, not thrown away.

Measured 2026-09-11, at `592975f` on branch `traditional-arm`.

| | |
|---|---|
| commits | 18 |
| **engine** | **694 lines** — 8 modules, framework-free, no DOM |
| **engine tests** | **685 lines** — very nearly 1:1 with the engine |
| **ui** | **312 lines** of TSX + 137 lines of CSS and entry point |
| ui tests | 66 lines |
| shared art | 80 KB generated (19 tiles, base64) — not authored here |
| **build** | **324 KB `dist/`** — 312 KB JS, of which ~107 KB is the embedded art |
| under test | 17 criteria · 76 tests · 10 tasks · 32 recorded rulings |

### Where the effort actually went

Not into writing the game. The plan supplied every line of engine code verbatim, and the four
tasks that were pure transcription (rng, types, content, run start, route) took one dispatch
between them and needed no correction beyond a single flavour-text collision.

The effort went into **finding out which of the seventeen criteria were actually testing
anything.** Of the seventeen, five were passing without teeth when handed over:

| criterion | what was wrong |
|---|---|
| `A13` | assertion reduced algebraically to `pressDamage × turnsAllowed > 0` — true for *every possible implementation* |
| `A3` | asserted a turn count and a cap enforced structurally upstream; nothing about conservation |
| `A10` | `getComputedStyle(el).minHeight` under jsdom, which never processes the CSS import — reads `''` and passes unconditionally |
| `A16` | compared the stored ceiling against a fresh call to the same function on the same state |
| `A17` | instant-encounter fraction has no reachable failure mode under any policy the game permits |

`A13` is the one that matters. It exists to catch "a resource bounded such that the outcome is
decided before play begins" — and it sat green through the entire life of a bug that did
exactly that. `advanceLayer`'s route branch never reset `spent` before generating offers, so
every ceiling shown to the player was computed from the team that had just finished fighting
rather than the refreshed team they would actually bring. Measured effect across 200 seeds:
`hunter` and `sweep` were achievable **zero** times at every layer, every node was softened by
the A2 fallback down to whatever the (wrong) ceiling was, and all 200 runs cleared all seven
route layers. The route was a formality and the game was one boss fight.

### What caught what

Three layers of verification, and **each one was blind exactly where another worked**:

| defect | unit tests | 200-seed statistical run | opening the app |
|---|---|---|---|
| route ceilings computed from the spent team (A16) | blind — the A16 test builds state from `startRun`, where nobody has fought, so both readings agree | **caught it** | — |
| `wren` refunding RAM above `ramMax` (A3, A11) | **caught it** | blind — no scripted policy reaches it, they spend big hitters first | — |
| "Turns left 7" where `turnsAllowed` is 6 | blind | blind | **caught it** |
| every load requesting `/favicon.ico` (A8) | blind — the scan reads `src`, not `index.html` | blind | **caught it** |
| operative text running together into one line | blind | blind | **caught it** |

No two of those three layers would have been sufficient. That is the arm's main result, and it
is not a claim about this game: a statistical harness cannot see what its own policy never does,
a unit test cannot see what it never constructs, and neither can see what is plainly wrong on
screen.

A fourth lesson, narrower but sharper. One ten-line regression test written *during this run,
by the controller, while auditing every other test for exactly this*, contained three separate
false-green traps: the assertions were ordered so the detector never fired, the two sides
compared different layers so the arithmetic passed with the bug present, and the reported
evidence number was wrong because of it. Every one was found by **running the test against the
broken code**, and none by reading it. Reviewers had read it and passed it.

### What it did not deliver

- **A17 is met, not earned, for one sentinel.** `wall` is reached 41 times across ~1600
  encounters against `cold`'s 980. The criterion says every piece of content is reached; two of
  four route sentinels needed a content change to get there at all, and the third is thin.
- **The criteria that measure the measuring instrument are still weak.** `A17`'s
  "decisions per encounter" counts completed turns, not decisions — a mid-turn clear records one
  fewer and a heat-out records zero for its final turn, while press-plus-calls inside a turn are
  never counted. The bias is conservative, so the number stands; the label does not.
- **`A1` is shallow.** One seed, compared through `RunSummary` only. Nondeterminism that does
  not move a summary field is invisible to it.
- **Nothing tests the UI's behaviour**, only its text. The two UI defects above were found by a
  human-equivalent look at the running app, and nothing in the suite would catch their return.

### The handover caveat

> This arm was handed the first arm's lessons as criteria A13, A14, A15 and A17. It is cheaper
> partly because it was told. The comparison measures method given those lessons, not method
> from zero.

And a second caveat the first arm did not need: four of those handed-over criteria arrived with
assertions that did not test them. Being told the lesson is not the same as being given a check
that enforces it.

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
