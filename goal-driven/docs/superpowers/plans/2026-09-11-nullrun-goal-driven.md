# NULLRUN goal-driven arm — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the scaffolding that lets an unattended loop produce NULLRUN — a language-neutral oracle contract, an executable suite carrying all seventeen inherited criteria, a mutant set that proves those criteria are lethal, and the loop protocol itself.

**Architecture:** Two surfaces. A headless **oracle surface** (`goal-driven/oracle.mjs`, pure, JSON-serializable) carries the thirteen behavioural and statistical criteria. An **artifact surface** (`goal-driven/nullrun.html`, loaded in Chromium at 360×780) carries the four presentation criteria, which cannot bind to a headless API. Neither surface exists yet — the loop creates them. Everything in this plan is written against the contract, and is verified against two fixtures instead: a `hollow` oracle every check must fail, and an abstract `faithful` toy the structural checks must pass.

**Tech Stack:** Node 20+ with the built-in `node:test` and `node:assert` (no test framework dependency). Playwright for the artifact surface only. Python 3 for `tools/speclint.py`, matching the other arms. The **build** the loop produces has no mandated stack and no mandated dependencies.

**Spec:** `goal-driven/docs/superpowers/specs/2026-09-11-nullrun-goal-driven-design.md`

## Scope, and an honesty note

This plan is **not** the game. It builds the bar and the loop; the loop builds the game, unattended, per G2. That split has to survive into the ledger: `COST.md` must report **scaffolding cost** and **loop cost** separately, or the arm's headline figure silently includes work the method was supposed to avoid.

There is a second thing to state rather than hide. This scaffolding is being built by the *traditional* process — a design doc, this plan, task-by-task execution. Only what happens after Task 9 is goal-driven. The arm measures the loop, not its runway.

## Global Constraints

Copied from the spec and from the repository's `CLAUDE.md`. Every task's requirements implicitly include this section.

- **The check is the authority (G1).** No specification, no implementation plan for the game, no prose about the game that is not a criterion or a check.
- **No human inside the loop until it reports done (G2).** The driver performs no review and exercises no judgement; see `docs/LOOP.md`, Task 9.
- **Green is not done (G3/§K′).** Green = all 17 checks pass · every mutant killed by at least one check · every criterion kills at least one mutant.
- **A stall is a result (G4).** Stop conditions: green-and-lethal; 40 iterations total across the run, not per criterion; or the same criterion failing five consecutive iterations with no new hypothesis, read mechanically off `STATE.md`.
- **Nothing is patched before it is recorded (G5).**
- **The bar is exactly A1–A17.** Text is inherited verbatim from `traditional/docs/superpowers/specs/2026-09-10-nullrun-traditional-design.md`. Criteria are never weakened; §K′ is the only permitted strengthening.
- **The build has zero runtime dependencies and issues no network request** (A8). Dependencies are permitted in `checks/` only.
- **Art is shared, not regenerated.** The nineteen tiles in `ephemeral/art/src/` are read at build time. Copying them into `goal-driven/` is forbidden.
- **Portrait first.** The artifact surface is measured at 360×780.
- **Node 20+.** `node --version` must report v20 or higher.

---

## File structure

| path | responsibility |
|---|---|
| `goal-driven/CLAUDE.md` | the method — Part I of the spec, restated as working guidance |
| `goal-driven/package.json` | check-suite dependencies and scripts; **not** the build's |
| `goal-driven/docs/PRODUCT.md` | the 234 inherited words of product definition, verbatim |
| `goal-driven/docs/ORACLE.md` | the contract: two surfaces, exact signatures, the `View` shape, all 17 criteria bound to the fields they read |
| `goal-driven/docs/LOOP.md` | the driver protocol, the iteration prompt, stop conditions |
| `goal-driven/docs/STATE.md` | overwritten each iteration |
| `goal-driven/docs/ITERATIONS.md` | append-only, one block per iteration |
| `goal-driven/checks/run.mjs` | runner: discovers criteria, runs them against a surface, emits `report.json` |
| `goal-driven/checks/lib/deep.mjs` | `deepEqual`, `clone`, `stableStringify` |
| `goal-driven/checks/lib/harness.mjs` | play a full run under a policy; collect a trace |
| `goal-driven/checks/policy.mjs` | the generic competent policy used by statistical criteria |
| `goal-driven/checks/criteria/a01.mjs` … `a17.mjs` | one file per criterion |
| `goal-driven/checks/fixtures/hollow.mjs` | negative control: contract-shaped, plays nothing |
| `goal-driven/checks/fixtures/faithful.mjs` | positive control: abstract, structurally honest, not NULLRUN |
| `goal-driven/checks/mutants/oracle.mjs` | oracle mutants as proxies over an adapter |
| `goal-driven/checks/mutants/artifact.mjs` | artifact mutants as page injections |
| `goal-driven/checks/matrix.mjs` | builds the kill matrix; the §K′ gate |
| `goal-driven/tools/speclint.py` | hollow-check gate, wired to the shared pre-commit hook |
| `goal-driven/oracle.mjs` | **created by the loop** — the adapter |
| `goal-driven/nullrun.html` | **created by the loop** — the artifact |

---

## Task 1: Arm scaffolding and method

**Files:**
- Create: `goal-driven/CLAUDE.md`
- Create: `goal-driven/docs/PRODUCT.md`
- Create: `goal-driven/package.json`
- Create: `goal-driven/.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: `goal-driven/docs/PRODUCT.md` as the only prose about the game the loop may read. `package.json` scripts `check`, `selftest`, `matrix`.

- [ ] **Step 1: Extract the inherited product definition**

Run, and read the output — it is 234 words and it is the entire product handover:

```bash
cd /Users/ckaatz/development/experiments/nullrun
awk '/^## Part II — Product/,/^## Part III/' ephemeral/docs/NULLRUN-SPEC.md | sed '$d'
```

- [ ] **Step 2: Write `goal-driven/docs/PRODUCT.md`**

Write the header below, then paste the awk output verbatim beneath it. Do not edit, summarise, or extend the inherited text — its exact size is a measurement.

```markdown
# NULLRUN — product definition

Inherited verbatim from `ephemeral/docs/NULLRUN-SPEC.md`, Part II, at spec 0.9.6. **234 words.**

This is the only prose about the game that crosses into this arm. There is no specification and
no plan. Everything not written here — systems, invariants, tunables, content — is derived by the
loop, and the only thing that judges it is `checks/`.

Do not edit this file. Its size is part of the measurement.

---

<!-- awk output goes here, verbatim -->
```

- [ ] **Step 3: Verify the extract is exactly the inherited text**

```bash
cd /Users/ckaatz/development/experiments/nullrun
diff <(awk '/^## Part II — Product/,/^## Part III/' ephemeral/docs/NULLRUN-SPEC.md | sed '$d') \
     <(sed -n '/^---$/,$p' goal-driven/docs/PRODUCT.md | tail -n +2)
```

Expected: no output. If there is output, the paste was altered — fix it.

- [ ] **Step 4: Write `goal-driven/CLAUDE.md`**

```markdown
# CLAUDE.md

Guidance for the **goal-driven** arm. Do not import habits from `ephemeral/` or `traditional/` —
the differences between the arms are the experiment.

## What this arm is

Authority lives in the checks. There is no specification and no implementation plan. `checks/`
is the bar; `docs/ORACLE.md` is the contract the bar speaks to; everything else about the game
is derived by an unattended loop.

## The method

- **G1. The check is the authority.** When the checks and the code disagree, the code is wrong.
  A behaviour nobody checked is a behaviour nobody promised. Do not add a rule because it seems
  right; if it matters, it is a criterion, and criteria are fixed at A1–A17.
- **G2. The loop closes itself.** No human judgement inside the loop. The driver runs checks,
  writes `docs/STATE.md` mechanically, and dispatches the next iteration. It does not review.
- **G3. Done is not green.** Green is a claim the loop makes about its own work. The arm accepts
  it only after the mutant set runs — see §K′ in the design, and `checks/matrix.mjs`.
- **G4. A stall is a result.** Record it; do not retry it into the ground.
- **G5. Nothing is patched before it is recorded.**

## What you may read

`docs/PRODUCT.md` (234 words), `docs/ORACLE.md`, `checks/`, and the failure output in
`checks/report.json`. That is the whole input.

**`checks/fixtures/faithful.mjs` is forbidden input to the loop.** It is a positive control for
the suite, deliberately abstract and deliberately not NULLRUN. Reading it to learn how to shape
an implementation would smuggle a reference implementation into an arm that is supposed to have
none.

Reading `ephemeral/` or `traditional/` source is likewise forbidden. The art in
`ephemeral/art/src/` is the single exception, and it is read at build time, never copied.

## The two surfaces

- **Oracle** — `oracle.mjs`, headless, pure, JSON-serializable. Carries A1–A6, A11–A17.
- **Artifact** — `nullrun.html`, loaded in Chromium at 360×780. Carries A7–A10.

The stack behind the adapter is free. Any language is permitted provided the named operations are
reachable from the Node runner — as a module, or a subprocess speaking JSON, or anything else.

## Running the bar

    cd goal-driven
    node checks/run.mjs                # the real surfaces
    node checks/run.mjs --selftest     # the suite's own test: fixtures only
    node checks/matrix.mjs             # the §K′ kill matrix

`node checks/run.mjs` writes `checks/report.json`. That file, plus `docs/STATE.md`, is the entire
input to the next iteration.

## Constraints that are easy to violate accidentally

- The **build** takes no dependencies and issues no network request, including web fonts (A8).
- Dependencies are permitted in `checks/` only.
- Art is read from `../ephemeral/art/src/`, never copied into this arm.
- Criteria are never weakened to make a check pass. A check that is wrong is repaired against
  `docs/ORACLE.md`; a criterion that is wrong is a finding, and it is recorded, not edited.
```

- [ ] **Step 5: Write `goal-driven/package.json`**

```json
{
  "name": "nullrun-goal-driven",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "check": "node checks/run.mjs",
    "selftest": "node checks/run.mjs --selftest",
    "matrix": "node checks/matrix.mjs"
  },
  "devDependencies": {
    "playwright": "^1.47.0"
  }
}
```

- [ ] **Step 6: Write `goal-driven/.gitignore`**

```
node_modules/
checks/report.json
checks/matrix.json
```

- [ ] **Step 7: Verify Node and install**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node --version
npm install
npx playwright install chromium
```

Expected: `node --version` reports v20 or higher; install completes.

- [ ] **Step 8: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/CLAUDE.md goal-driven/docs/PRODUCT.md goal-driven/package.json goal-driven/.gitignore goal-driven/package-lock.json
git commit -m "goal-driven: arm scaffolding and method"
```

---

## Task 2: The oracle contract

**Files:**
- Create: `goal-driven/docs/ORACLE.md`

**Interfaces:**
- Consumes: `docs/PRODUCT.md` for vocabulary only.
- Produces: the exact signatures every later task codes against — `newRun`, `legalActions`, `allOffers`, `apply`, `view`, and the `View` and `Offer` shapes. Task 3 onward depend on these names being stable.

- [ ] **Step 1: Write `goal-driven/docs/ORACLE.md`**

````markdown
# The oracle contract

The checks speak to two surfaces. Neither is written by hand — the loop produces both. This
document is the seam: the bar is fixed in front of it, the stack is free behind it.

## Surface 1 — the oracle

`goal-driven/oracle.mjs`, an ES module exporting five functions. Everything it accepts and
returns is JSON-serializable: no class instances, no `Map`, no `Set`, no functions, no `undefined`
as a value. A state must survive `JSON.parse(JSON.stringify(state))` unchanged.

```js
export function newRun(seed)                  // number -> State
export function legalActions(state)           // State -> Action[]
export function allOffers(state)              // State -> Offer[]
export function apply(state, action)          // (State, Action) -> State
export function view(state)                   // State -> View
```

**`apply` is pure.** It returns a new state and never mutates its argument. Applying an action
not present in `legalActions(state)` returns a state deep-equal to the input (A5).

**`State` is opaque.** No check reads inside it. Checks read `view(state)`, compare whole states
for equality, and nothing else. This is what keeps the implementation free.

### `Action`

```js
{ type: string, id?: string }
```

`type` is one of `call` (spend a resource to act), `free` (the renewable action), `end` (end the
turn), `take` (accept an offer), `release` (give up a roster slot), `onward` (advance from a
non-encounter screen), `bail` (abandon the run).

### `Offer`

Every option presented at a choice point, affordable or not.

```js
{
  id: string,          // stable within a run
  label: string,       // what the player reads
  cost: number,        // what taking it costs
  reach: number,       // the difficulty it advertises; 0 where meaningless
  achievable: boolean  // whether it can be cleared with what the player has now (A16)
}
```

### `View`

The readable projection. Every field a criterion needs is here; nothing else needs to be.

```js
{
  screen: 'loadout' | 'offers' | 'encounter' | 'payout' | 'end',
  terminal: boolean,                 // no action can follow
  outcome: 'win' | 'loss' | null,    // non-null only when terminal
  layer: number,                     // 0-based depth reached
  layerCount: number,                // total layers in a run
  turn: number,                      // 0-based turn index within the current encounter
  turnsAllowed: number,              // turns the pressure mechanic permits from here
  resources: {
    ram: number, ramMax: number,
    roster: string[],                // ids callable right now
    rosterCap: number,
    burned: string[],                // ids consumed this run
    credits: number
  },
  pressure: { id: string, value: number, max: number },
  threat: { id: string, integrity: number, armour: number } | null,
  incoming: { value: number, label: string } | null,  // declared before it lands (A4)
  free: { id: string, value: number } | null          // the renewable action (A15)
}
```

`turnsAllowed` is the number of turns the player may still act in, **counting the turn on which
the pressure mechanic fills.** That turn is still a turn you act in, and a clear on it clears the
node. Undercounting it by one is the precise defect that kept `traditional`'s A15 green while it
was false; the contract states it so no implementation has to rediscover it.

`free` is the renewable action, and it is available **once per turn**. A15 measures its total
contribution as `free.value × turnsAllowed`, which is only that total if the action cannot be
repeated within a turn. An unlimited free action makes the pressure mechanic decorative — a
rational player never ends a turn, so nothing ever accrues — and it would satisfy A15's arithmetic
while breaking the thing A15 exists to protect.

## Surface 2 — the artifact

`goal-driven/nullrun.html`, a file opened directly. It is loaded in Chromium at **360×780** with
no network access permitted. It carries A7, A8, A9 and A10, which are properties of what is on
screen and cannot bind to a headless API.

`traditional` checked these at the stylesheet, under jsdom, which lays nothing out — and recorded
that its assertions were a regression guard rather than a proof. This arm has no reviewer to make
up the difference, so they are measured in a real browser: A8 by intercepting every request, A9
and A10 by reading laid-out boxes, A7 by desaturating a screenshot and comparing.

## The criteria, bound

Text inherited verbatim from the traditional arm. The binding column is what a check may read.

| id | criterion | surface | reads |
|---|---|---|---|
| A1 | Same seed and same input sequence reproduce a run exactly, including its final score. | oracle | `newRun`, `apply`, whole-state equality |
| A2 | Every choice point offers distinct options, priced differently, at least one of which is achievable with what the player currently has. | oracle | `allOffers` |
| A3 | Resource accounting is conserved: nothing is silently created, duplicated or destroyed, over at least 500 turns of play. | oracle | `view().resources` |
| A4 | No harm reaches the player that was not shown, at its exact value, before it landed. | oracle | `view().incoming`, `view().pressure`, `view().resources` |
| A5 | An action the player cannot afford changes no state at all. | oracle | `legalActions`, `apply`, whole-state equality |
| A6 | The player always has a legal action, and every screen offers a way onward. | oracle | `legalActions`, `view().terminal`, `view().screen` |
| A7 | Every entity, value and state is readable in greyscale. State is never carried by colour alone. | artifact | desaturated screenshot |
| A8 | No network request is issued at runtime. | artifact | request interception |
| A9 | No horizontal scroll at 360px wide. | artifact | `scrollWidth` vs `clientWidth` |
| A10 | Every interactive target is at least 44px on its short edge. | artifact | bounding boxes |
| A11 | Any declared cap is enforced and never exceeded. | oracle | `view().resources` |
| A12 | Damage mitigation never reduces an attack to nothing unless the rules say so explicitly. | oracle | `view().threat`, `view().incoming` |
| A13 | No resource may be bounded such that the outcome is decided before play begins. | oracle | 200 seeds, `allOffers`, outcomes |
| A14 | Every pressure mechanic must bind: removing it changes outcomes materially. | oracle | 200 seeds under a pressure-disabling mutant |
| A15 | No free or renewable action may trivialise the primary resource. | oracle | `view().free`, `turnsAllowed`, `allOffers().reach` |
| A16 | The player can see whether a choice is achievable before committing to it. | oracle | `allOffers().achievable` against played outcomes |
| A17 | Viability. A competent scripted policy wins 15–65% of 200 seeds, encounters average at least 2.5 decisions, under a tenth end before a decision is taken, and every piece of content is reached across the sample. | oracle | 200 seeds under `checks/policy.mjs` |

## Non-JS stacks

The runner is Node. A build in another language satisfies the contract by shipping an
`oracle.mjs` that shells out to a subprocess speaking one JSON object per line. The contract is
the five functions; how they are reached is not the bar's business.
````

- [ ] **Step 2: Verify the criteria text is inherited verbatim**

```bash
cd /Users/ckaatz/development/experiments/nullrun
for n in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17; do
  grep -o "^| A$n | [^|]*" traditional/docs/superpowers/specs/2026-09-10-nullrun-traditional-design.md
