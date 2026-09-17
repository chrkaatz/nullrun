# What each approach cost

Three approaches to the same game, kept side by side so they can be compared rather than
argued about. This file is the ledger. Fill a column when an approach reaches a playable,
checked build.

**On money.** Claude cannot see its own token usage or billing, so no figure here is a
dollar amount. Session spend comes from `/cost` in Claude Code; `rtk gain` and
`rtk gain --history` report the proxy's token savings per command. What is recorded below is
the part that can be counted from the repository itself.

**On tokens.** Claude Code writes a transcript per session, and a second transcript for every
subagent that session dispatches, under `subagents/`. Both carry per-message usage. Each arm was
built in one session, so the three map cleanly onto the three arms by date. Measured 2026-09-17:

| arm | subagents | output, main | output, subagents | **output, total** | **all tokens** |
|---|---|---|---|---|---|
| ephemeral | 0 | 1,090,604 | 0 | **1,090,604** | **282.6M** |
| traditional | 18 | 657,496 | 314,835 | **972,331** | **306.5M** |
| goal-driven | 30 | 1,320,021 | 1,127,457 | **2,447,478** | **847.4M** |

**`goal-driven` cost about 2.8× either of the others.** Its subagents alone — 375M tokens, almost
all of it `sonnet` — exceed the entire lifetime of `ephemeral`. Nearly half of everything it
produced was written by an agent other than the one holding the conversation.

Two cautions on reading the table, neither of which changes that ordering:

- **Cache reads are roughly 97% of every total** and are billed at a fraction of fresh input, so
  the "all tokens" column is not proportional to spend. It mostly measures conversation length
  multiplied by turns. The `output` column is the closer proxy for work produced, and it gives the
  same ranking: 1.09M, 0.97M, 2.45M.
- **A session is not exactly an arm.** The `goal-driven` session also produced this ledger's
  entries for all three arms, the whole-branch reviews, and the token accounting you are reading.

The figure this replaces is worth recording as a correction. An earlier pass over these transcripts
found no subagent usage and concluded it was not captured anywhere — the sidechain records are
genuinely absent from the main transcript, which is where I looked. The subagent transcripts sit
one directory down. So the arm that had most reason to look expensive was, for a while, recorded as
the cheapest of the three. It is the dearest by a wide margin.

**And it bears on the headline.** `goal-driven` reached green in one iteration of a budget of
forty. Read alone, that says the method is fast. Read against 847M tokens and thirty dispatched
agents, it says the single iteration was cheap and everything around it — ten tasks of scaffolding,
fifty-three recorded decisions, four rounds of human-driven repair — was not.

The authoritative per-session spend is `/cost` in Claude Code, which only the person running it can
see. `rtk gain --project` reports 1,089 proxied commands for this repository, 407.2K input and
325.2K output through the proxy, 82.7K saved (20.3%) — the proxy's accounting of what it filtered,
not a session total.

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

### What it cost in tokens

Session `fe23c29a`, 2026-09-05 to 09-10. No subagents: every token here was spent in the
conversation itself.

| | |
|---|---|
| output | 1,090,604 |
| cache write | 7,072,322 |
| cache read | 274,401,664 |
| fresh input | 1,474 |
| **all tokens** | **282.6M**, all `opus-5` |

The lowest total of the three arms, and the only one where the figure is complete on its own —
nothing was delegated, so nothing is hidden in a second transcript.

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
| commits | 32 |
| **engine** | **770 lines** — 8 modules, framework-free, no DOM |
| **engine tests** | **786 lines** — slightly more test than engine |
| **ui** | **343 lines** of TSX + 203 lines of CSS and entry point |
| ui tests | 267 lines |
| shared art | 80 KB generated (19 tiles, base64) — not authored here |
| **build** | **324 KB `dist/`**; `pnpm bundle` folds it to a **317 KB single file** |
| under test | 17 criteria · 93 tests · 10 tasks · 41 recorded rulings |

### What it cost in tokens

Session `dbc9043d`, 2026-09-10 to 09-11, plus 18 subagent transcripts — a fresh implementer and a
fresh reviewer per task.

| | main thread | subagents | total |
|---|---|---|---|
| output | 657,496 | 314,835 | **972,331** |
| cache write | 3,483,661 | 7,059,372 | 10,543,033 |
| cache read | 235,242,954 | 59,741,133 | 294,984,087 |
| all tokens | 239.4M | 67.1M | **306.5M** |

