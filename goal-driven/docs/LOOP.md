# The loop

## What the driver does

Exactly five things, in order, and nothing else:

1. Run `node checks/run.mjs`. If it is green, run `node checks/matrix.mjs`.
2. Rewrite `docs/STATE.md` from `checks/report.json` and `checks/matrix.json` — mechanically, by
   transcription. No summarising, no diagnosis, no opinion about why something failed.
3. Evaluate the stop conditions.
4. If none fired, dispatch one fresh agent with the prompt below and nothing else.
5. Append that iteration's block to `docs/ITERATIONS.md`.

## What the driver must not do

- Read the code. Ever. The driver's whole input is two JSON files.
- Diagnose a failure, suggest a fix, or hint at one in `STATE.md`.
- Reject an iteration's work, revert it, or ask for a change.
- Edit `checks/`, `docs/ORACLE.md` or `docs/PRODUCT.md` on the iteration's behalf.
- Carry anything between iterations except `STATE.md` and `checks/report.json`.

A driver that reviews is a reviewer, and a reviewer is `traditional`. The arm stops measuring
anything the moment the driver has an opinion.

## The iteration prompt

Dispatched verbatim, with `{{...}}` substituted:

> You are iteration {{N}} of an unattended loop building NULLRUN in
> `/Users/ckaatz/development/experiments/nullrun/goal-driven`.
>
> Read, in this order: `CLAUDE.md`, `docs/PRODUCT.md`, `docs/ORACLE.md`, `docs/STATE.md`.
>
> Your input is those four files and `checks/report.json`. **Do not read `checks/fixtures/`,
> `../ephemeral/` or `../traditional/`** — the first is a control for the bar, the other two are
> different arms of an experiment, and reading either invalidates this one. The art in
> `../ephemeral/art/src/` is the single exception and is read at build time only.
>
> Your job is to make more criteria pass than are passing now. You may create or change anything
> under `goal-driven/` **except** `checks/`, `docs/ORACLE.md`, `docs/PRODUCT.md` and
> `docs/LOOP.md`. The bar is not yours to move.
>
> If you believe a check is wrong rather than the code, do not edit it. Write the argument into
> `docs/STATE.md` under `## disputes` and work on something else. A dispute is a finding and will
> be read after the loop ends.
>
> Before you finish:
> 1. Run `node checks/run.mjs` and confirm the count did not go down.
> 2. Append every approach that did not work to the `## failed hypotheses` section of
>    `docs/STATE.md`, one line each, with the criterion id and the iteration number. This is the
>    only memory the next iteration has.
> 3. Write one paragraph under `## last change` saying what you changed and why.
> 4. Commit with `git commit -m "goal-driven iteration {{N}}: <what changed>"`.
>
> Do not commit with `--no-verify`.

## Stop conditions

| condition | test | what it means |
|---|---|---|
| green | `report.json.green` and `matrix.json.lethal` | done, per §K′ |
| budget | iteration 40 completes | record the standing state; the arm reports where it got to |
| stall | one criterion has `consecutive` ≥ 5 and `## failed hypotheses` gained no line for it in those five | the loop has stopped learning |

A stall is a result (G4). Record it and stop; do not raise the budget.

## After the loop

Per G5, nothing is patched before it is recorded.

1. Open `nullrun.html` and play it.
2. Write everything wrong on screen into `docs/ITERATIONS.md` under `## playtest`, before fixing
   any of it.
3. Only then decide what to do about it.

That list is the arm's headline finding: what a fully green, mutation-lethal suite still let
through.