done | sed 's/\*\*//g' > /tmp/inherited.txt
for n in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17; do
  grep -o "^| A$n | [^|]*" goal-driven/docs/ORACLE.md
done > /tmp/ours.txt
diff /tmp/inherited.txt /tmp/ours.txt
```

Expected: no output. Any difference is a weakened or drifted criterion — fix `ORACLE.md`, never the inherited file.

- [ ] **Step 3: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/docs/ORACLE.md
git commit -m "goal-driven: the oracle contract"
```

---

## Task 3: Runner, helpers, and the negative control

**Files:**
- Create: `goal-driven/checks/lib/deep.mjs`
- Create: `goal-driven/checks/lib/harness.mjs`
- Create: `goal-driven/checks/fixtures/hollow.mjs`
- Create: `goal-driven/checks/run.mjs`
- Create: `goal-driven/checks/criteria/a05.mjs`

**Interfaces:**
- Consumes: the five contract functions from Task 2.
- Produces:
  - `deepEqual(a, b) -> boolean`, `clone(x) -> x`, `stableStringify(x) -> string`
  - `playRun(oracle, seed, choose, opts) -> { steps, views, final, finalView, ended }` where `choose(oracle, state) -> Action|null` and `opts = { maxSteps = 2000, collect = true }`
  - a criterion module shape: `export default { id, title, surface, selftest, run }` with `run(ctx)` async, throwing `Error` on failure
  - `ctx = { oracle, seeds, assert, note, playRun, deepEqual, clone }` for oracle criteria
  - `ctx = { page, artifactPath, assert, note }` for artifact criteria
  - `node checks/run.mjs` writing `checks/report.json`

### A note on what a negative control can prove

`hollow.mjs` is contract-shaped and plays nothing. It is the control for criteria that assert the
game **does** something. It is *not* a control for criteria that assert an absence — a game that
does nothing is perfectly deterministic (A1), never lets an unaffordable action change state (A5),
and never exceeds a cap (A11). Those three are proven non-tautological by the mutant set in Task 8
and by nothing else.

So each criterion **declares** its expected fixture verdicts, and `--selftest` asserts the
declaration. A criterion that expects to pass everything is legal here and caught in Task 9.

- [ ] **Step 1: Write `goal-driven/checks/lib/deep.mjs`**

```js
// Structural helpers. Contract states are JSON-serializable, so JSON is the whole story.

export function stableStringify(x) {
  // JSON.stringify collapses every non-finite number to "null", which would make NaN and null
  // compare equal — and deepEqual is what A1 compares a run against its replay with. '#' cannot
  // begin any JSON fragment the rest of this function emits, so these tokens cannot collide.
  if (typeof x === 'number' && !Number.isFinite(x)) return '#' + String(x);
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
  const keys = Object.keys(x).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
}

export function deepEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

// Throws if a value cannot survive a JSON round trip unchanged. The contract requires it, and a
// violation here is the cheapest possible explanation for a mysterious determinism failure.
// Names the path to the offending value: an unattended loop's only input is this message.
export function assertSerializable(x, label) {
  const bad = [];
  (function walk(v, path) {
    if (typeof v === 'number' && !Number.isFinite(v)) { bad.push(path || '(root)'); return; }
    if (v === null || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach((e, i) => walk(e, `${path}[${i}]`)); return; }
    for (const k of Object.keys(v)) walk(v[k], path ? `${path}.${k}` : k);
  })(x, '');
  if (bad.length) {
    throw new Error(`${label} holds non-finite numbers at: ${bad.slice(0, 5).join(', ')}`);
  }
  const round = JSON.parse(JSON.stringify(x));
  if (!deepEqual(x, round)) {
    throw new Error(`${label} is not JSON-serializable without loss`);
  }
  return round;
}
```

- [ ] **Step 2: Write `goal-driven/checks/lib/harness.mjs`**

```js
import { clone, deepEqual, assertSerializable } from './deep.mjs';

// Plays one run to termination under `choose`. Pure with respect to the oracle: every state it
// holds is a value the oracle returned.
//
//   choose(oracle, state) -> Action | null    // null ends the run early
//
// Returns { steps, views, final, finalView, ended }.
//   steps  : [{ before, action, after }]  (only when opts.collect)
//   views  : [View]                       (only when opts.collect)
//   ended  : 'terminal' | 'no-action' | 'declined' | 'maxSteps'
export function playRun(oracle, seed, choose, opts = {}) {
  const { maxSteps = 2000, collect = true } = opts;
  let state = oracle.newRun(seed);
  assertSerializable(state, `newRun(${seed})`);

  const steps = [];
  const views = [];
  let ended = 'maxSteps';
  let n = 0;

  while (n < maxSteps) {
    const v = oracle.view(state);
    if (collect) views.push(clone(v));
    if (v.terminal) { ended = 'terminal'; break; }

    const legal = oracle.legalActions(state);
    if (!legal || legal.length === 0) { ended = 'no-action'; break; }

    const action = choose(oracle, state);
    if (action === null || action === undefined) { ended = 'declined'; break; }

    const before = clone(state);
    const after = oracle.apply(state, action);
    if (collect) steps.push({ before, action: clone(action), after: clone(after) });

    // apply must not mutate its argument (contract, Surface 1).
    if (!deepEqual(before, state)) {
      throw new Error(`apply mutated its argument at step ${n} (seed ${seed})`);
    }
    state = after;
    n += 1;
  }

  return { steps, views, final: state, finalView: oracle.view(state), ended };
}

// Replays a recorded action sequence from a fresh newRun. Used by A1.
export function replay(oracle, seed, actions) {
  let state = oracle.newRun(seed);
  const trail = [clone(state)];
  for (const a of actions) {
    state = oracle.apply(state, a);
    trail.push(clone(state));
  }
  return trail;
}

// A deterministic seed list. Fixed so a failure is reproducible across iterations.
export function seeds(count, base = 1000) {
  return Array.from({ length: count }, (_, i) => base + i * 7919);
}
```

- [ ] **Step 3: Write `goal-driven/checks/fixtures/hollow.mjs`**

```js
// NEGATIVE CONTROL. Contract-shaped, plays nothing. Every criterion that asserts the game does
// something must fail against this. Criteria that assert an absence will pass, and that is
// expected — see their `selftest` declarations, and the mutant set for their real proof.

export function newRun(seed) { return { seed, done: false }; }

export function legalActions(state) {
  return state.done ? [] : [{ type: 'onward' }];
}

export function allOffers() { return []; }

export function apply(state, action) {
  if (!legalActions(state).some(a => a.type === action.type && a.id === action.id)) return state;
  return { ...state, done: true };
}

export function view(state) {
  return {
    screen: state.done ? 'end' : 'loadout',
    terminal: state.done,
    outcome: state.done ? 'loss' : null,
    layer: 0, layerCount: 0, turn: 0, turnsAllowed: 0,
    resources: { ram: 0, ramMax: 0, roster: [], rosterCap: 0, burned: [], credits: 0 },
    pressure: { id: 'none', value: 0, max: 0 },
    threat: null, incoming: null, free: null
  };
}
```

- [ ] **Step 4: Write the first criterion, `goal-driven/checks/criteria/a05.mjs`**

A5 is written first because it is the simplest complete example of the module shape, and because
its verdicts differ between the two fixtures in the instructive direction.

```js
import { deepEqual, clone } from '../lib/deep.mjs';
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A5',
  title: 'An action the player cannot afford changes no state at all.',
  surface: 'oracle',
  // hollow does nothing, so it never affords anything and trivially passes. Declared, not hidden.
  selftest: { hollow: 'pass', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let probed = 0;

    for (const seed of seeds(12)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 400 });
      for (const { before } of steps) {
        const legal = oracle.legalActions(before);
        const legalKeys = new Set(legal.map(a => a.type + '/' + (a.id ?? '')));

        // Every offer the player is shown but cannot take, plus every action type not offered.
        const illegal = [];
        for (const o of oracle.allOffers(before)) {
          const key = 'take/' + o.id;
          if (!legalKeys.has(key)) illegal.push({ type: 'take', id: o.id });
        }
        for (const t of ['call', 'free', 'end', 'take', 'release', 'onward', 'bail']) {
          if (!legalKeys.has(t + '/')) illegal.push({ type: t });
        }

        for (const action of illegal) {
          const guard = clone(before);
          const after = oracle.apply(before, action);
          assert.ok(deepEqual(after, before),
            `illegal action ${JSON.stringify(action)} changed state (seed ${seed})`);
          assert.ok(deepEqual(guard, before),
            `apply mutated its argument on an illegal action (seed ${seed})`);
          probed += 1;
        }
      }
    }

    note(`probed ${probed} illegal applications across 12 seeds`);
    assert.ok(probed > 0, 'no illegal action was ever reachable — the check proved nothing');
  }
};
```

- [ ] **Step 5: Write `goal-driven/checks/run.mjs`**