By model: 268.8M `opus-5`, 37.1M `sonnet-5`, 0.7M `haiku-4-5`. **Roughly a fifth of this arm lives
in its subagents**, and a third of everything it wrote was written by one — which is what
task-by-task execution with a fresh reviewer each time costs.

The lowest *output* of the three despite delivering the largest codebase, because the plan carried
the engine verbatim and three tasks were pure transcription.

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
| `A16` | compared the stored ceiling against a fresh call to the same function on the same state | **repaired** — an independent oracle in `spoils.test.ts` is what caught the real bug. The route-level check remains a staleness detector only, and is recorded as such |
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

### The artifact, side by side

`pnpm bundle` folds `dist/` into one self-contained `nullrun.html`, so the two arms ship the
same shape of thing and their sizes can be compared at all. Both embed the same 19 art tiles.

| | ephemeral | traditional |
|---|---|---|
| artifact | `nullrun.html`, 116 KB | `dist/nullrun.html`, 317 KB |
| embedded art | 79 KB | 80 KB |
| **everything else** | **37 KB** | **237 KB** |
| hand-written source | 600 lines, one file | 770 engine + 343 UI + 203 CSS |
| to run it | open the file | `pnpm bundle`, then open the file |

The art is a wash, as it should be — it is the same art. The rest is a **6.4× difference** for
the same game against the same seventeen criteria, and it is almost entirely React and the
bundler's runtime. That is the price of the tooling, and it is worth stating plainly because
nothing else in this comparison shows it: the traditional arm's source is more readable, more
testable and far better covered, and its shipped artifact is six times the size.

Folding it to one file also took three tries, each a real property of the tooling rather than a
slip. `String.replace` expands `$&` and `` $` `` in a string replacement, and a minified React
bundle is full of them, so the first attempt spliced the script tag back into the output
nineteen times. A module script is blocked over `file://` even with its code inline, so it has
to become a classic script. And a classic script is not deferred, so in the `<head>` it runs
before `<div id="app">` exists and React fails with "target container is not a DOM element" —
`defer` does nothing on an inline script, so position is the only fix. The bundler now throws
on all three.

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
- **`A1` was shallow** — one seed, compared through `RunSummary` only, so nondeterminism that did
  not move a summary field was invisible. It now replays three seeds step by step and compares
  every intermediate state, and checks a different seed genuinely diverges. What it still does not
  cover is input sequences other than the scripted one.
- **`A9` and `A10` are guarded at the stylesheet, not the rendered box.** jsdom lays nothing out,
  so the real evidence is a browser measurement at 360×780 across all five screens, and the tests
  are a regression guard on it rather than a proof.
- **Nothing tests UI behaviour**, only its text and its stylesheet. Three of the defects above
  were found by looking at the running app, and nothing in the suite would catch their return.

### The handover caveat

> This arm was handed the first arm's lessons as criteria A13, A14, A15 and A17. It is cheaper
> partly because it was told. The comparison measures method given those lessons, not method
> from zero.

**A third handover, recorded rather than pretended away: the encounter layout.** This arm built
the team as a vertical list of full-width rows, which pushed the last operative below the fold on
a 360px screen — a direct violation of pillar 3, *"the whole team is always visible"*, and one
that no criterion caught, because A9 and A10 ask about scroll and target size, not about whether
the thing the pillar names is on screen. Shown the two side by side, the first arm's grid was
plainly better, and it was copied: three cards to a row, cost in the card header, a portrait
large enough to read. The vocabulary stayed this arm's own; only the layout crossed over. So the
UI is no more a from-zero result than the balance criteria are, and a fourth thing the method
failed to catch is that a *pillar* — not a criterion — went unenforced for the whole build.

And a second caveat the first arm did not need: of those four handed-over criteria, **two
arrived with assertions that did not test them** — `A13`'s was a tautology and `A15`'s counted
the wrong number of turns. Being told the lesson is not the same as being given a check that
enforces it, and a handed-over criterion is easier to trust than one you had to earn.

## goal-driven — check-driven, authority in the bar

Method: no specification and no reviewer inside the loop. Seventeen inherited criteria, expressed
as an executable suite, are the entire authority; an unattended loop writes the game and stops
when every check passes and a mutant set proves the checks can fail.

