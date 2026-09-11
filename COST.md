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
task-by-task with a fresh implementer and a fresh reviewer per task, a fix round whenever a
review found something, and a whole-branch review at the end. The code is meant to be kept.

Measured 2026-09-11, at `main`.

| | |
|---|---|
| commits | 27 |
| **engine** | **734 lines** — 8 modules, framework-free, no DOM |
| **engine tests** | **739 lines** — slightly more test than engine |
| **ui** | **322 lines** of TSX + 137 lines of CSS and entry point |
| ui tests | 198 lines |
| shared art | 80 KB generated (19 tiles, base64) — not authored here |
| **build** | **324 KB `dist/`** — of which ~107 KB is the embedded art |
| under test | 17 criteria · 88 tests · 10 tasks · 41 recorded rulings |

### Where the effort actually went

Not into writing the game. The plan supplied every line of engine code verbatim, and the three
tasks that were pure transcription went out as a single dispatch and needed one correction — a
flavour-text collision, where the plan's own content table tripped the plan's own purity guard.

The effort went into **finding out which of the seventeen criteria were actually testing
anything.** Six were not. Of those six, four were repaired and two were left nominal and are
recorded as such:

| criterion | what was wrong | now |
|---|---|---|
| `A13` | assertion reduced algebraically to `pressDamage × turnsAllowed > 0` — true for *every possible implementation* | **repaired**, three falsifiable assertions, mutation-checked |
| `A15` | compared press damage over six turns when a node really gives seven; the free action *could* clear the softest node at layers 6 and 7 | **repaired**, arithmetic corrected and the game retuned around it |
| `A3` | asserted a turn count and a cap enforced structurally upstream; nothing about conservation | **repaired**, every step audited for RAM, duplicates, cap and credits |
| `A10` | `getComputedStyle(el).minHeight` under jsdom, which loads no stylesheet — computes `'auto'`, and the assertion whitelisted `'auto'` and `''` | **repaired as a source check**, not a layout one; the rendered box is measured in a browser, not asserted |
| `A16` | compared the stored ceiling against a fresh call to the same function on the same state | **repaired** — an independent oracle in `spoils.test.ts`; the route-level check is still circular |
| `A17` | instant-encounter clause has no reachable failure mode under any policy the game permits | **left nominal.** 0 is the only value it can see. Recorded, not repaired |

And `A9` was enforced **nowhere at all** until the final review looked for it — no test, no
assertion, seventeen criteria and only sixteen of them present in the tree.

`A13` and `A15` are the two that matter, and they fail the same way. Both exist to catch a game
whose outcome is settled by arithmetic rather than play, and both sat green while exactly that
was true. `A13` was green through the entire life of a bug where route ceilings were computed
from the team that had just finished fighting rather than the refreshed team the player actually
brings: `hunter` and `sweep` were achievable **zero** times at every layer, every node was
softened down to the (wrong) ceiling, and all 200 runs cleared all seven route layers. The route
was a formality. `A15` was green because it budgeted six presses where a node gives seven — the
turn that fills heat is still a turn you act in, and a kill on that press clears the node before
the heat check runs. At the shipped tuning the free action alone cleared the softest node at the
last two layers, which is the precise thing A15 forbids.

### What caught what

Four layers of verification, and **each was blind exactly where another worked**:

| defect | unit tests | 200-seed run | opening the app | whole-branch review |
|---|---|---|---|---|
| route ceilings from the spent team (A16) | blind — the A16 test builds state from `startRun`, where nobody has fought, so both readings agree | **caught it** | — | — |
| `wren` refunding RAM above `ramMax` (A3, A11) | **caught it** | blind — no scripted policy reaches it | — | — |
| "Turns left 7" vs `turnsAllowed` 6 | blind | blind | **caught it** | — |
| every load requesting `/favicon.ico` (A8) | blind — the scan reads `src`, not `index.html` | blind | **caught it** | — |
| operative text running together | blind | blind | **caught it** | — |
| the press really gets seven turns (A15) | blind — the test asserted the same formula the engine used | blind — the policy never presses alone | blind | **caught it** |
| A9 enforced nowhere | blind | blind | blind | **caught it** |
| a living sentinel displaying "0 LEFT" | blind | blind | blind | **caught it** |

No three of those four would have been sufficient. That is this arm's main result, and it is not
a claim about this game: a statistical harness cannot see what its own policy never does, a unit
test cannot see what it never constructs, neither can see what is plainly wrong on screen, and
none of the three can see a criterion that was never written down.

A fifth lesson, narrower but sharper. One ten-line regression test written *during this run,
while auditing every other test for exactly this*, contained three separate false-green traps:
the assertions were ordered so the detector never fired, the two sides compared different layers
so the arithmetic passed with the bug present, and the reported evidence figure was wrong because
of it. Every one was found by **running the test against the broken code**, and none by reading
it. Reviewers had read it and passed it.

### The balance, and what it cost to make honest

Measured over 200 seeds with the careful policy, before and after the `turnsAllowed` correction:

| | on the undercount | on the true count |
|---|---|---|
| win rate | 0.385 | 0.305 |
| decisions per encounter | 3.99 | 5.67 |
| A15 worst margin | 2.8 (fictional) | 19.6 |
| sentinels met | cold 980, sweep 237, wall 41, hunter 142 | cold 466, sweep 427, wall 126, hunter 111 |

Correcting the arithmetic broke A15 for real, and the cause was structural rather than a bad
constant: press-only damage grew 11.9 per layer while the softest sentinel grew 5.1, so the free
action outgrew the content and caught it at layer 6. Lowering `pressGrowth` satisfies A15 and
drives the win rate to zero, because A15 reads only non-CORE sentinels and the core fight needs
the press. The fix was to make content outgrow the press instead — `layerScale` 0.10 → 0.20 —
which also produced the best content distribution the arm has had.

### What it did not deliver

- **`A17`'s instant-encounter clause cannot fail** and is recorded as nominal rather than met.
- **`A17` measures completed turns, not decisions.** A mid-turn clear records one fewer, a
  heat-out records zero for its final turn, and press-plus-calls inside a turn are never counted.
  The bias is conservative, so the figure stands; the label does not.
- **`A1` is shallow.** One seed, compared through `RunSummary` only. Nondeterminism that does not
  move a summary field is invisible to it.
- **`A9` and `A10` are guarded at the stylesheet, not the rendered box.** jsdom lays nothing out,
  so the real evidence is a browser measurement at 360×780 across all five screens, and the tests
  are a regression guard on it rather than a proof.
- **Nothing tests UI behaviour**, only its text and its stylesheet. Three of the defects above
  were found by looking at the running app, and nothing in the suite would catch their return.

### The handover caveat

> This arm was handed the first arm's lessons as criteria A13, A14, A15 and A17. It is cheaper
> partly because it was told. The comparison measures method given those lessons, not method
> from zero.

And a second caveat the first arm did not need: of those four handed-over criteria, **two
arrived with assertions that did not test them** — `A13`'s was a tautology and `A15`'s counted
the wrong number of turns. Being told the lesson is not the same as being given a check that
enforces it, and a handed-over criterion is easier to trust than one you had to earn.

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