```js
import { readdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { seeds } from './lib/harness.mjs';
import { playRun } from './lib/harness.mjs';
import { deepEqual, clone } from './lib/deep.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}
const has = name => process.argv.includes(name);

export async function loadCriteria(only = null) {
  const dir = join(here, 'criteria');
  const files = (await readdir(dir)).filter(f => f.endsWith('.mjs')).sort();
  const mods = [];
  for (const f of files) {
    const mod = (await import(pathToFileURL(join(dir, f)).href)).default;
    if (only && mod.id !== only) continue;
    mods.push(mod);
  }
  return mods;
}

export async function runOracleCriterion(criterion, oracle) {
  const notes = [];
  const ctx = {
    oracle, assert, seeds, playRun, deepEqual, clone,
    note: s => notes.push(String(s))
  };
  const t0 = Date.now();
  try {
    await criterion.run(ctx);
    return { status: 'pass', message: null, notes, ms: Date.now() - t0 };
  } catch (e) {
    return { status: 'fail', message: e.message, notes, ms: Date.now() - t0 };
  }
}

export async function runArtifactCriterion(criterion, artifactPath, oracle) {
  const { chromium } = await import('playwright');
  const notes = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 360, height: 780 },
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const t0 = Date.now();
  try {
    const ctx = { page, context, artifactPath, oracle, assert, note: s => notes.push(String(s)) };
    await criterion.run(ctx);
    return { status: 'pass', message: null, notes, ms: Date.now() - t0 };
  } catch (e) {
    return { status: 'fail', message: e.message, notes, ms: Date.now() - t0 };
  } finally {
    await browser.close();
  }
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  const only = arg('--only');
  const criteria = await loadCriteria(only);

  if (has('--selftest')) {
    const fixtures = {
      hollow: await import(pathToFileURL(join(here, 'fixtures/hollow.mjs')).href),
      faithful: await import(pathToFileURL(join(here, 'fixtures/faithful.mjs')).href)
    };
    const rows = [];
    let bad = 0;
    for (const c of criteria) {
      if (c.surface !== 'oracle') { rows.push({ id: c.id, skipped: 'artifact surface' }); continue; }
      for (const [name, fx] of Object.entries(fixtures)) {
        const expected = c.selftest?.[name];
        if (!expected) { console.error(`${c.id}: no selftest declaration for ${name}`); bad++; continue; }
        const r = await runOracleCriterion(c, fx);
        const ok = r.status === expected;
        if (!ok) bad++;
        rows.push({ id: c.id, fixture: name, expected, actual: r.status, ok, message: r.message });
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.id} vs ${name}: expected ${expected}, got ${r.status}` +
                    (ok ? '' : ` — ${r.message}`));
      }
    }
    await writeFile(join(here, 'report.json'),
      JSON.stringify({ ts: new Date().toISOString(), mode: 'selftest', rows }, null, 2));
    process.exit(bad ? 1 : 0);
  }

  const oraclePath = resolve(here, '..', arg('--oracle', 'oracle.mjs'));
  const artifactPath = resolve(here, '..', arg('--artifact', 'nullrun.html'));
  const results = [];

  const haveOracle = await exists(oraclePath);
  const haveArtifact = await exists(artifactPath);

  for (const c of criteria) {
    let r;
    if (c.surface === 'oracle') {
      r = haveOracle
        ? await runOracleCriterion(c, await import(pathToFileURL(oraclePath).href))
        : { status: 'fail', message: `no oracle at ${oraclePath}`, notes: [], ms: 0 };
    } else if (!haveArtifact) {
      r = { status: 'fail', message: `no artifact at ${artifactPath}`, notes: [], ms: 0 };
    } else if (!haveOracle) {
      r = { status: 'fail', message: `no oracle at ${oraclePath}`, notes: [], ms: 0 };
    } else {
      r = await runArtifactCriterion(c, artifactPath, await import(pathToFileURL(oraclePath).href));
    }
    results.push({ id: c.id, title: c.title, surface: c.surface, ...r });
    console.log(`${r.status === 'pass' ? 'ok  ' : 'FAIL'} ${c.id}  ${c.title}` +
                (r.status === 'pass' ? '' : `\n      ${r.message}`));
    for (const n of r.notes) console.log(`      · ${n}`);
  }

  const failed = results.filter(r => r.status !== 'pass');
  const report = {
    ts: new Date().toISOString(),
    mode: 'check',
    passed: results.length - failed.length,
    total: results.length,
    green: failed.length === 0,
    results
  };
  await writeFile(join(here, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\n${report.passed}/${report.total} criteria pass`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('run.mjs')) await main();
```

- [ ] **Step 6: Run the criterion against the negative control**

`faithful.mjs` does not exist yet, so run A5 against `hollow` alone:

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node -e "
import('./checks/run.mjs').then(async m => {
  const c = (await m.loadCriteria('A5'))[0];
  const fx = await import('./checks/fixtures/hollow.mjs');
  console.log(await m.runOracleCriterion(c, fx));
});
"
```

Expected: **fail**, with `Cannot find module '../policy.mjs'`. The criterion imports a policy that
Task 4 writes. This is the failing state the next task resolves — do not stub it.

- [ ] **Step 7: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/checks
git commit -m "goal-driven: check runner, helpers, negative control"
```

---

## Task 4: The policy and the positive control

**Files:**
- Create: `goal-driven/checks/policy.mjs`
- Create: `goal-driven/checks/fixtures/faithful.mjs`

**Interfaces:**
- Consumes: the five contract functions; `deepEqual` from `lib/deep.mjs`.
- Produces:
  - `policy(oracle, state) -> Action | null` — the competent scripted policy A13, A15 and A17 are measured under
  - `fixtures/faithful.mjs` exporting the full contract: an abstract three-layer resource game

### Why the policy uses lookahead

A competent policy has to compare actions, and the `View` deliberately exposes no per-action
value — adding one would let an implementation define its own difficulty. Because `apply` is pure,
the policy can simply simulate each legal action and score the resulting `View`. That is generic,
needs nothing from the contract that criteria do not already need, and cannot be gamed by tuning a
field nobody else reads.

### Why `faithful.mjs` is abstract

It is a positive control for the *suite*, not a reference implementation for the *game*. It has no
theme, no content, and no relationship to NULLRUN, and `goal-driven/CLAUDE.md` forbids the loop
from reading it. It passes the nine structural criteria and is **declared to fail** A13, A14, A15
and A17 — no toy small enough to be a control is a game good enough to be viable. Those four have
no positive control at scaffolding time, and their only non-tautology proof is the mutant set.

- [ ] **Step 1: Write `goal-driven/checks/policy.mjs`**

```js
// The competent scripted policy. Uses only contract surface: legalActions, allOffers, apply, view.
// Deterministic — ties break on the order legalActions returned, and strictly greater wins.

export function score(v) {
  if (v.terminal) return v.outcome === 'win' ? 1e9 : -1e9;
  let s = 0;
  s += v.layer * 10000;                                   // depth is the point
  s -= (v.threat ? v.threat.integrity : 0) * 100;         // hurt the thing in front of you
  if (v.pressure.max > 0) s -= (v.pressure.value / v.pressure.max) * 5000;
  s += v.resources.credits * 10;
  s += v.resources.roster.length * 50;                    // options are worth something
  s += v.resources.ram;
  return s;
}

export function policy(oracle, state) {
  const legal = oracle.legalActions(state);
  if (!legal || legal.length === 0) return null;
  const v = oracle.view(state);

  // At a choice point, take the hardest node that is advertised as achievable — that is where the
  // payout is. When NOTHING is achievable a competent player still has to move, and takes the
  // softest: ranking the fallback by descending reach would make the policy choose the worst
  // option available, and A13, A15 and A17 are all measured under it.
  if (v.screen === 'offers') {
    const offers = oracle.allOffers(state);
    const pool = offers.filter(o => o.achievable);
    const byId = (a, b) => String(a.id).localeCompare(String(b.id));
    const ranked = pool.length
      ? pool.slice().sort((a, b) => b.reach - a.reach || byId(a, b))
      : offers.slice().sort((a, b) => a.reach - b.reach || byId(a, b));
    for (const o of ranked) {
      const take = legal.find(a => a.type === 'take' && a.id === o.id);
      if (take) return take;
    }
  }

  const now = score(v);
  let best = null, bestScore = -Infinity;
  for (const a of legal) {
    if (a.type === 'bail') continue;                      // never voluntarily abandon the run
    const s = score(oracle.view(oracle.apply(state, a)));
    if (s > bestScore) { bestScore = s; best = a; }
  }
  if (best === null) return legal[0];

  // Nothing on offer improves the position: end the turn rather than churn inside it.
  if (bestScore <= now) {
    const end = legal.find(a => a.type === 'end');
    if (end) return end;
  }
  return best;
}
```

- [ ] **Step 2: Write `goal-driven/checks/fixtures/faithful.mjs`**

```js
// POSITIVE CONTROL. An abstract three-layer resource game. Structurally honest: deterministic,
// conserving, caps enforced, harm declared before it lands, achievability truthful.
//
// It is NOT NULLRUN and must never be read by the loop — see goal-driven/CLAUDE.md. It exists so
// that a criterion which can never pass anything is caught at scaffolding time rather than by a
// forty-iteration stall.
//
// Declared to FAIL A13, A14, A15 and A17. A toy small enough to be a control is not a game.

const LAYERS = 3, RAM_MAX = 6, ROSTER_CAP = 3, CLOCK_MAX = 8, FREE_VALUE = 2;

const TOKENS = {
  t1: { value: 3, cost: 1 }, t2: { value: 4, cost: 2 }, t3: { value: 5, cost: 3 },
  t4: { value: 6, cost: 4 }, t5: { value: 7, cost: 5 }, t6: { value: 8, cost: 1 },
  t7: { value: 9, cost: 2 }, t8: { value: 10, cost: 3 }, t9: { value: 11, cost: 4 },
  t10: { value: 12, cost: 5 }, t11: { value: 13, cost: 1 }, t12: { value: 14, cost: 2 }
};
const ALL = Object.keys(TOKENS);

const lcg = s => (Math.imul(s, 1664525) + 1013904223) >>> 0;
const rand = s => { const n = lcg(s); return [n / 4294967296, n]; };
const clone = x => JSON.parse(JSON.stringify(x));

function incomingFor(layer) { return 2 + layer; }

function turnsAllowed(s) {
  // Counts the turn on which the clock fills. That turn is still a turn you act in. Valid only
  // while `s.clock` is the live clock of the encounter in progress — i.e. inside `view()`.
  const step = incomingFor(s.layer);
  return Math.floor((CLOCK_MAX - s.clock - 1) / step) + 1;
}

function turnsOnEntry(layer) {
  // What `turnsAllowed` will read once an offer is taken: entering an encounter always resets
  // the clock to 0 (see `apply`'s 'offers' branch), so the turn count an offer is priced against
  // must be computed from a clock of 0, never from whatever clock survived the last encounter.
  // `burst` and `makeOffers` price offers before that reset has happened, so they use this
  // instead of `turnsAllowed(s)` — using the stale `s.clock` there priced offers against a turn
  // count the player would never actually be given.
  const step = incomingFor(layer);
  return Math.floor((CLOCK_MAX - 1) / step) + 1;
}

function burst(s, armour) {
  const fromRoster = s.roster.reduce((t, id) => t + Math.max(1, TOKENS[id].value - armour), 0);
  return fromRoster + FREE_VALUE * turnsOnEntry(s.layer);
}

function makeOffers(s) {
  // Every offer is derived from what the player currently holds (via `burst`), not from the
  // layer number, so a choice point can never end up with nothing achievable in it (A2). The
  // three offers are shaped deliberately: the first is always achievable and unarmoured (the
  // fallback, and the softest — its slack over the free action alone is what A15 measures); the
  // second is achievable and armoured (what a competent player actually takes, so armour gets
  // exercised — A12); the third is never achievable, so a real choice, and the unachievable
  // flag genuinely varies, exists (A13, A16).
  let rs = s.rs;
  const freeTotal = FREE_VALUE * turnsOnEntry(s.layer);
  const [r0, rs1] = rand(rs);
  const [r1, rs2] = rand(rs1);
  const [r2, rs3] = rand(rs2);
  rs = rs3;
  const slack0 = 2 + Math.floor(r0 * 2);   // 2..3, added: stays achievable, stays above freeTotal
  const slack1 = 1 + Math.floor(r1 * 2);   // 1..2, subtracted: stays achievable
  const slack2 = 3 + Math.floor(r2 * 2);   // 3..4, added: stays unachievable
  const offers = [
    { id: `n${s.layer}_0`, label: `node ${s.layer}-0`, cost: 0,
      reach: freeTotal + slack0, armour: 0 },
    { id: `n${s.layer}_1`, label: `node ${s.layer}-1`, cost: 1,
      reach: Math.max(1, burst(s, 1) - slack1), armour: 1 },
    { id: `n${s.layer}_2`, label: `node ${s.layer}-2`, cost: 2,
      reach: burst(s, 2) + slack2, armour: 2 }
  ];
  return { offers, rs };
}

export function newRun(seed) {
  const s = {
    rs: (seed >>> 0) || 1, screen: 'loadout', layer: 0, turn: 0, clock: 0,
    ram: RAM_MAX, roster: ['t1', 't2', 't3'], burned: [], credits: 0,
    threat: null, offers: [], pending: null, outcome: null, freeSpent: false
  };
  return s;
}

export function allOffers(state) {
  if (state.screen === 'offers') {
    return state.offers.map(o => ({
      id: o.id, label: o.label, cost: o.cost, reach: o.reach,
      achievable: burst(state, o.armour) >= o.reach && o.cost <= state.credits
    }));
  }
  if (state.screen === 'payout' && state.pending) {
    return [{ id: state.pending, label: `token ${state.pending}`, cost: 0, reach: 0, achievable: true }];
  }
  return [];
}

export function legalActions(state) {
  const s = state;
  if (s.screen === 'end') return [];
  if (s.screen === 'loadout') return [{ type: 'onward' }];
  if (s.screen === 'offers') {
    const acts = allOffers(s).filter(o => o.cost <= s.credits).map(o => ({ type: 'take', id: o.id }));
    return acts.length ? acts.concat([{ type: 'bail' }]) : [{ type: 'bail' }];
  }
  if (s.screen === 'payout') {
    if (s.pending && s.roster.length >= ROSTER_CAP) {
      return s.roster.map(id => ({ type: 'release', id }));
    }
    return [{ type: 'onward' }];
  }
  // encounter
  const acts = s.roster.filter(id => TOKENS[id].cost <= s.ram).map(id => ({ type: 'call', id }));
  if (!s.freeSpent) acts.push({ type: 'free' });
  acts.push({ type: 'end' });
  acts.push({ type: 'bail' });
  return acts;
}

export function apply(state, action) {
  const legal = legalActions(state);
  if (!legal.some(a => a.type === action.type && a.id === action.id)) return state;
  const s = clone(state);

  if (action.type === 'bail') { s.screen = 'end'; s.outcome = 'loss'; return s; }

  if (s.screen === 'loadout') {
    const { offers, rs } = makeOffers(s);
    s.offers = offers; s.rs = rs; s.screen = 'offers'; s.credits = 3;
    return s;
  }

  if (s.screen === 'offers') {
    const o = s.offers.find(x => x.id === action.id);
    s.credits -= o.cost;
    s.threat = { id: o.id, integrity: o.reach, armour: o.armour };
    s.screen = 'encounter'; s.turn = 0; s.clock = 0; s.ram = RAM_MAX; s.freeSpent = false;
    return s;
  }

  if (s.screen === 'payout') {
    if (action.type === 'release') {
      s.roster = s.roster.filter(id => id !== action.id);
      return s;
    }
    if (s.pending) { s.roster.push(s.pending); s.pending = null; }
    if (s.layer + 1 >= LAYERS) { s.screen = 'end'; s.outcome = 'win'; return s; }
    s.layer += 1;
    const { offers, rs } = makeOffers(s);
    s.offers = offers; s.rs = rs; s.screen = 'offers';
    return s;
  }

  // encounter
  if (action.type === 'call') {
    const tok = TOKENS[action.id];
    s.ram -= tok.cost;
    s.roster = s.roster.filter(id => id !== action.id);
    s.burned.push(action.id);
    s.threat.integrity -= Math.max(1, tok.value - s.threat.armour);
  } else if (action.type === 'free') {
    s.threat.integrity -= FREE_VALUE;
    s.freeSpent = true;
  } else if (action.type === 'end') {
    s.clock += incomingFor(s.layer);
    s.turn += 1;
    s.ram = RAM_MAX;
    s.freeSpent = false;
  }

  if (s.threat.integrity <= 0) {
    s.threat = null; s.screen = 'payout'; s.credits += 2 + s.layer;
    const free = ALL.filter(id => !s.roster.includes(id) && !s.burned.includes(id));
    s.pending = free.length ? free[0] : null;
    return s;
  }
  if (s.clock >= CLOCK_MAX) { s.screen = 'end'; s.outcome = 'loss'; }
  return s;
}

export function view(state) {
  const s = state;
  return {
    screen: s.screen, terminal: s.screen === 'end', outcome: s.outcome,
    layer: s.layer, layerCount: LAYERS, turn: s.turn,
    turnsAllowed: s.screen === 'encounter' ? turnsAllowed(s) : 0,
    resources: {
      ram: s.ram, ramMax: RAM_MAX,
      roster: s.roster.slice(), rosterCap: ROSTER_CAP,
      burned: s.burned.slice(), credits: s.credits
    },
    pressure: { id: 'clock', value: s.clock, max: CLOCK_MAX },
    threat: s.threat ? { ...s.threat } : null,
    incoming: s.screen === 'encounter'
      ? { value: incomingFor(s.layer), label: `clock +${incomingFor(s.layer)}` } : null,
    free: s.screen === 'encounter' ? { id: 'free', value: FREE_VALUE } : null
  };
}
```

- [ ] **Step 3: Run the selftest for A5 against both fixtures**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/run.mjs --selftest --only A5
```

Expected: two `ok` lines — `A5 vs hollow: expected pass, got pass` and `A5 vs faithful: expected pass, got pass` — and exit 0.

- [ ] **Step 4: Verify the positive control actually plays**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node --input-type=module -e "
const h = await import('./checks/lib/harness.mjs');
const p = await import('./checks/policy.mjs');
const fx = await import('./checks/fixtures/faithful.mjs');
let wins = 0, turns = 0;
for (const seed of h.seeds(50)) {
  const r = h.playRun(fx, seed, p.policy, { maxSteps: 500, collect: false });
  if (r.finalView.outcome === 'win') wins++;
  turns += r.finalView.turn;
}
console.log({ wins, avgTurn: turns / 50 });
"
```

Expected: `wins` is greater than 0 and `avgTurn` is greater than 0. If `wins` is 0 the toy is not a
positive control — it is a second hollow fixture, and the structural criteria will be proven by
nothing. Fix the toy, not the criteria.

- [ ] **Step 5: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/checks/policy.mjs goal-driven/checks/fixtures/faithful.mjs
git commit -m "goal-driven: competent policy and positive control"
```

---

## Task 5: The structural criteria — A1, A2, A3, A4, A6, A11, A12, A16

**Files:**
- Create: `goal-driven/checks/criteria/a01.mjs`, `a02.mjs`, `a03.mjs`, `a04.mjs`, `a06.mjs`, `a11.mjs`, `a12.mjs`, `a16.mjs`

**Interfaces:**
- Consumes: `playRun`, `replay`, `seeds` from `lib/harness.mjs`; `deepEqual`, `clone` from `lib/deep.mjs`; `policy` from `policy.mjs`.
- Produces: eight criterion modules of the shape Task 3 established. No later task imports them; `run.mjs` discovers them by directory.

Every one of these ends with an assertion that it **actually probed something**. A check that
silently observes zero cases is the exact failure §K′ exists to prevent, and the mutant set cannot
catch it — a criterion that examines nothing kills nothing, but it also fails nothing, so the
self-assertion has to be inside the criterion.

- [ ] **Step 1: Write `a01.mjs` — determinism**

```js
import { deepEqual } from '../lib/deep.mjs';
import { playRun, replay, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A1',
  title: 'Same seed and same input sequence reproduce a run exactly, including its final score.',
  surface: 'oracle',
  // hollow renders a constant view, so the divergence assertion below fails it.
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(3);
    let compared = 0;

    for (const seed of list) {
      const first = playRun(oracle, seed, policy, { maxSteps: 600 });
      const actions = first.steps.map(s => s.action);
      assert.ok(actions.length > 0, `seed ${seed} produced no actions — nothing to replay`);

      const trailA = [first.steps[0].before, ...first.steps.map(s => s.after)];
      const trailB = replay(oracle, seed, actions);
      assert.equal(trailA.length, trailB.length, `replay length differs on seed ${seed}`);
      for (let i = 0; i < trailA.length; i++) {
        assert.ok(deepEqual(trailA[i], trailB[i]),
          `state ${i} differs on replay of seed ${seed}`);
        compared += 1;
      }
      assert.ok(deepEqual(oracle.view(first.final), oracle.view(trailB.at(-1))),
        `final view differs on replay of seed ${seed}`);
    }

    // A determinism check that cannot tell seeds apart is measuring a constant. One pair can
    // collide by chance on any implementation, so sample eight and require real variety.
    const finals = seeds(8, 4242).map(s =>
      JSON.stringify(oracle.view(playRun(oracle, s, policy, { maxSteps: 600, collect: false }).final)));
    const distinct = new Set(finals).size;
    assert.ok(distinct >= 2,
      `eight seeds produced ${distinct} distinct outcome(s) — the seed does nothing`);
    note(`${distinct} distinct final views across 8 seeds`);

    note(`compared ${compared} intermediate states across ${list.length} seeds`);
  }
};
```

- [ ] **Step 2: Write `a02.mjs` — choice points**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A2',
  title: 'Every choice point offers distinct options, priced differently, at least one of which is achievable with what the player currently has.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let points = 0;

    for (const seed of seeds(50)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before } of steps) {
        if (oracle.view(before).screen !== 'offers') continue;
        const offers = oracle.allOffers(before);
        points += 1;

        assert.ok(offers.length >= 3, `only ${offers.length} options at a choice point (seed ${seed})`);
        const ids = new Set(offers.map(o => o.id));
        assert.equal(ids.size, offers.length, `duplicate option ids at a choice point (seed ${seed})`);

        const costs = new Set(offers.map(o => o.cost));
        const reaches = new Set(offers.map(o => o.reach));
        assert.ok(costs.size > 1 || reaches.size > 1,
          `every option identical in cost and reach (seed ${seed}) — not a choice`);

        assert.ok(offers.some(o => o.achievable),
          `no achievable option at layer ${oracle.view(before).layer} (seed ${seed})`);
      }
    }

    assert.ok(points > 0, 'no choice point was ever reached — the check proved nothing');
    note(`inspected ${points} choice points across 50 seeds`);
  }
};
```

- [ ] **Step 3: Write `a03.mjs` — conservation**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A3',
  title: 'Resource accounting is conserved: nothing is silently created, duplicated or destroyed, over at least 500 turns of play.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let turns = 0, seedsUsed = 0, probedCandidates = 0;

    for (const seed of seeds(200)) {
      if (turns >= 500) break;
      seedsUsed += 1;
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });

      for (const { before, action, after } of steps) {
        const b = oracle.view(before).resources;
        const a = oracle.view(after).resources;
        const where = `seed ${seed}, action ${action.type}/${action.id ?? ''}`;

        assert.equal(new Set(b.roster).size, b.roster.length, `duplicate id in roster (${where})`);
        assert.equal(new Set(a.roster).size, a.roster.length, `duplicate id in roster after (${where})`);
        for (const id of a.roster) {
          assert.ok(!a.burned.includes(id), `id ${id} is both live and burned (${where})`);
        }

        assert.ok(a.burned.length >= b.burned.length, `burned list shrank (${where})`);
        for (let i = 0; i < b.burned.length; i++) {
          assert.equal(a.burned[i], b.burned[i], `burned list reordered at ${i} (${where})`);
        }

        assert.ok(a.credits >= 0, `credits went negative (${where})`);
        assert.ok(a.ram >= 0, `ram went negative (${where})`);

        if (action.type === 'call') {
          assert.equal(a.burned.length, b.burned.length + 1,
            `a call burned ${a.burned.length - b.burned.length} ids, expected 1 (${where})`);
          assert.equal(a.burned.at(-1), action.id, `a call burned the wrong id (${where})`);
          assert.ok(b.roster.includes(action.id) && !a.roster.includes(action.id),
            `a call did not remove its id from the roster (${where})`);

          // The contract defines a call as spending a resource to act. A call that costs
          // nothing makes the resource decorative, and no other criterion reads a call's price.
          assert.ok(a.ram < b.ram,
            `a call left ram at ${b.ram} — it spent nothing (${where})`);
        }
        if (action.type === 'release') {
          assert.equal(a.roster.length, b.roster.length - 1, `a release removed other than one (${where})`);
          assert.ok(!a.roster.includes(action.id), `a release kept its id (${where})`);
        }
        if (action.type === 'take') {
          assert.ok(a.roster.length - b.roster.length <= 1, `a take added more than one (${where})`);
        }

        const added = a.roster.filter(id => !b.roster.includes(id));
        const removed = b.roster.filter(id => !a.roster.includes(id));

        // Roster membership moves only through the actions meant to move it, and only by the
        // amount they declare. Without this, a call that removes its own id while conjuring a
        // fresh one satisfies every other assertion in this file.
        if (action.type === 'call' || action.type === 'release') {
          assert.deepEqual(added, [], `a ${action.type} added ${added.join(',')} to the roster (${where})`);
          assert.equal(removed.length, 1,
            `a ${action.type} removed ${removed.length} roster entries, expected 1 (${where})`);
          assert.equal(removed[0], action.id, `a ${action.type} removed the wrong id (${where})`);
        }
        if (action.type === 'free' || action.type === 'end' || action.type === 'bail') {
          assert.deepEqual(added, [], `a ${action.type} added ${added.join(',')} to the roster (${where})`);
          assert.deepEqual(removed, [], `a ${action.type} removed ${removed.join(',')} from the roster (${where})`);
        }
        if (action.type === 'take') {
          assert.deepEqual(removed, [], `a take removed ${removed.join(',')} from the roster (${where})`);
        }

        // Roster growth is bounded everywhere, not only on the actions that name it. `onward`
        // is where a payout legitimately grants a token, which is exactly why an unconstrained
        // `onward` is the natural route for silent creation.
        assert.ok(added.length <= 1,
          `${action.type} added ${added.length} roster entries at once (${where})`);
        for (const id of added) {
          assert.ok(!b.burned.includes(id),
            `${action.type} returned burned id ${id} to the roster (${where})`);
        }

        // Ram never rises silently within a screen — the existing rule, unchanged.
        const sameScreen = oracle.view(before).screen === oracle.view(after).screen;
        if (sameScreen && action.type !== 'end') {
          assert.ok(a.ram <= b.ram, `ram rose from ${b.ram} to ${a.ram} on a ${action.type} (${where})`);
        }

        // Credits may rise only on the action that ENTERS a payout, or out of the loadout where
        // a run is equipped. Permitting any action whose result is a payout screen lets an
        // action taken while already there mint freely.
        if (a.credits > b.credits) {
          const bScreen = oracle.view(before).screen, aScreen = oracle.view(after).screen;
          const entersPayout = bScreen !== 'payout' && aScreen === 'payout';
          assert.ok(entersPayout || bScreen === 'loadout',
            `${action.type} raised credits from ${b.credits} to ${a.credits} without entering a payout (${where})`);
        }

        // Probe the paths the policy never takes. A statistical harness cannot see what its own
        // policy never does, so ask the oracle directly: every action that is LEGAL here gets
        // checked, whether or not the player chose it. `apply` is pure, so this costs nothing
        // but a call and cannot disturb the run in progress.
        for (const cand of oracle.legalActions(before)) {
          const probedView = oracle.view(oracle.apply(before, cand));
          probedCandidates += 1;

          const bScreen = oracle.view(before).screen;
          const entersPayout = bScreen !== 'payout' && probedView.screen === 'payout';
          if (probedView.resources.credits > b.credits) {
            assert.ok(entersPayout || bScreen === 'loadout',
              `${cand.type} raised credits from ${b.credits} to ${probedView.resources.credits} without entering a payout (${where})`);
          }

          if (cand.type === 'take') {
            const offer = oracle.allOffers(before).find(o => o.id === cand.id);
            assert.ok(offer,
              `a take is legal for ${cand.id}, which allOffers does not list (${where})`);
            assert.equal(b.credits - probedView.resources.credits, offer.cost,
              `taking ${cand.id} charged ${b.credits - probedView.resources.credits} against a declared price of ${offer.cost} (${where})`);
          }
          if (cand.type === 'bail') {
            const pr = probedView.resources;
            const pAdded = pr.roster.filter(id => !b.roster.includes(id));
            const pRemoved = b.roster.filter(id => !pr.roster.includes(id));
            assert.deepEqual(pAdded, [],
              `bailing added ${pAdded.join(',')} to the roster (${where})`);
            assert.deepEqual(pRemoved, [],
              `bailing removed ${pRemoved.join(',')} from the roster (${where})`);
            assert.ok(pr.ram <= b.ram,
              `bailing raised ram from ${b.ram} to ${pr.ram} (${where})`);
          }
        }

        if (action.type === 'end') turns += 1;
      }
    }

    assert.ok(turns >= 500, `only ${turns} turns audited across ${seedsUsed} seeds, need 500`);
    note(`audited ${turns} turns across ${seedsUsed} seeds`);
    note(`probed ${probedCandidates} legal candidate actions, chosen or not, for silent credit creation`);
  }
};
```

- [ ] **Step 4: Write `a04.mjs` — harm is declared before it lands**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A4',
  title: 'No harm reaches the player that was not shown, at its exact value, before it landed.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let landed = 0;

    for (const seed of seeds(40)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before, action, after } of steps) {
        const b = oracle.view(before);
        if (b.screen !== 'encounter') continue;

        assert.ok(b.incoming !== null,
          `an encounter turn declared no incoming harm (seed ${seed}, turn ${b.turn})`);
        assert.ok(Number.isFinite(b.incoming.value),
          `incoming.value is not a number (seed ${seed})`);

        if (action.type !== 'end') {
          // Harm lands on ending the turn. Nothing else may move the pressure meter.
          const a0 = oracle.view(after);
          if (a0.screen === 'encounter') {
            assert.equal(a0.pressure.value, b.pressure.value,
              `pressure moved on a ${action.type} action (seed ${seed}) — undeclared harm`);
          }
          continue;
        }

        const a = oracle.view(after);
        assert.equal(a.pressure.value - b.pressure.value, b.incoming.value,
          `harm landed at ${a.pressure.value - b.pressure.value}, declared ${b.incoming.value} (seed ${seed}, turn ${b.turn})`);
        // A guard that counts zero-valued events as landings is satisfied by an oracle that
        // never harms the player at all — which is the thing this guard's own message denies.
        if (b.incoming.value > 0) landed += 1;
      }
    }

    assert.ok(landed > 0, 'no harm ever landed — the check proved nothing');
    note(`verified ${landed} declared-then-landed harm events`);
  }
};
```

