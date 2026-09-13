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

### The screen hook

Four criteria have to be measured on every screen, and clicking a path to each one would make the
bar depend on the build's selectors. The artifact therefore exposes two globals:

```js
window.__screens          // string[] — every screen name the UI can show
window.__goto(name)       // put the UI into a representative, populated state for that screen
```

`__goto` must produce a state a player could actually reach — populated lists, a live encounter,
real values. A screen rendered empty passes A9 and A10 for the wrong reason.

This is a test hook in shipped code, and that is a deliberate trade: the alternative is a bar that
breaks whenever a class name changes. It issues no network request and costs nothing at runtime.

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