Measured 2026-09-17, after the loop and four rounds of human-driven repair.

| | |
|---|---|
| commits | 59 |
| **the loop's entire input** | **2,341 words** — 307 product, 1,562 contract, 472 method |
| check suite | 1,688 lines — 17 criteria, runner, 17 mutants, kill matrix |
| fixtures | 237 lines — one hollow control, one abstract positive control |
| commit linter | 229 lines |
| design + plan | 21,466 words |
| decisions recorded while building the bar | 53 |
| **iterations to green** | **1**, against a budget of 40 |
| **repairs after green, all human-initiated** | **4** |
| **build** | **1,110 lines** — 359 oracle + 751 artifact, *the rules written twice* |
| under test | 17 criteria · 17 mutants · 26 selftest verdicts |

### The artifact, side by side

| | ephemeral | traditional | goal-driven |
|---|---|---|---|
| artifact | 113 KB | 317 KB | 109 KB |
| hand-written source | 600 lines, one file | 770 engine + 343 UI + 203 CSS | 359 oracle + 751 artifact |
| the rules exist | once | once | **twice** |

The size sits with `ephemeral` — same shape of thing, no framework, art embedded. The line count is
not comparable to either, because 1,110 lines is not one game written once. It is the same game
written twice, and nothing in the bar requires the two copies to agree.

### What it cost in tokens

Session `3d5fdda7`, 2026-09-11 to 09-17, plus 30 subagent transcripts.

| | main thread | subagents | total |
|---|---|---|---|
| output | 1,329,973 | 1,127,457 | **2,457,430** |
| cache write | 11,747,994 | 10,397,608 | 22,145,602 |
| cache read | 464,141,036 | 363,462,758 | 827,603,794 |
| all tokens | 477.2M | 375.0M | **852.2M** |

By model: 480.2M `opus-5`, 372.0M `sonnet-5`.

**About 2.8× either of the other arms.** The subagents alone exceed the whole of `ephemeral`, and
nearly half of everything this arm produced was written by an agent other than the one holding the
conversation. Against that, "green in one iteration of forty" describes only the cheapest part of
the work — the scaffolding around it took ten tasks, fifty-three recorded decisions and 1,688 lines
of checks, and the repairs after it took four more rounds.

### Where the effort actually went

Not into the game, and not into writing checks either. Sixteen of seventeen criteria were
transcribed correctly on the first attempt in every task. Of the 53 recorded decisions, roughly
forty are defects **in the checks themselves** — and almost every one was found by building a
deliberately wrong oracle and seeing whether the criterion noticed, not by reading it.

| found | what it was |
|---|---|
| `deepEqual(NaN, null)` returned true | in the helper A1 uses to compare a run against its replay |
| the scripted policy never ended a turn | 960 free actions, zero ends, pressure permanently 0 — A3, A4 and A14 were measuring nothing |
| a margin validated against its own formula | reported +2 where the truth was −2, reproducing both prior arms' recorded failures in one number |
| half of all choice points offered nothing achievable | a direct A2 violation the fixture passed |
| a mutant that blinded the criteria written to catch it | making calls useless made the policy stop calling, so A12 never saw one |
| deleting all seventeen criteria passed the linter clean | the gap check was gated on the set being non-empty |
| `A17`'s empty-encounter clause could not fail | pinned at 0 across 200,000 replayed sequences |

That last one is the one to keep. `COST.md` already recorded this exact clause as `traditional`'s
one unrepaired criterion — *"no reachable failure mode, left nominal, 0 is the only value it can
see."* It was inherited verbatim, re-implemented, and made **structurally** impossible rather than
merely unreachable. The ledger named it in writing and the arm reproduced it anyway.

### What the loop delivered, and what it did not

The loop reached 17/17 with a lethal kill matrix on its **first** iteration. The result could not
be played past the second screen.

Every target rendered disabled, including one costing 0 credits against the player's 0 credits. Of
fourteen controls in the whole game, four were ever usable; in an encounter, ten of twelve were
dead, so a human could only pass turns until the trace meter ended the run. The scripted policy
won 23% of runs. A human won 0%. The cause was one missing null check — `el()` handed `null` to
`setAttribute`, producing `disabled="null"` on a boolean attribute.