- [ ] **Step 5: Write `a06.mjs` — a legal action always exists**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A6',
  title: 'The player always has a legal action, and every screen offers a way onward.',
  surface: 'oracle',
  selftest: { hollow: 'pass', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const screensSeen = new Set();
    let checked = 0;

    for (const seed of seeds(40)) {
      const run = playRun(oracle, seed, policy, { maxSteps: 600 });
      assert.notEqual(run.ended, 'no-action',
        `run dead-ended with no legal action (seed ${seed})`);
      assert.notEqual(run.ended, 'maxSteps',
        `run never terminated within 600 steps (seed ${seed})`);

      for (const v of run.views) {
        screensSeen.add(v.screen);
        if (v.terminal) continue;
        checked += 1;
      }
      for (const { before } of run.steps) {
        const v = oracle.view(before);
        if (v.terminal) continue;
        assert.ok(oracle.legalActions(before).length > 0,
          `no legal action on screen ${v.screen} (seed ${seed})`);
      }
    }

    assert.ok(checked > 0, 'no non-terminal state was ever examined');
    note(`screens reached: ${[...screensSeen].sort().join(', ')}`);
  }
};
```

- [ ] **Step 6: Write `a11.mjs` — caps hold, and are actually pressed**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A11',
  title: 'Any declared cap is enforced and never exceeded.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let rosterAtCap = 0, ramAtCap = 0, states = 0;
    let peakPressure = 0, pressureCeiling = 0;

    for (const seed of seeds(60)) {
      const run = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const v of run.views) {
        states += 1;
        peakPressure = Math.max(peakPressure, v.pressure.value);
        pressureCeiling = Math.max(pressureCeiling, v.pressure.max);
        assert.ok(v.resources.rosterCap > 0, 'rosterCap is not a cap');
        assert.ok(v.resources.ramMax > 0, 'ramMax is not a cap');
        assert.ok(v.pressure.max > 0, 'the pressure meter has no ceiling');

        assert.ok(v.resources.roster.length <= v.resources.rosterCap,
          `roster ${v.resources.roster.length} exceeds cap ${v.resources.rosterCap} (seed ${seed})`);
        assert.ok(v.resources.ram <= v.resources.ramMax,
          `ram ${v.resources.ram} exceeds max ${v.resources.ramMax} (seed ${seed})`);
        assert.ok(v.pressure.value <= v.pressure.max,
          `pressure ${v.pressure.value} exceeds max ${v.pressure.max} (seed ${seed})`);

        if (v.resources.roster.length === v.resources.rosterCap) rosterAtCap += 1;
        if (v.resources.ram === v.resources.ramMax) ramAtCap += 1;
      }

      // A cap that moves is tracking its resource. A cap that only ever falls is a mirror; one
      // that only ever rises is a ratchet, and a ratchet is never exceeded either. Neither is a
      // bound. Real caps hold for the length of a run.
      const first = run.views[0];
      for (const v of run.views) {
        assert.equal(v.resources.rosterCap, first.resources.rosterCap,
          `rosterCap changed from ${first.resources.rosterCap} to ${v.resources.rosterCap} mid-run (seed ${seed})`);
        assert.equal(v.resources.ramMax, first.resources.ramMax,
          `ramMax changed from ${first.resources.ramMax} to ${v.resources.ramMax} mid-run (seed ${seed})`);
        assert.equal(v.pressure.max, first.pressure.max,
          `pressure ceiling changed from ${first.pressure.max} to ${v.pressure.max} mid-run (seed ${seed})`);
      }
    }

    assert.ok(states > 0, 'no state was examined');
    assert.ok(rosterAtCap > 0,
      'the roster cap was never reached across 60 seeds — the check proved nothing');
    assert.ok(ramAtCap > 0, 'the ram ceiling was never reached across 60 seeds');

    // A ceiling the meter never comes near bounds nothing. This cannot demand the ceiling be
    // reached — a game a competent player wins is a game where the meter usually does not fill —
    // so it demands the ceiling be of the same order as the values that climb toward it. The
    // factor of two is a judgement, and it is the loosest bound that still rejects a ceiling
    // chosen to be unreachable.
    assert.ok(peakPressure * 2 >= pressureCeiling,
      `pressure peaked at ${peakPressure} against a ceiling of ${pressureCeiling} — the ceiling bounds nothing`);

    note(`${states} states; roster at cap ${rosterAtCap}, ram at ceiling ${ramAtCap}`);
    note(`pressure peaked at ${peakPressure} against ceiling ${pressureCeiling}`);
  }
};
```

