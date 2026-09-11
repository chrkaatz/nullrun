# NULLRUN — goal-driven arm, design

**Date:** 2026-09-11
**Status:** approved. This document defines the *method* for the third arm. It is not a product
spec, and the arm's premise is that no product spec exists.

---

## Why a third arm

Two arms have shipped the same game against the same bar, and they differ in where authority
lives. `ephemeral` puts it in a document: the spec is law, the code is a disposable render of it.
`traditional` puts it in a plan plus a review process: the plan carried every line of engine code,
and a fresh reviewer gated each of ten tasks.

That leaves one obvious third point. **Put authority in the checks themselves.** No spec, no plan,
no reviewer — write the bar as something executable, then loop until the code satisfies it.

The question the arm answers is therefore narrow and worth asking: *given a complete executable
bar and almost no prose, how much of what the other two arms wrote down was load-bearing?*
`traditional` needed 9,260 words of plan. `ephemeral` needed 2,988 words of spec. This arm starts
from 239 words of product definition and a check suite.

---

## Decisions taken

Five forks were settled before this document was written. They are recorded here because the
design is largely downstream of them, and because a later reader should be able to see which
constraints were chosen rather than derived.

| fork | chosen |
|---|---|
| where authority lives | the executable check suite |
| what is inherited | both the criteria **and** the checks |
| what the checks run against | a neutral oracle contract, not `traditional`'s engine API |
| how the loop runs | unattended to green, then one human playtest |
| the stack | the loop picks it |
| the loop driver | a fresh agent per iteration over a persistent state file |

---

## Part I — Method

### G1. The check is the authority

When the checks and the code disagree, the code is wrong. There is no specification and no
implementation plan. Nothing about the game lives in prose that is not either a criterion or a
check. A behaviour nobody checked is a behaviour nobody promised.

### G2. The loop closes itself

Build, run the checks, read the failures, fix, repeat — with no human inside the loop until it
reports done. This is the property under test. Any human judgement admitted mid-loop collapses the
distinction between this arm and `traditional`, whose defining feature is exactly that judgement,
applied per task.

### G3. Done is not green

Green is a claim the loop makes about its own work, and the arm does not accept it unmeasured.
See §K′ below. This clause exists because the single defect both other arms paid for twice is a
check that passes for every possible implementation:

- `ephemeral`'s `K16` passed for six versions by zeroing the state it was meant to measure.
- `traditional`'s `A13` reduced algebraically to `pressDamage × turnsAllowed > 0` — true of every
  program that could ever be written — and stayed green through the entire life of the bug it
  existed to catch.

In both arms something outside the checks eventually looked: a spec reading, a reviewer, a
playtest. **In this arm nothing does.** A loop whose authority is its checks, left alone with a
hollow one, will converge on the hollowness and declare victory. G3 is the only thing standing
between this arm and that outcome.

### G4. A stall is a result

The loop stops on green, on an iteration budget, or on a stall — the same criterion failing five
consecutive iterations with no new hypothesis. A stall is recorded as a finding, not retried into
the ground. An autonomous loop that cannot reach viability is a publishable answer to the question
the arm asks.

### G5. Nothing is patched before it is recorded

Findings from the post-green playtest are written down before any of them is fixed. The gap
between a green suite and a playable game is this arm's headline measurement, and patching first
destroys it.

---

## Part II — The bar

### §K′ Done means green **and** lethal

Alongside the 17 inherited checks the arm ships a **mutant set**: small deliberate breakages,
expressed as a proxy wrapping the oracle adapter and never touching the build's internals. Each
mutant is a plausible wrong game —

- damage clamped so it can never reach zero
- a declared cap silently exceeded
- the free action scaled with the layer
- determinism broken by one displaced draw
- a pressure mechanic neutralised

When the loop reports 17/17, the driver runs every mutant and builds a kill matrix.

> **Green** = all 17 checks pass · **every mutant is killed by at least one check** · **every
> criterion kills at least one mutant.**

A criterion that kills nothing is **hollow**, and a run carrying one is not green.

This is a strictly higher bar than either prior arm applied. The fairness rule in the repository's
`CLAUDE.md` forbids a *weaker* bar, not a stronger one, so the comparison stays honest — and the
stronger bar is the cheapest available retrofit of the one lesson both other arms learned the
expensive way. `A13` dies immediately against it: a check that reduces to a tautology kills no
mutant, and the gate says so before a human ever reads it.

### What crosses the arm boundary

| handed over | derived by the loop |
|---|---|
| `ephemeral` spec Part II — identity, primary job, the three pillars (239 words) | every system, invariant, tunable and content table |
| A1–A17 as prose | — |
| the check suite and the mutant set, re-expressed against the oracle contract | the entire implementation, and the stack it is written in |
| the 19 shared art tiles, read from `../ephemeral/art/src/` at build time | — |

The 17 criteria describe no particular game — they would accept any competent one — so a product
definition has to cross the boundary or the loop will build something that is not NULLRUN. The
line is drawn at Part II of the existing spec: identity, primary job, pillars. Everything in
Part III is the loop's to derive.