**17/17 with a lethal matrix before the fix. 17/17 with a lethal matrix after it. Not one
criterion moved.**

### What a human found that seventeen criteria and a lethal mutation gate did not

Four defects, all found by playing the game, none visible to any check:

| | defect | why no criterion sees it |
|---|---|---|
| 1 | every control disabled; the game unplayable | thirteen criteria read the engine, four read the screen, none compares them |
| 2 | server rooms in a roster of operatives | A17 requires all nineteen art names be reached and the bar has no notion of what an image depicts |
| 3 | no contact states its damage, so play is guesswork | `resources.roster` is a list of bare id strings; the contract carries no power at all |
| 4 | the same construct offered twice at one choice point | A2 keys distinctness on offer *id*, which was always distinct |

Only the second required a balance change: removing five names from the contact pool cut total
contact power from 105 to 74 against eight layers, every run lost, and the score fell to 13/17
until the catalogue was retuned. The other three moved no criterion at all.

Defect 3 is a gap in the contract, not in what the loop built. Every other actionable thing in the
`View` declares its value — an `Offer` carries `cost`, `reach` and `achievable`, `threat` carries
`integrity` and `armour`, `incoming` and `free` each carry a `value` — and the roster, the player's
central decision every turn, carries none. `ephemeral` held this as NFR-3, *"intents state their
value in text."* Only the seventeen criteria crossed into this arm, and none of them is NFR-3.

### What the bar did force

Worth recording against the rest. Getting A14 to genuinely bind, rather than merely land the win
rate in range, required discovering that a run only ever loses at the "nothing achievable" gate and
never mid-encounter — so disabling the pressure mechanic can only rescue a loss when the roster is
down to one or two contacts, never exactly zero. The tuning target is *"the pool runs dry with a
sliver left"*, not *"the pool runs dry"*, and that band is a few integer units wide. That is a
criterion forcing a real design property rather than a number, and it is the strongest evidence
here in the method's favour.

The final build wins 40% of 200 seeds, 40% with the pressure mechanic against 65% without, 50 of
200 outcomes flipping when it is removed.

### The bar certifies two different programs

All five contract functions are defined twice — once in `oracle.mjs`, again inside `nullrun.html`,
which says so in a comment. Thirteen criteria read the first copy; four read the screen the second
draws; nothing reads both, and the artifact does not expose its copy, so they cannot be compared
from outside even in principle.

This is not carelessness. The contract demands a headless oracle *and* a self-contained artifact
issuing no network request, and a module cannot be imported over `file://` — which `COST.md`
already records the previous arm discovering. The bar never said the two must agree and gave no way
to check. Demonstrated live: a rules change made in one copy dropped the suite to 13/17 while the
page in the browser was unaffected, still showing the old content.

### Against the other two arms

`ephemeral` and `traditional` both shipped games that could be played, and both found defects by
opening the app that their suites had missed — three of them, in `traditional`'s case, all
display-truth defects. This arm shipped a game that could not be played at all, with a green,
mutation-lethal suite while that was true, and then needed four human-initiated repairs to become
playable and legible. It reached its first green fastest and its first playable state slowest.

### The handover caveat

Stated more strongly than for `traditional`. This arm inherited A1–A17 **and their checks**, after
that arm had spent its whole life repairing them. It looks cheap partly for that reason. Against
it: those inherited checks contained a structurally dead clause the previous arm had already
documented as dead, plus roughly forty further defects — what was handed over was a starting
position, not a finished bar.

And the scaffolding was built by the *traditional* process: a design, a plan, task-by-task
execution with review. Only the single loop iteration is goal-driven. **The method under test ran
for one iteration and produced 1,110 lines; the apparatus built to judge it took ten tasks, 53
recorded decisions and 1,688 lines of checks.** Those two costs are not comparable and must not be
added together.

---

## Comparing fairly

For the comparison to mean anything, the approaches need the same target and the same
definition of done. Two things to settle before the second one starts:

1. **What counts as finished.** `ephemeral` uses §K, nineteen checks including viability. If
   the other approaches use a weaker bar, they will look cheaper for the wrong reason.
2. **What is shared.** The art in `ephemeral/art/src/` is method-neutral and reusable;
   regenerating it would cost effort that has nothing to do with the approach being tested.