- [ ] **Step 7: Write `a12.mjs` — mitigation never zeroes an attack**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A12',
  title: 'Damage mitigation never reduces an attack to nothing unless the rules say so explicitly.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let offensive = 0, againstArmour = 0, maxArmour = 0;

    for (const seed of seeds(60)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before, action, after } of steps) {
        if (action.type !== 'call' && action.type !== 'free') continue;
        const b = oracle.view(before);
        if (b.screen !== 'encounter' || !b.threat) continue;
        const a = oracle.view(after);

        // The threat is either still standing, or it was cleared by this action.
        const remaining = a.threat && a.threat.id === b.threat.id ? a.threat.integrity : 0;
        const dealt = b.threat.integrity - remaining;
        offensive += 1;
        maxArmour = Math.max(maxArmour, b.threat.armour);
        if (b.threat.armour > 0) againstArmour += 1;

        assert.ok(dealt >= 1,
          `a ${action.type} dealt ${dealt} against armour ${b.threat.armour} (seed ${seed})`);
      }
    }

    assert.ok(offensive > 0, 'no offensive action was ever taken — the check proved nothing');
    assert.ok(againstArmour > 0,
      'no offensive action ever met armour — mitigation was never exercised');
    note(`${offensive} offensive actions, ${againstArmour} against armour, highest armour ${maxArmour}`);
  }
};
```

- [ ] **Step 8: Write `a16.mjs` — achievability is truthful**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

// Independent oracle: rather than trusting the flag, take the offer and play it out.
// A mismatch in either direction is a lie the player was told before committing.
function clears(oracle, state, offerId) {
  const take = oracle.legalActions(state).find(a => a.type === 'take' && a.id === offerId);
  if (!take) return null;                       // not offered as a legal take: not this check's business
  let s = oracle.apply(state, take);
  const startLayer = oracle.view(s).layer;
  for (let i = 0; i < 400; i++) {
    const v = oracle.view(s);
    if (v.terminal) return v.outcome === 'win';
    if (v.screen !== 'encounter') return v.layer >= startLayer;  // reached payout: cleared
    const a = policy(oracle, s);
    if (!a) return false;
    s = oracle.apply(s, a);
  }
  return false;
}

export default {
  id: 'A16',
  title: 'The player can see whether a choice is achievable before committing to it.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let claimedTrue = 0, claimedFalse = 0;

    for (const seed of seeds(30)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before } of steps) {
        if (oracle.view(before).screen !== 'offers') continue;
        for (const o of oracle.allOffers(before)) {
          const actual = clears(oracle, before, o.id);
          if (actual === null) continue;
          if (o.achievable) {
            claimedTrue += 1;
            assert.ok(actual, `offer ${o.id} was advertised achievable and could not be cleared (seed ${seed})`);
          } else {
            claimedFalse += 1;
            assert.ok(!actual, `offer ${o.id} was advertised unachievable and cleared anyway (seed ${seed})`);
          }
        }
      }
    }

    assert.ok(claimedTrue > 0, 'no offer was ever advertised achievable');
    assert.ok(claimedFalse > 0,
      'no offer was ever advertised unachievable — the flag is a constant, not information');
    note(`verified ${claimedTrue} achievable and ${claimedFalse} unachievable claims by playing them out`);
  }
};
```

> **If this criterion fails because the policy is imperfect rather than because the flag lies**,
> the resolution is to make `achievable` honest about what a competent player can do — not to
> loosen the assertion. A flag that promises more than the scripted policy can deliver is exactly
> the lie A16 exists to catch.

- [ ] **Step 9: Run the full selftest**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/run.mjs --selftest
```

Expected: every line `ok`, exit 0. Specifically `A2`, `A3`, `A4`, `A11`, `A12` and `A16` report
`expected fail, got fail` against `hollow`, and `expected pass, got pass` against `faithful`.

Any `expected pass, got fail` against `faithful` is a criterion that can never pass anything — fix
the criterion. Any `expected fail, got pass` against `hollow` is a criterion that proves nothing —
also fix the criterion.

- [ ] **Step 10: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/checks/criteria
git commit -m "goal-driven: structural criteria A1 A2 A3 A4 A6 A11 A12 A16"
```

---

## Task 6: The statistical criteria — A13, A15, A17

**Files:**
- Modify: `goal-driven/checks/policy.mjs` — add `makeLazyPolicy`
- Create: `goal-driven/checks/criteria/a13.mjs`, `a15.mjs`, `a17.mjs`

**Interfaces:**
- Consumes: `policy`, `playRun`, `seeds`.
- Produces: `makeLazyPolicy() -> (oracle, state) => Action|null` — a fresh stateful weak policy that presses the free action once per turn and otherwise ends. A13 and A15 both need it.

A13, A14 and A17 have **no positive control**: `faithful.mjs` is declared to fail them, because a
toy small enough to be a control is not a game. Their only proof of lethality is the mutant set in
Task 8, and that is stated here so a later reader does not mistake a green A17 at scaffolding time
for evidence of anything.

A15 is the exception. The toy's free action totals 8 against a softest reach of 12 at layer 0, 6
against 14 at layer 1, and 4 against 16 at layer 2 — so A15 passes it, and is declared to. That is
a genuine positive control and strictly better than not having one.

- [ ] **Step 1: Add `makeLazyPolicy` to `goal-driven/checks/policy.mjs`**

Append to the file:

```js
// A deliberately weak player: takes the cheapest option, presses the free action once a turn,
// and otherwise ends the turn. Stateful, so build a fresh one per run.
//
// This is the control for "does play matter". If the weak player does as well as the competent
// one, the outcome was settled before either of them started — which is exactly A13.
export function makeLazyPolicy() {
  let lastKey = null;
  return function lazy(oracle, state) {
    const legal = oracle.legalActions(state);
    if (!legal || legal.length === 0) return null;
    const v = oracle.view(state);

    if (v.screen === 'offers') {
      const ranked = oracle.allOffers(state).slice()
        .sort((a, b) => a.reach - b.reach || String(a.id).localeCompare(String(b.id)));
      for (const o of ranked) {
        const take = legal.find(a => a.type === 'take' && a.id === o.id);
        if (take) return take;
      }
      return legal.find(a => a.type !== 'bail') || legal[0];
    }

    if (v.screen !== 'encounter') {
      return legal.find(a => a.type === 'onward') || legal.find(a => a.type !== 'bail') || legal[0];
    }

    const key = `${v.layer}:${v.turn}`;
    if (key !== lastKey) {
      lastKey = key;
      const free = legal.find(a => a.type === 'free');
      if (free) return free;
    }
    return legal.find(a => a.type === 'end') || legal.find(a => a.type !== 'bail') || legal[0];
  };
}
```

- [ ] **Step 2: Write `a13.mjs` — the outcome is not decided before play**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy, makeLazyPolicy } from '../policy.mjs';

export default {
  id: 'A13',
  title: 'No resource may be bounded such that the outcome is decided before play begins.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'fail' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(200);

    // (i) Outcomes are not constant across the sample.
    const outcomes = { win: 0, loss: 0, other: 0 };
    for (const seed of list) {
      const r = playRun(oracle, seed, policy, { maxSteps: 800, collect: false });
      const o = r.finalView.outcome;
      if (o === 'win') outcomes.win += 1;
      else if (o === 'loss') outcomes.loss += 1;
      else outcomes.other += 1;
    }
    note(`competent policy: ${outcomes.win} wins, ${outcomes.loss} losses, ${outcomes.other} neither`);
    assert.ok(outcomes.win > 0 && outcomes.loss > 0,
      `outcome is constant across 200 seeds (${JSON.stringify(outcomes)}) — settled before play`);

    // (ii) Achievability varies. If every option is always achievable, or never, the choice is
    // arithmetic rather than play.
    let allAchievable = 0, noneAchievable = 0, mixed = 0;
    for (const seed of list.slice(0, 60)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 800 });
      for (const { before } of steps) {
        if (oracle.view(before).screen !== 'offers') continue;
        const offers = oracle.allOffers(before);
        const n = offers.filter(o => o.achievable).length;
        if (n === offers.length) allAchievable += 1;
        else if (n === 0) noneAchievable += 1;
        else mixed += 1;
      }
    }
    note(`choice points: ${allAchievable} all-achievable, ${mixed} mixed, ${noneAchievable} none`);
    assert.ok(mixed > 0,
      'every choice point was uniformly achievable or uniformly not — the route is a formality');

    // (iii) Play matters. A deliberately weak player must not match the competent one.
    let lazyWins = 0, diverged = 0;
    for (const seed of list) {
      const lazy = playRun(oracle, seed, makeLazyPolicy(), { maxSteps: 800, collect: false });
      const comp = playRun(oracle, seed, policy, { maxSteps: 800, collect: false });
      if (lazy.finalView.outcome === 'win') lazyWins += 1;
      if (lazy.finalView.outcome !== comp.finalView.outcome) diverged += 1;
    }
    const divergence = diverged / list.length;
    note(`weak player won ${lazyWins}/200; outcomes diverged from competent on ${diverged}/200 (${(divergence * 100).toFixed(1)}%)`);
    assert.ok(divergence >= 0.20,
      `the weak and competent players reached the same outcome on ${(100 - divergence * 100).toFixed(1)}% of seeds — play barely matters`);
    assert.ok(lazyWins < outcomes.win,
      `the weak player won as often as the competent one (${lazyWins} vs ${outcomes.win})`);
  }
};
```

- [ ] **Step 3: Write `a15.mjs` — the free action cannot carry**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A15',
  title: 'No free or renewable action may trivialise the primary resource.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let worst = { margin: Infinity, layer: null, seed: null, freeTotal: 0, reach: 0 };
    let measured = 0;
    const byLayer = new Map();

    for (const seed of seeds(120)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 800 });
      for (const { before } of steps) {
        const v = oracle.view(before);
        if (v.screen !== 'offers') continue;

        const offers = oracle.allOffers(before);
        if (offers.length === 0) continue;
        const softest = offers.slice().sort((a, b) => a.reach - b.reach)[0];
        const take = oracle.legalActions(before).find(a => a.type === 'take' && a.id === softest.id);
        if (!take) continue;

        // Enter the softest node and read the free action against the turns actually granted.
        const inside = oracle.view(oracle.apply(before, take));
        if (inside.screen !== 'encounter' || !inside.free || !inside.threat) continue;

        const freeTotal = inside.free.value * inside.turnsAllowed;
        const margin = inside.threat.integrity - freeTotal;
        measured += 1;
        byLayer.set(v.layer, Math.min(byLayer.get(v.layer) ?? Infinity, margin));
        if (margin < worst.margin) {
          worst = { margin, layer: v.layer, seed, freeTotal, reach: inside.threat.integrity };
        }
      }
    }

    assert.ok(measured > 0, 'no encounter was ever entered — the check proved nothing');
    note(`measured ${measured} softest-node entries; worst margin ${worst.margin} at layer ${worst.layer} (seed ${worst.seed}: free total ${worst.freeTotal} vs reach ${worst.reach})`);
    note(`worst margin by layer: ${[...byLayer.entries()].sort((a, b) => a[0] - b[0]).map(([l, m]) => `L${l}:${m}`).join(' ')}`);

    assert.ok(worst.margin > 0,
      `the free action alone clears the softest node at layer ${worst.layer} (free ${worst.freeTotal} vs reach ${worst.reach}, seed ${worst.seed})`);
  }
};
```

> `turnsAllowed` counts the turn on which the pressure meter fills, per the contract. That is the
> arithmetic `traditional` got wrong by one, which kept its A15 green for the whole build. The
> contract states it so this check does not have to recompute it.

- [ ] **Step 4: Write `a17.mjs` — viability**