**The art fixes part of the content roster by name.** Nineteen tiles exist — `archon`, `cold`,
`hunter`, `wren` and the rest — and reusing them, as the repository requires for method-neutral
work, hands the loop a cast. Stated rather than pretended away.

---

## Part III — Mechanism

### The oracle contract

One document written before the loop starts, `docs/ORACLE.md`. It names the operations every check
speaks to — `newRun(seed)`, `legalActions(state)`, `apply(state, action)`, and the readable fields
each criterion needs — and mandates an adapter the build exposes so the runner can reach it.

The runner's own language is fixed with the contract, before the loop starts, and the adapter is
the seam: the loop may pick any stack provided it makes the named operations reachable from the
runner — as a native module, or as a subprocess speaking JSON, or by any other means it likes.
"Loop picks the stack" is a constraint on the build, never on the bar.

The contract exists because two of the decisions above collide at the bootstrap: the checks must
exist before any code, but they cannot bind to a stack nobody has chosen yet. The contract is the
seam. The stack stays free behind it; the bar stays fixed in front of it. The loop's first
iteration is always *satisfy the adapter*.

Re-anchoring the checks here rather than on `traditional`'s eight-module engine API is what keeps
the arm from being transcription. Porting those 93 tests verbatim would port the architecture with
them, and the arm would be measuring whether an agent can reimplement to a known interface.

### The loop

A thin driver. Each iteration is a fresh context handed exactly two things: the current check
output, and `STATE.md`.

`STATE.md` is overwritten each iteration and holds the status of all 17 criteria, what the last
iteration changed and why, and a **failed-hypotheses list**. That last field is the one that earns
its place — it is what stops iteration 19 rediscovering the dead end iteration 6 already walked
into.

`ITERATIONS.md` is append-only, one block per iteration, and is what `COST.md` counts: iterations
to green, which criterion consumed the most, and what the loop thrashed on.

A fresh context per iteration keeps late iterations as sharp as early ones, which matters most
precisely when the remaining bugs are the subtle ones. It also makes the iteration count *recorded*
rather than self-reported, and a single session's testimony about its own iteration count is not
evidence.

### Stop conditions

| condition | meaning |
|---|---|
| green and lethal | done, per §K′ |
| 40 iterations | total across the run, not per criterion; budget exhausted, record where it stood |
| stall | same criterion, five consecutive iterations, no new hypothesis (G4) |

*No new hypothesis* is read off `STATE.md`, not judged: an iteration that appends nothing to the
failed-hypotheses list has produced none. Five such in a row on one criterion is a stall.

### Layout

```
goal-driven/
  CLAUDE.md            the method, Part I above
  docs/superpowers/    this design, and the implementation plan
  docs/ORACLE.md       the contract, and the 17 criteria bound to it
  docs/ITERATIONS.md   append-only log, one block per iteration
  docs/STATE.md        overwritten each iteration
  checks/              suite, mutants, runner, kill matrix
  tools/speclint.py    the hollow-check gate
  <whatever the loop picks>/
  nullrun.html         the artifact
```

`tools/speclint.py` is how this arm joins the shared `.githooks/pre-commit`, which runs every
`*/tools/speclint.py` against staged content. This arm has no spec to lint, so its linter is the
hollow-check gate: a commit cannot land a criterion that kills no mutant.

### After green: the playtest

The human opens the app once. Whatever is wrong on screen, with a lethal-green suite behind it, is
the arm's headline finding — the counterpart of `traditional`'s "Turns left 7" against a
`turnsAllowed` of 6, and its operative text running together, except that here the gap is measured
instead of quietly closed. Recorded before anything is patched, per G5.

---

## Risks

- **The mutant set has the same disease as the check suite.** The mutants are the ones somebody
  thought of. §K′ narrows the hole; it does not close it, and no gate written by the same hand that
  wrote the checks can.
- **The inherited checks are post-repair.** `A13`, `A15`, `A3`, `A10` and `A16` were tautologies or
  wrong arithmetic for most of `traditional`'s life, and repairing them is where that arm's effort
  actually went. This arm is handed them finished. It will look cheap for a reason that is not
  method, and `COST.md` must say so rather than let the number speak alone.
- **`A17` viability is the likely stall.** `ephemeral` needed seven versions to reach it;
  `traditional` had to retune the whole game around a corrected turn count. An unattended loop
  hitting the budget on viability is a plausible outcome, and under G4 a reportable one.
- **"The loop picks the stack" may re-measure tooling.** If it lands on a framework, the artifact
  column reprices React's runtime, which the ledger has already settled at 6.4×. Allowed, and to be
  noted in the ledger if it happens.

---

## What `COST.md` records

The same shape as the other two sections — artifact sizes, where the effort actually went, and what
the method failed to catch — plus three figures unique to this arm:

1. **iterations to green**, and which criterion consumed the most of them
2. **the kill matrix** — mutants killed, and any criterion found hollow
3. **the playtest delta** — what was wrong on screen with everything green

And the caveat above, stated plainly: this arm inherited a repaired bar.
