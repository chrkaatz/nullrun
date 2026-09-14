# What the scaffolding cost, and what building it found

The record of this arm's first phase: building the bar, before a line of the game exists. `COST.md`
draws on this once the loop has run. Written at `0/17`, with nothing implemented.

## Measured

| | |
|---|---|
| commits | 47 |
| check suite | 1,688 lines — 17 criteria, runner, helpers, 17 mutants, kill matrix |
| fixtures | 237 lines — one hollow, one abstract positive control |
| commit linter | 229 lines |
| **the loop's entire input** | **2,341 words** — 307 product, 1,562 contract, 472 method |
| design | 1,988 words |
| plan | 19,478 words |
| decisions recorded | 53 |
| **game written** | **0 lines** |

Against `ephemeral`'s 2,988-word spec and `traditional`'s 9,260-word plan carrying every line of
engine code, this arm hands its loop 2,341 words. The contract is the bulk of it, and most of that
was added during execution rather than designed up front — each clause added because a criterion
needed something the build would otherwise have been free to lie about.

## Where the effort went

Not into writing checks. Sixteen of seventeen criteria were transcribed correctly on the first
attempt in every task. Of 53 recorded decisions, roughly forty are defects in the checks
themselves.

| round | what the fix was |
|---|---|
| Task 3 | `deepEqual(NaN, null)` returned true — in the helper A1 compares a run against its replay with |
| Task 4 | the policy never ended a turn; 960 free actions, zero ends, pressure permanently 0 |
| Task 4 | a margin measured against the formula that produced it: reported +2, actual −2 |
| Task 5 | five rounds, ten findings, none for transcription |
| Task 7 | the artifact chose its own exhibit; A7 inspected 14 of 40 controls |
| Task 8 | a mutant that silenced the criteria written to catch it |
| Task 9 | deleting all seventeen criteria passed the linter clean |

## The findings

**A criterion that only inspects the actions a policy chose is blind to any defect that changes
what the policy chooses.** Three instances. In two, the mutant under test *caused* the blindness:
making calls useless made a greedy policy stop calling, so the criterion asserting calls deal
damage never saw one. The fix each time was to probe every action that is *legal* at a step rather
than the one that was taken.

**A fix that survives the attack which motivated it is not a fixed criterion.** Four chains where a
ruling fixed a defect and a later ruling had to fix the fix. Twice the second ruling corrected the
first author's confident work: a mutant built on the theory that CSS `saturate()` preserves
luminance, which it does only while every channel stays in gamut; and a correct fix attached to a
wrong diagnosis of which clipping shape defeats a scroll check.

**Reading a kill matrix beats reporting one.** Of thirteen mutants, only five died to exactly the
criteria the plan predicted. Two died to none of them. "13 of 13 killed" is a true headline that
conceals every one of those.

**The limit of the gate, and the sharpest result here.** §K′ discriminates lethal from hollow at
the granularity of a whole criterion. A17 carries four assertions, one of them structurally dead,
and the gate reports it lethal because the other three kill on win rate. A mutant set tests whether
the assertions you wrote can fail; it cannot test for the assertion you did not write. Almost every
finding in the final review was a gap between what a criterion *says* and what it *reads* —
invisible to mutation by construction.

**The premise, honestly.** Attacking checks with deliberately wrong oracles found what reading them
did not, at a scale that makes `COST.md`'s existing lesson a replicated finding rather than one
session's anecdote. What it does not support is that checks replace a reviewer: every Critical in
the final review was found by a reviewer reading, not by the gate running. *The loop can be trusted
to the bar. The bar cannot be trusted to itself.*

**The one that should not have happened.** `COST.md` records A17's instant-encounter clause as the
previous arm's one unrepaired criterion — "no reachable failure mode, left nominal, 0 is the only
value it can see." It was inherited verbatim, re-implemented, and made structurally impossible
rather than merely unreachable. The ledger named it in writing and the arm reproduced it anyway.

## Left open deliberately

Not defects to fix later — measurements the experiment intends to take. Predictions are
pre-registered in `ITERATIONS.md`, written before iteration 1.

- **The artifact surface cannot verify rendered content.** Closing it means asserting "the number
  on screen equals `view.turnsAllowed`", which is not A7, A8, A9 or A10 — a new criterion wearing
  an old one's badge. The design commissions the post-green playtest as this arm's headline
  finding; closing this now would replace that measurement with an assumption.
- **The art is enforced as nineteen strings.** Requiring an image would extend the bar past A1–A17.
- **A12 is stronger than its title** and forbids support or utility contacts, because the `View`
  cannot distinguish an offensive action from a helpful one.
- **A control hidden in a plain element cannot be detected** from outside the page. The contract
  requires standard selectors; no check can enforce it.
- **A16 makes achievability a near-perfect predictor** of one scripted policy, which tends toward
  deciding the encounter at the offers screen.
- **Only screens the greedy policy reaches** are ever rendered for the artifact criteria.

## The handover caveat

This arm inherited A1–A17 **and their checks** from `traditional`, after that arm had spent its
whole life repairing them. It will look cheap partly for that reason. Against it: those inherited
checks turned out to contain a structurally dead clause the previous arm had already documented as
dead, and roughly forty further defects, so what was handed over was a starting position rather
than a finished bar.

Separately, the scaffolding above was built by the *traditional* process — a design, a plan,
task-by-task execution with review. Only what happens after this is goal-driven. The arm measures
the loop, not its runway, and `COST.md` must report the two costs separately.