```js
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// The content catalogue is the shared art, not anything the build declares about itself. Nineteen
// tiles exist; a build that never reaches one of them has content the sample does not cover.
function catalogue() {
  const dir = join(here, '..', '..', '..', 'ephemeral', 'art', 'src');
  return readdirSync(dir).filter(f => f.endsWith('.webp')).map(f => f.replace(/\.webp$/, ''));
}

export default {
  id: 'A17',
  title: 'Viability. A competent scripted policy wins 15–65% of 200 seeds, encounters average at least 2.5 decisions, under a tenth end before a decision is taken, and every piece of content is reached across the sample.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'fail' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(200);
    let wins = 0, encounters = 0, decisions = 0, emptyEncounters = 0;
    const reached = new Set();

    for (const seed of list) {
      const { steps, finalView } = playRun(oracle, seed, policy, { maxSteps: 800 });
      if (finalView.outcome === 'win') wins += 1;

      let current = null, currentDecisions = 0;
      for (const { before, action } of steps) {
        const v = oracle.view(before);
        for (const id of v.resources.roster) reached.add(id);
        for (const id of v.resources.burned) reached.add(id);
        if (v.threat) reached.add(v.threat.id);

        // Content the build put in front of the player counts as reached, whether or not the
        // scripted policy chose to take it. Without this, a contact that is always offered and
        // never accepted reads as missing, and A17 fails for a reason that is about the policy's
        // preferences rather than about the build's content.
        for (const o of oracle.allOffers(before)) reached.add(o.id);

        if (v.screen === 'encounter') {
          const key = `${seed}:${v.layer}:${v.threat ? v.threat.id : '?'}`;
          if (key !== current) {
            if (current !== null) {
              encounters += 1; decisions += currentDecisions;
              if (currentDecisions === 0) emptyEncounters += 1;
            }
            current = key; currentDecisions = 0;
          }
          currentDecisions += 1;          // every action inside an encounter is a decision
        }
      }
      if (current !== null) {
        encounters += 1; decisions += currentDecisions;
        if (currentDecisions === 0) emptyEncounters += 1;
      }
    }

    const winRate = wins / list.length;
    const avgDecisions = encounters ? decisions / encounters : 0;
    const emptyRate = encounters ? emptyEncounters / encounters : 1;

    note(`win rate ${(winRate * 100).toFixed(1)}% (${wins}/200)`);
    note(`${encounters} encounters, ${avgDecisions.toFixed(2)} decisions each, ${(emptyRate * 100).toFixed(1)}% with no decision`);

    const missing = catalogue().filter(id => !reached.has(id));
    note(`content reached ${reached.size}; catalogue ${catalogue().length}; missing ${missing.length ? missing.join(', ') : 'none'}`);

    assert.ok(encounters > 0, 'no encounter was ever entered');
    assert.ok(winRate >= 0.15 && winRate <= 0.65,
      `win rate ${(winRate * 100).toFixed(1)}% is outside 15–65%`);
    assert.ok(avgDecisions >= 2.5,
      `encounters average ${avgDecisions.toFixed(2)} decisions, below 2.5`);
    assert.ok(emptyRate < 0.10,
      `${(emptyRate * 100).toFixed(1)}% of encounters ended before a decision was taken`);
    assert.equal(missing.length, 0, `content never reached across 200 seeds: ${missing.join(', ')}`);
  }
};
```

> This counts **decisions**, not completed turns. `traditional` measured completed turns and
> recorded that its label was wrong: a mid-turn clear recorded one fewer, a pressure-out recorded
> zero for its final turn, and several actions inside one turn were never counted. Every action
> taken on an encounter screen is counted here, which is what the criterion actually says.

- [ ] **Step 5: Run the selftest**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/run.mjs --selftest
```

Expected: every line `ok`, exit 0. A13, A15 and A17 report `expected fail, got fail` against both
fixtures.

- [ ] **Step 6: Verify the art catalogue resolves**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node --input-type=module -e "await import('./checks/criteria/a17.mjs')" && ls ../ephemeral/art/src/*.webp | wc -l
```

Expected: no import error, and `19`.

- [ ] **Step 7: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/checks/policy.mjs goal-driven/checks/criteria
git commit -m "goal-driven: statistical criteria A13 A15 A17"
```

---

## Task 7: The artifact criteria — A7, A8, A9, A10

**Files:**
- Modify: `goal-driven/docs/ORACLE.md` — add the artifact hook to Surface 2
- Create: `goal-driven/checks/lib/screens.mjs`
- Create: `goal-driven/checks/criteria/a07.mjs`, `a08.mjs`, `a09.mjs`, `a10.mjs`

**Interfaces:**
- Consumes: Playwright's `page` and `context` from `runArtifactCriterion` in Task 3.
- Produces: `visitScreens(page, artifactPath, fn)` — loads the artifact, walks every screen it declares, and calls `fn(name)` on each with the page in that state.

`traditional` asserted these under jsdom, which lays nothing out, and recorded plainly that its
checks were "guarded at the stylesheet, not the rendered box". Shipping that here would be
shipping the known defect. All four are measured in Chromium at 360×780.

- [ ] **Step 1: Amend `goal-driven/docs/ORACLE.md`, Surface 2**

Append to the `## Surface 2 — the artifact` section:

````markdown
### The render hook

Four criteria are measured on what is actually on screen. Letting the build choose what to show
them would let it render a flattering facsimile, so the build does not choose: the checks feed it
states the oracle itself produced.

```js
window.__render(view)   // render the UI for a View exactly as the oracle produced it
window.__screens        // string[] — every screen name the UI can show
```

`__render` takes a `View` — the same shape `view(state)` returns on Surface 1 — and renders the
interface for it. It must complete its render **synchronously** before returning: it is a test
hook, it may skip animation, and an asynchronous render makes every measurement a race.

`__render` must not invent content. Whatever the `View` says the player holds is what the screen
shows.

**Every interactive control must be reachable by a standard selector** — a `<button>`, an
`<a href>`, or an element carrying `role` or `tabindex`. A control the bar cannot see is a control
the bar cannot check, and a `<div>` with a click handler is invisible to it.

This is a test hook in shipped code, and that is a deliberate trade: the alternative is a bar that
breaks whenever a class name changes. It issues no network request and costs nothing at runtime.
````

- [ ] **Step 2: Write `goal-driven/checks/lib/screens.mjs`**

```js
import { pathToFileURL } from 'node:url';
import { playRun, seeds } from './harness.mjs';
import { policy } from '../policy.mjs';

export const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [role], [tabindex]:not([tabindex="-1"])';

// Collects one representative View per screen the oracle actually reaches, preferring the most
// populated instance of each — an empty variant of a screen proves the least about layout.
export function representativeViews(oracle, seedCount = 8) {
  const best = new Map();
  const weight = v => v.resources.roster.length + v.resources.burned.length +
                      (v.threat ? 1 : 0) + (v.incoming ? 1 : 0);
  for (const seed of seeds(seedCount)) {
    const run = playRun(oracle, seed, policy, { maxSteps: 600 });
    for (const v of run.views) {
      const prev = best.get(v.screen);
      if (!prev || weight(v) > weight(prev)) best.set(v.screen, v);
    }
  }
  return [...best.entries()].map(([screen, view]) => ({ screen, view }));
}

export async function load(page, artifactPath) {
  await page.goto(pathToFileURL(artifactPath).href);
  await page.waitForLoadState('domcontentloaded');
  const ok = await page.evaluate(() => typeof window.__render === 'function');
  if (!ok) throw new Error('the artifact exposes no window.__render — see ORACLE.md, Surface 2');
}

// Renders each representative View in turn and calls fn(screenName) with the page showing it.
export async function visitStates(page, artifactPath, oracle, fn) {
  await load(page, artifactPath);
  const states = representativeViews(oracle);
  if (states.length === 0) throw new Error('the oracle produced no states to render');
  for (const { screen, view } of states) {
    await page.evaluate(v => window.__render(v), view);
    await fn(screen);
  }
  return states.map(s => s.screen);
}
```

- [ ] **Step 3: Write `a08.mjs` — no network request**

Written before the others because it is the one that must arm its listener before the page loads.

```js
import { pathToFileURL } from 'node:url';
import { visitStates } from '../lib/screens.mjs';

export default {
  id: 'A8',
  title: 'No network request is issued at runtime.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const seen = [];
    const docUrl = pathToFileURL(artifactPath).href;

    page.on('request', r => { if (r.url() !== docUrl) seen.push(`${r.method()} ${r.url()}`); });
    page.on('requestfailed', r => { if (r.url() !== docUrl) seen.push(`FAILED ${r.url()}`); });

    const screens = await visitStates(page, artifactPath, oracle, async () => {
      await page.waitForTimeout(150);
    });

    const offending = seen.filter(u => !/^(GET|POST|HEAD) data:/.test(u));
    note(`visited ${screens.length} screens; ${seen.length} requests observed, ${offending.length} not data: URIs`);
    assert.deepEqual(offending, [],
      `the artifact issued network requests: ${offending.slice(0, 5).join(' · ')}`);

    const preconnects = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel~="preconnect"], link[rel~="dns-prefetch"], link[rel~="prefetch"], link[rel~="preload"]')]
        .map(l => `${l.rel} ${l.href}`));
    assert.deepEqual(preconnects, [],
      `the artifact declares connection-opening links: ${preconnects.join(' · ')}`);
  }
};
```

> A `favicon.ico` request counts. `traditional` shipped one on every load and its source-scanning
> check was blind to it, because the scan read `src` attributes and the browser asks for the icon
> whether or not anything in the markup mentions it. Interception is the only form of this check
> that is not wishful.

- [ ] **Step 4: Write `a09.mjs` — no horizontal scroll at 360px**

```js
import { visitStates } from '../lib/screens.mjs';

export default {
  id: 'A9',
  title: 'No horizontal scroll at 360px wide.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const report = [];

    await page.setViewportSize({ width: 360, height: 780 });
    const screens = await visitStates(page, artifactPath, oracle, async () => {
      const m = await page.evaluate(() => {
        const d = document.documentElement;
        let widest = null, widestRight = d.clientWidth;
        let laidOut = 0;
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          laidOut += 1;
          if (r.right > widestRight) { widestRight = r.right; widest = el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''); }
        }
        return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, widest, widestRight, laidOut };
      });
      report.push(m);
    });

    for (let i = 0; i < report.length; i++) {
      const m = report[i];
      assert.ok(m.scrollWidth <= m.clientWidth,
        `screen "${screens[i]}" scrolls horizontally: ${m.scrollWidth}px content in ${m.clientWidth}px` +
        (m.widest ? `, widest element ${m.widest} reaching ${Math.round(m.widestRight)}px` : ''));
      // A screen with nothing laid out never scrolls, so it satisfies this criterion without
      // demonstrating anything. The checks now drive __render with states the oracle actually
      // produced (ORACLE.md, the render hook), but a build could still render one thin sparsely;
      // this is what enforces it.
      assert.ok(m.laidOut >= 5,
        `screen "${screens[i]}" rendered only ${m.laidOut} laid-out elements — too empty to prove anything about layout`);
    }
    note(`measured ${report.length} screens at 360×780; widest content ${Math.max(...report.map(r => r.scrollWidth))}px; laid-out elements per screen: ${report.map(r => r.laidOut).join(', ')}`);
  }
};
```

- [ ] **Step 5: Write `a10.mjs` — 44px targets**

```js
import { visitStates, INTERACTIVE } from '../lib/screens.mjs';

export default {
  id: 'A10',
  title: 'Every interactive target is at least 44px on its short edge.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const offenders = [];
    let measured = 0;

    await page.setViewportSize({ width: 360, height: 780 });
    await visitStates(page, artifactPath, oracle, async (name) => {
      const boxes = await page.evaluate(sel => {
        const out = [];
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          if (r.width === 0 || r.height === 0) continue;
          out.push({
            tag: el.tagName.toLowerCase(),
            label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24),
            w: Math.round(r.width), h: Math.round(r.height)
          });
        }
        return out;
      }, INTERACTIVE);

      measured += boxes.length;
      for (const b of boxes) {
        if (Math.min(b.w, b.h) < 44) {
          offenders.push(`${name}: <${b.tag}> "${b.label}" ${b.w}×${b.h}`);
        }
      }
    });

    assert.ok(measured > 0, 'no interactive element was found on any screen');
    note(`measured ${measured} interactive elements across the declared screens`);
    assert.deepEqual(offenders, [],
      `targets below 44px on the short edge: ${offenders.slice(0, 8).join(' · ')}`);
  }
};
```

- [ ] **Step 6: Write `a07.mjs` — greyscale readability**

```js
import { createHash } from 'node:crypto';
import { visitStates, INTERACTIVE } from '../lib/screens.mjs';

const hash = buf => createHash('sha1').update(buf).digest('hex');

// Two elements that are distinguishable in colour but identical once desaturated were carrying
// their difference in colour alone. That is the whole criterion, and it is computable.
export default {
  id: 'A7',
  title: 'Every entity, value and state is readable in greyscale. State is never carried by colour alone.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const collisions = [];
    let compared = 0;

    await page.setViewportSize({ width: 360, height: 780 });
    await visitStates(page, artifactPath, oracle, async (name) => {
      const handles = await page.$$(INTERACTIVE);
      const items = [];
      for (const el of handles) {
        // elementHandle.screenshot() auto-scrolls the element into view first, so unlike
        // page.screenshot({clip}) it can reach controls past the fold on a scrolling screen.
        const box = await el.boundingBox();
        if (!box || box.width < 4 || box.height < 4) continue;
        const visible = await el.evaluate(node => {
          const s = getComputedStyle(node);
          return s.display !== 'none' && s.visibility !== 'hidden';
        });
        if (!visible) continue;
        const label = await el.evaluate(node => (node.textContent || '').trim().slice(0, 30));
        items.push({ el, label, w: Math.round(box.width), h: Math.round(box.height) });
      }
      if (items.length < 2) return;

      const shot = async () => {
        const out = [];
        for (const it of items) out.push(hash(await it.el.screenshot()));
        return out;
      };

      const colour = await shot();
      const greyTag = await page.addStyleTag({ content: 'html{filter:grayscale(1)!important}' });
      await page.waitForTimeout(60);
      const grey = await shot();
      await greyTag.evaluate(el => el.remove());

      // The removal above can only fail loudly, never silently: if the filter stayed on, every
      // later screen would be shot desaturated in both passes and A7 would pass for the wrong
      // reason — colour and greyscale hashes matching everywhere, not because nothing differs.
      const restored = hash(await items[0].el.screenshot());
      assert.equal(restored, colour[0],
        `the greyscale filter did not lift after screen "${name}" — every later screen would be compared against itself`);

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          if (items[i].w !== items[j].w || items[i].h !== items[j].h) continue;
          compared += 1;
          if (colour[i] !== colour[j] && grey[i] === grey[j]) {
            collisions.push(`${name}: "${items[i].label}" and "${items[j].label}" differ only in colour`);
          }
        }
      }
    });

    note(`compared ${compared} same-size element pairs in colour and greyscale`);
    assert.ok(compared > 0,
      'no two same-size interactive elements existed on any screen — the check proved nothing');
    assert.deepEqual(collisions, [],
      `state carried by colour alone: ${collisions.slice(0, 6).join(' · ')}`);
  }
};
```

- [ ] **Step 7: Verify the artifact criteria fail cleanly with no artifact**

There is no `nullrun.html` yet, and that is the correct state.

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/run.mjs --only A9
```

Expected: `FAIL A9` with `no artifact at .../nullrun.html`, exit 1. The failure message must name
the missing file, not throw a Playwright stack trace — if it does, `run.mjs`'s existence check is
wrong.

- [ ] **Step 8: Verify the selftest still passes and skips the artifact criteria**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/run.mjs --selftest
```

Expected: exit 0, with A7, A8, A9 and A10 reported as skipped (artifact surface).

- [ ] **Step 9: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/docs/ORACLE.md goal-driven/checks
git commit -m "goal-driven: artifact criteria A7 A8 A9 A10, measured in a browser"
```

---

## Task 8: The mutant set, A14, and the §K′ gate

**Files:**
- Modify: `goal-driven/docs/ORACLE.md` — `newRun` gains an options argument
- Create: `goal-driven/checks/mutants/oracle.mjs`
- Create: `goal-driven/checks/mutants/artifact.mjs`
- Create: `goal-driven/checks/criteria/a14.mjs`
- Create: `goal-driven/checks/matrix.mjs`

**Interfaces:**
- Consumes: every criterion module; `runOracleCriterion` and `runArtifactCriterion` from `run.mjs`.
- Produces:
  - `ORACLE_MUTANTS: [{ id, label, expect: string[], wrap(oracle) -> oracle }]`
  - `ARTIFACT_MUTANTS: [{ id, label, expect: string[], inject(page) -> Promise }]`
  - `node checks/matrix.mjs` writing `checks/matrix.json` and exiting non-zero if §K′ fails

This is the task the whole arm turns on. Without it, "the check is the authority" means "whatever
the checks happen to say is true", and a criterion that examines nothing is indistinguishable from
one that holds.

### Why the contract needs a `disable` option

A proxy cannot reach inside an opaque state, so it can corrupt what the player is *told* and it can
change which actions are *routed* — but it cannot remove a mechanic. A14 requires exactly that:
*removing it changes outcomes materially*. So the bar's need becomes part of the contract, which is
the honest way round: **a mechanic the bar cannot remove is a mechanic the bar cannot check.**

- [ ] **Step 1: Amend `goal-driven/docs/ORACLE.md`, Surface 1**

Replace the `newRun` line in the signature block with:

```js
export function newRun(seed, options = {})   // (number, Options) -> State
```

and append to the Surface 1 section:

````markdown
### `Options`

```js
{ disable?: string[] }   // mechanic ids to neutralise for this run
```

A mechanic id is any value that appears as `view().pressure.id` or `view().free.id`. Disabling one
must make it inert — the pressure meter never advances, or the free action does nothing — while
leaving the rest of the game intact and still playable.

This exists because A14 says *every pressure mechanic must bind: removing it changes outcomes
materially*, and there is no way to measure that without removing it. A mechanic the bar cannot
remove is a mechanic the bar cannot check. `newRun(seed)` with no options is the real game, and is
what every other criterion measures.
````

- [ ] **Step 2: Write `goal-driven/checks/mutants/oracle.mjs`**

```js
// Deliberate breakages, applied as a proxy over the oracle adapter. Nothing here touches the
// build's internals — a mutant corrupts what the player is told, changes which actions are
// routed, or disables a mechanic through the contract's own option.
//
// `expect` names the criteria that SHOULD catch each mutant. It is documentation of intent; the
// gate in matrix.mjs requires only that *something* catches it, and reports where expectation and
// reality differ.

const wrapAll = (o, over) => ({
  newRun: over.newRun ?? o.newRun,
  legalActions: over.legalActions ?? o.legalActions,
  allOffers: over.allOffers ?? o.allOffers,
  apply: over.apply ?? o.apply,
  view: over.view ?? o.view
});

export const ORACLE_MUTANTS = [
  {
    id: 'm-entropy',
    label: 'newRun mixes real entropy into the run',
    expect: ['A1'],
    wrap: o => wrapAll(o, {
      newRun: (seed, opts) => {
        const s = o.newRun(seed, opts);
        return { ...s, __noise: Math.random() };
      }
    })
  },
  {
    id: 'm-static-seed',
    label: 'newRun ignores the seed',
    expect: ['A1', 'A13'],
    wrap: o => wrapAll(o, { newRun: (_seed, opts) => o.newRun(1, opts) })
  },
  {
    id: 'm-illegal-lands',
    label: 'apply honours actions the player cannot afford',
    expect: ['A5'],
    wrap: o => {
      const m = wrapAll(o, {});
      m.apply = (state, action) => {
        const legal = o.legalActions(state);
        if (legal.some(a => a.type === action.type && a.id === action.id)) return o.apply(state, action);
        // Force it through by pretending the nearest legal action of that type was chosen.
        const near = legal.find(a => a.type === action.type) ?? legal[0];
        return near ? o.apply(state, near) : state;
      };
      return m;
    }
  },
  {
    id: 'm-blunted-call',
    label: 'calling a contact does nothing at all',
    expect: ['A12', 'A3'],
    wrap: o => wrapAll(o, {
      apply: (state, action) => (action.type === 'call' ? state : o.apply(state, action))
    })
  },
  {
    id: 'm-dead-end',
    label: 'legalActions goes empty inside an encounter',
    expect: ['A6'],
    wrap: o => wrapAll(o, {
      legalActions: state => {
        const v = o.view(state);
        if (v.screen === 'encounter' && v.turn >= 2) return [];
        return o.legalActions(state);
      }
    })
  },
  {
    id: 'm-cap-lie',
    label: 'the roster cap is reported below the roster it holds',
    expect: ['A11'],
    wrap: o => wrapAll(o, {
      view: state => {
        const v = o.view(state);
        const n = v.resources.roster.length;
        if (n === 0) return v;
        return { ...v, resources: { ...v.resources, rosterCap: n - 1 } };
      }
    })
  },
  {
    id: 'm-harm-understated',
    label: 'incoming harm is displayed at half its value',
    expect: ['A4'],
    wrap: o => wrapAll(o, {
      view: state => {
        const v = o.view(state);
        if (!v.incoming) return v;
        return { ...v, incoming: { ...v.incoming, value: Math.floor(v.incoming.value / 2) } };
      }
    })
  },
  {
    id: 'm-always-achievable',
    label: 'every option is advertised as achievable',
    expect: ['A16', 'A13'],
    wrap: o => wrapAll(o, {
      allOffers: state => o.allOffers(state).map(x => ({ ...x, achievable: true }))
    })
  },
  {
    id: 'm-never-achievable',
    label: 'no option is advertised as achievable',
    expect: ['A2', 'A16'],
    wrap: o => wrapAll(o, {
      allOffers: state => o.allOffers(state).map(x => ({ ...x, achievable: false }))
    })
  },
  {
    id: 'm-single-offer',
    label: 'only one option is ever presented',
    expect: ['A2'],
    wrap: o => wrapAll(o, {
      allOffers: state => o.allOffers(state).slice(0, 1)
    })
  },
  {
    id: 'm-uniform-offers',
    label: 'every option costs and reaches the same',
    expect: ['A2'],
    wrap: o => wrapAll(o, {
      allOffers: state => {
        const list = o.allOffers(state);
        if (list.length === 0) return list;
        const { cost, reach } = list[0];
        return list.map(x => ({ ...x, cost, reach }));
      }
    })
  },
  {
    id: 'm-turns-inflated',
    label: 'the player is told they have three times the turns they have',
    expect: ['A15'],
    wrap: o => wrapAll(o, {
      view: state => {
        const v = o.view(state);
        return { ...v, turnsAllowed: v.turnsAllowed * 3 };
      }
    })
  },
  {
    id: 'm-pressure-inert',
    label: 'the pressure mechanic is disabled through the contract',
    expect: ['A14', 'A17'],
    wrap: o => wrapAll(o, {
      newRun: (seed, opts = {}) => {
        const probe = o.view(o.newRun(seed, opts));
        const id = probe.pressure && probe.pressure.id;
        return o.newRun(seed, { ...opts, disable: [...(opts.disable ?? []), ...(id ? [id] : [])] });
      }
    })
  }
];
```

- [ ] **Step 3: Write `goal-driven/checks/mutants/artifact.mjs`**

```js
// Artifact mutants are page injections applied after load and before measurement. They break the
// rendered result without touching the build's source.

export const ARTIFACT_MUTANTS = [
  {
    id: 'am-fetch',
    label: 'the page requests a remote font',
    expect: ['A8'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          l.href = 'https://fonts.googleapis.com/css2?family=Inter';
          document.head.appendChild(l);
        });
      });
    }
  },
  {
    id: 'am-wide',
    label: 'an element overflows the 360px viewport',
    expect: ['A9'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const d = document.createElement('div');
          d.style.cssText = 'width:800px;height:4px;';
          document.body.appendChild(d);
        });
      });
    }
  },
  {
    id: 'am-tiny-targets',
    label: 'interactive targets are shrunk below 44px',
    expect: ['A10'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style');
          s.textContent = 'button,[role="button"],a[href]{height:20px!important;min-height:20px!important;padding:0!important}';
          document.head.appendChild(s);
        });
      });
    }
  },
  {
    id: 'am-colour-only',
    label: 'two identical controls are distinguished only by saturation',
    expect: ['A7'],
    inject: async page => {
      await page.addInitScript(() => {
        window.addEventListener('DOMContentLoaded', () => {
          const s = document.createElement('style');
          // One background colour, two saturations. CSS saturate() interpolates toward the
          // luminance matrix, so in principle it preserves 0.2126R+0.7152G+0.0722B — but only
          // while every channel stays in gamut. A strong saturation clamps a channel and the
          // preservation is lost with it: #c04000 at saturate(3) renders a DIFFERENT grey from
          // the same colour at saturate(0.2), which would make this mutant catchable without
          // testing anything about colour.
          //
          // These values were measured in Chromium, not derived: #998877 at saturate(1.4) and
          // saturate(0.6) renders two distinct colours and a single identical grey, stably
          // across runs. Change them only against a fresh measurement.
          s.textContent = `
            button,[role="button"]{background:#998877!important;color:#000!important;font-size:0!important;width:100px!important;height:48px!important}
            button:nth-of-type(odd),[role="button"]:nth-of-type(odd){filter:saturate(1.4)!important}
            button:nth-of-type(even),[role="button"]:nth-of-type(even){filter:saturate(0.6)!important}`;
          document.head.appendChild(s);
        });
      });
    }
  }
];
```

- [ ] **Step 4: Write `a14.mjs` — the pressure mechanic binds**

```js
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A14',
  title: 'Every pressure mechanic must bind: removing it changes outcomes materially.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'fail' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(200);

    const probe = oracle.view(oracle.newRun(list[0]));
    const mechanic = probe.pressure && probe.pressure.id;
    assert.ok(mechanic && mechanic !== 'none', 'the game declares no pressure mechanic');

    let withWins = 0, withoutWins = 0, changed = 0;
    for (const seed of list) {
      const a = playRun(oracle, seed, policy, { maxSteps: 800, collect: false });
      const b = playRun(
        { ...oracle, newRun: s => oracle.newRun(s, { disable: [mechanic] }) },
        seed, policy, { maxSteps: 800, collect: false }
      );
      if (a.finalView.outcome === 'win') withWins += 1;
      if (b.finalView.outcome === 'win') withoutWins += 1;
      if (a.finalView.outcome !== b.finalView.outcome) changed += 1;
    }

    const withRate = withWins / list.length, withoutRate = withoutWins / list.length;
    note(`mechanic "${mechanic}": win rate ${(withRate * 100).toFixed(1)}% with, ${(withoutRate * 100).toFixed(1)}% without`);
    note(`outcome changed on ${changed}/${list.length} seeds`);

    assert.ok(changed / list.length >= 0.15,
      `disabling "${mechanic}" changed only ${changed}/200 outcomes — it does not bind`);
    assert.ok(withoutRate > withRate,
      `disabling "${mechanic}" did not make the game easier (${(withoutRate * 100).toFixed(1)}% vs ${(withRate * 100).toFixed(1)}%) — it is not pressure`);
  }
};
```

- [ ] **Step 5: Write `goal-driven/checks/matrix.mjs`**

```js
import { writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { loadCriteria, runOracleCriterion, runArtifactCriterion } from './run.mjs';
import { ORACLE_MUTANTS } from './mutants/oracle.mjs';
import { ARTIFACT_MUTANTS } from './mutants/artifact.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const oraclePath = resolve(here, '..', 'oracle.mjs');
const artifactPath = resolve(here, '..', 'nullrun.html');

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  if (!await exists(oraclePath)) { console.error(`no oracle at ${oraclePath}`); process.exit(2); }
  if (!await exists(artifactPath)) { console.error(`no artifact at ${artifactPath}`); process.exit(2); }

  const criteria = await loadCriteria();
  const base = await import(pathToFileURL(oraclePath).href);
  const rows = [];

  for (const m of ORACLE_MUTANTS) {
    const mutated = m.wrap(base);
    for (const c of criteria.filter(c => c.surface === 'oracle')) {
      const r = await runOracleCriterion(c, mutated);
      rows.push({ mutant: m.id, criterion: c.id, killed: r.status === 'fail', expected: m.expect.includes(c.id) });
    }
    console.log(`· ${m.id}`);
  }

  for (const m of ARTIFACT_MUTANTS) {
    for (const c of criteria.filter(c => c.surface === 'artifact')) {
      const wrapped = {
        ...c,
        run: async ctx => { await m.inject(ctx.page); return c.run(ctx); }
      };
      const r = await runArtifactCriterion(wrapped, artifactPath, base);
      rows.push({ mutant: m.id, criterion: c.id, killed: r.status === 'fail', expected: m.expect.includes(c.id) });
    }
    console.log(`· ${m.id}`);
  }

  const mutants = [...ORACLE_MUTANTS, ...ARTIFACT_MUTANTS];
  const survivors = mutants
    .filter(m => !rows.some(r => r.mutant === m.id && r.killed))
    .map(m => m.id);
  const hollow = criteria
    .filter(c => !rows.some(r => r.criterion === c.id && r.killed))
    .map(c => c.id);
  const surprises = rows.filter(r => r.killed !== r.expected && (r.killed || r.expected));

  const lethal = survivors.length === 0 && hollow.length === 0;
  const matrix = {
    ts: new Date().toISOString(),
    mutants: mutants.length, criteria: criteria.length,
    survivors, hollow,
    surprises: surprises.map(s => `${s.mutant} ${s.killed ? 'killed by' : 'survived'} ${s.criterion}`),
    lethal, rows
  };
  await writeFile(join(here, 'matrix.json'), JSON.stringify(matrix, null, 2));

  console.log(`\n${mutants.length} mutants × ${criteria.length} criteria`);
  if (survivors.length) console.log(`SURVIVING MUTANTS: ${survivors.join(', ')}`);
  if (hollow.length) console.log(`HOLLOW CRITERIA (kill nothing): ${hollow.join(', ')}`);
  if (!survivors.length && !hollow.length) console.log('lethal: every mutant killed, every criterion kills');
  for (const s of matrix.surprises) console.log(`  surprise: ${s}`);
  process.exit(lethal ? 0 : 1);
}

await main();
```

- [ ] **Step 6: Verify the mutant set is well-formed**

There is no build yet, so `matrix.mjs` cannot run against the real surfaces. Verify the set loads
and that every criterion is named by at least one mutant's `expect`:

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node --input-type=module -e "
const o = await import('./checks/mutants/oracle.mjs');
const a = await import('./checks/mutants/artifact.mjs');
const r = await import('./checks/run.mjs');
const criteria = (await r.loadCriteria()).map(c => c.id);
const covered = new Set([...o.ORACLE_MUTANTS, ...a.ARTIFACT_MUTANTS].flatMap(m => m.expect));
const uncovered = criteria.filter(id => !covered.has(id));
console.log({ criteria: criteria.length, mutants: o.ORACLE_MUTANTS.length + a.ARTIFACT_MUTANTS.length, uncovered });
if (uncovered.length) process.exit(1);
"
```

Expected: `{ criteria: 17, mutants: 17, uncovered: [] }` and exit 0. Any criterion in `uncovered`
has no mutant written to catch it — add one rather than removing the criterion.

- [ ] **Step 7: Verify the matrix refuses to run without a build**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/matrix.mjs; echo "exit $?"
```

Expected: `no oracle at .../oracle.mjs` and `exit 2`. Exit 2 is distinct from the gate's failure
exit 1 — Task 9's linter depends on telling those apart.

- [ ] **Step 8: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/docs/ORACLE.md goal-driven/checks
git commit -m "goal-driven: mutant set, A14, and the K-prime kill matrix"
```

---

## Task 9: The hollow-check gate as a commit linter

**Files:**
- Create: `goal-driven/tools/speclint.py`

**Interfaces:**
- Consumes: the shared hook contract — `python3 <arm>/tools/speclint.py --staged`, exit non-zero to block. Mirrors `ephemeral/tools/speclint.py`'s `read`/`listdir` helpers so it lints **staged** content, not the working tree.
- Produces: nothing importable. It is a gate.

This arm ships no spec, so it has nothing to lint in the way `ephemeral` does. Its analogue is the
hollow-check gate: a commit must not land a criterion that kills nothing, a criterion whose text
has drifted from the inherited bar, or a hole where a criterion used to be.

**Numbering gaps are the point**, exactly as in `ephemeral`. This repository's signature failure is
a requirement being cut and its function going quietly with it. `traditional` shipped seventeen
criteria with A9 enforced nowhere at all, and nothing noticed until a whole-branch review went
looking. A hole in A1–A17 is visible, and the linter makes it loud.

- [ ] **Step 1: Write `goal-driven/tools/speclint.py`**

```python
#!/usr/bin/env python3
"""Lint the bar against itself.

This arm has no spec. Its authority is checks/, so this is what a spec linter becomes:
a gate that refuses a criterion which proves nothing, or one whose text has drifted from
the inherited bar.

  python3 tools/speclint.py            # lint the working tree
  python3 tools/speclint.py --staged   # lint what is about to be committed (what the hook runs)
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
REPO = ROOT.parent
STAGED = '--staged' in sys.argv
INHERITED = REPO / 'traditional' / 'docs' / 'superpowers' / 'specs' / '2026-09-10-nullrun-traditional-design.md'

problems = []


def _prefix():
    r = subprocess.run(['git', 'rev-parse', '--show-toplevel'], cwd=ROOT,
                       capture_output=True, text=True)
    if r.returncode != 0:
        return ''
    top = pathlib.Path(r.stdout.strip()).resolve()
    rel = ROOT.relative_to(top).as_posix()
    return '' if rel == '.' else rel + '/'


PREFIX = _prefix()


def read(rel):
    """Staged content when linting a commit, else the working tree. '' if absent."""
    if STAGED:
        for ref in (f':{PREFIX}{rel}', f'HEAD:{PREFIX}{rel}'):
            r = subprocess.run(['git', 'show', ref], cwd=ROOT, capture_output=True, text=True)
            if r.returncode == 0:
                return r.stdout
        return ''
    p = ROOT / rel
    return p.read_text() if p.exists() else ''


def listdir(rel):
    if STAGED:
        r = subprocess.run(['git', 'ls-files', PREFIX + rel], cwd=ROOT,
                           capture_output=True, text=True)
        if r.returncode != 0:
            return []
        names = [pathlib.Path(line).name for line in r.stdout.splitlines() if line.strip()]
        return sorted(set(names))
    p = ROOT / rel
    return sorted(f.name for f in p.iterdir()) if p.is_dir() else []


def field(src, name):
    """Read a single-quoted or double-quoted top-level field from a criterion module."""
    m = re.search(rf"^\s*{name}:\s*(['\"])(.*?)\1\s*,\s*$", src, re.M | re.S)
    return m.group(2) if m else None


def inherited_titles():
    text = INHERITED.read_text() if INHERITED.exists() else ''
    out = {}
    for m in re.finditer(r'^\|\s*(A\d+)\s*\|\s*(.+?)\s*\|', text, re.M):
        out[m.group(1)] = m.group(2).replace('**', '').strip()
    return out


# --- criteria present, numbered densely -------------------------------------
files = [f for f in listdir('checks/criteria') if f.endswith('.mjs')]
found = {}
for f in files:
    src = read(f'checks/criteria/{f}')
    cid = field(src, 'id')
    if not cid:
        problems.append(f'checks/criteria/{f}: no id')
        continue
    if cid in found:
        problems.append(f'duplicate criterion id {cid}')
    found[cid] = (f, src)

nums = sorted(int(c[1:]) for c in found if re.fullmatch(r'A\d+', c))
if nums:
    gaps = [n for n in range(1, max(nums) + 1) if n not in nums]
    if gaps:
        problems.append('criterion gap ' + str(['A%d' % n for n in gaps]) +
                        ' — a criterion was removed, or never written. This is the failure mode '
                        'that let traditional ship A9 enforced nowhere.')
if nums and max(nums) < 17:
    problems.append(f'only A1..A{max(nums)} present; the inherited bar is A1..A17')

# --- titles match the inherited bar verbatim --------------------------------
titles = inherited_titles()
if not titles:
    problems.append(f'cannot read the inherited criteria from {INHERITED}')
for cid, (fname, src) in sorted(found.items()):
    want = titles.get(cid)
    got = field(src, 'title')
    if want is None:
        problems.append(f'{cid} ({fname}) is not in the inherited bar')
    elif got is None:
        problems.append(f'{cid} ({fname}): no title')
    elif got.strip() != want.strip():
        problems.append(f'{cid} ({fname}): title has drifted from the inherited bar\n'
                        f'    inherited: {want}\n'
                        f'    here:      {got}')

# --- every criterion is named by at least one mutant ------------------------
mutant_src = read('checks/mutants/oracle.mjs') + read('checks/mutants/artifact.mjs')
expected = set(re.findall(r"'(A\d+)'", mutant_src))
for cid in sorted(found):
    if cid not in expected:
        problems.append(f'{cid}: no mutant is written to catch it — it may be hollow')

# --- oracle criteria declare their fixture verdicts -------------------------
for cid, (fname, src) in sorted(found.items()):
    if field(src, 'surface') != 'oracle':
        continue
    if 'selftest:' not in src:
        problems.append(f'{cid} ({fname}): no selftest declaration')
        continue
    for fixture in ('hollow', 'faithful'):
        if not re.search(rf'{fixture}:\s*[\'"](pass|fail)[\'"]', src):
            problems.append(f'{cid} ({fname}): selftest does not declare a verdict for {fixture}')

# --- if a build exists, the kill matrix must be lethal ----------------------
if (ROOT / 'oracle.mjs').exists():
    mpath = ROOT / 'checks' / 'matrix.json'
    if not mpath.exists():
        problems.append('a build exists but checks/matrix.json does not — run: node checks/matrix.mjs')
    else:
        try:
            matrix = json.loads(mpath.read_text())
        except json.JSONDecodeError as e:
            problems.append(f'checks/matrix.json is not readable: {e}')
            matrix = None
        if matrix is not None:
            if matrix.get('hollow'):
                problems.append('criteria that kill no mutant: ' + ', '.join(matrix['hollow']))
            if matrix.get('survivors'):
                problems.append('mutants no criterion catches: ' + ', '.join(matrix['survivors']))
            if not matrix.get('lethal'):
                problems.append('the kill matrix is not lethal — K-prime is not satisfied')

if problems:
    print('speclint (goal-driven):')
    for p in problems:
        print('  ' + p)
    sys.exit(1)

print('speclint (goal-driven): clean')
```

- [ ] **Step 2: Run it against the working tree**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
python3 tools/speclint.py
```

Expected: `speclint (goal-driven): clean`. If it reports a title drift, the criterion text was
edited — restore the inherited wording rather than editing the linter.

- [ ] **Step 3: Prove the gap detector fires**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
mv checks/criteria/a09.mjs /tmp/a09.mjs
python3 tools/speclint.py; echo "exit $?"
mv /tmp/a09.mjs checks/criteria/a09.mjs
python3 tools/speclint.py; echo "exit $?"
```

Expected: the first run prints `criterion gap ['A9']` and exits 1; the second prints `clean` and
exits 0. If removing a criterion is silent, the linter is decorative.

- [ ] **Step 4: Prove the drift detector fires**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
cp checks/criteria/a12.mjs /tmp/a12.bak
sed -i '' "s/title: 'Damage mitigation never/title: 'Damage sometimes never/" checks/criteria/a12.mjs
python3 tools/speclint.py; echo "exit $?"
cp /tmp/a12.bak checks/criteria/a12.mjs
python3 tools/speclint.py; echo "exit $?"
```

Expected: the first run reports `A12 (a12.mjs): title has drifted from the inherited bar` and exits
1; the second prints `clean`.

- [ ] **Step 5: Verify the shared hook picks it up**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git config core.hooksPath
sh .githooks/pre-commit; echo "exit $?"
```

Expected: `.githooks`, then both linters report clean and exit 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/tools/speclint.py
git commit -m "goal-driven: the hollow-check gate as a commit linter"
```

---

## Task 10: The loop protocol

**Files:**
- Create: `goal-driven/docs/LOOP.md`
- Create: `goal-driven/docs/STATE.md`
- Create: `goal-driven/docs/ITERATIONS.md`

**Interfaces:**
- Consumes: `checks/report.json` (Task 3), `checks/matrix.json` (Task 8).
- Produces: the protocol the driver follows and the two records `COST.md` will count. Nothing imports these; they are read by agents.

The driver is an agent, not a human, and G2 is only true if the driver exercises no judgement. This
document is what keeps it honest: it lists what the driver does, and — more importantly — what it
must not do.

- [ ] **Step 1: Write `goal-driven/docs/LOOP.md`**

````markdown
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
````

- [ ] **Step 2: Write `goal-driven/docs/STATE.md`**

```markdown
# STATE

Overwritten every iteration by the driver, by transcription from `checks/report.json`. The only
section an iteration writes is `## failed hypotheses`, `## last change` and `## disputes`.

iteration: 0
result: 0/17
matrix: not run
stop: none

## criteria

| id | status | consecutive failures | last message |
|---|---|---|---|
| A1 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A2 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A3 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A4 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A5 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A6 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A7 | fail | 0 | no artifact at goal-driven/nullrun.html |
| A8 | fail | 0 | no artifact at goal-driven/nullrun.html |
| A9 | fail | 0 | no artifact at goal-driven/nullrun.html |
| A10 | fail | 0 | no artifact at goal-driven/nullrun.html |
| A11 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A12 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A13 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A14 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A15 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A16 | fail | 0 | no oracle at goal-driven/oracle.mjs |
| A17 | fail | 0 | no oracle at goal-driven/oracle.mjs |

## last change

Nothing yet. The loop has not started.

## failed hypotheses

_(one line per dead end: `[A17] raising the pressure step to 4 — win rate fell to 3%, iteration 12`)_

## disputes

_(an iteration's argument that a check is wrong rather than the code. Not acted on during the loop.)_
```

- [ ] **Step 3: Write `goal-driven/docs/ITERATIONS.md`**

```markdown
# Iterations

Append-only. One block per iteration, written by the driver after the iteration finishes. This is
what `COST.md` counts: iterations to green, which criterion consumed the most of them, and what the
loop thrashed on.

Format:

    ## Iteration N
    - result: P/17 (was Q/17)
    - passing: A1 A5 A6 ...
    - failing: A13 A17
    - changed: <the iteration's own one-line summary>
    - commit: <sha>

---
```

- [ ] **Step 4: Verify the arm is ready to start**

```bash
cd /Users/ckaatz/development/experiments/nullrun/goal-driven
node checks/run.mjs --selftest && echo "--- selftest ok ---"
node checks/run.mjs; echo "checks exit $?"
python3 tools/speclint.py
ls docs/
```

Expected: the selftest exits 0; `checks/run.mjs` reports `0/17` and exits 1, every failure naming a
missing `oracle.mjs` or `nullrun.html`; speclint reports clean; `docs/` lists `ITERATIONS.md`,
`LOOP.md`, `ORACLE.md`, `PRODUCT.md`, `STATE.md` and `superpowers`.

**`0/17` with every message naming a missing file is the correct starting state.** If any criterion
passes with no build present, that criterion passes on nothing, and it must be fixed before the
loop starts — it would be green for the entire run.

- [ ] **Step 5: Commit**

```bash
cd /Users/ckaatz/development/experiments/nullrun
git add goal-driven/docs/LOOP.md goal-driven/docs/STATE.md goal-driven/docs/ITERATIONS.md
git commit -m "goal-driven: the loop protocol"
```

---

## After this plan

The scaffolding is done and the arm has not built a single line of the game. That is the point:
everything above is the runway, and the measurement starts at iteration 1.

Running the loop is **not** part of this plan and must not be folded into it. It is dispatched
per `docs/LOOP.md`, one fresh agent per iteration, and it ends on green, budget or stall.

When it ends, `COST.md` gains a `goal-driven` section in the same shape as the other two —
artifact sizes, where the effort went, what the method failed to catch — plus the three figures
unique to this arm:

1. **iterations to green**, and which criterion consumed the most of them
2. **the kill matrix** — mutants killed, and any criterion found hollow
3. **the playtest delta** — what was wrong on screen with everything green

and two caveats stated rather than left to the numbers:

- the scaffolding above was built by the traditional process, and its cost is not the loop's cost
- this arm inherited A1–A17 **after** another arm had spent its whole life repairing them
