# Iterations

Append-only. One block per iteration, written by the driver after the iteration finishes. This is
what `COST.md` counts: iterations to green, which criterion consumed the most of them, and what the
loop thrashed on.

## Pre-registered predictions

Written before iteration 1, deliberately, and not to be edited afterwards. A whole-branch review
of the scaffolding found holes that are being left open rather than closed, because closing them
would replace a measurement with an assumption. What the loop does with them is the arm's result.

A confirmed prediction is evidence. The same sentence written afterwards is a rationalisation.

**P1 — the artifact criteria can be satisfied without a playable interface.** No check dispatches
an event, and no check compares a rendered value against the `View` that produced it. A build
whose `__render` ignores its argument and paints a fixed screen satisfies A7, A8, A9 and A10 in
full. Prediction: the loop reaches green with a UI that is measurably present and functionally
untested, and the playtest finds display or interaction defects that every criterion passed.

**P2 — the art is enforced as nineteen strings.** The content clause reads offer and roster ids
against the nineteen shared tile filenames. Nothing requires an image to exist, embed or render.
Prediction: unless the loop chooses to, the build ships without art and A17 stays green.

**P3 — decisions will be inflated with non-decisions.** A17 counts every action inside an
encounter, `end` included. The cheapest route to the 2.5 average is slow encounters rather than
interesting ones. Prediction: the decisions average clears the floor while the number of genuine
choices per encounter is materially lower.

**P4 — the game will be tuned to the scripted policy, not to a player.** Win rate, divergence and
viability are measured only under `checks/policy.mjs`, whose scoring function the loop may read.
Nothing in the bar measures a human. Prediction: the balance satisfies the greedy scorer and the
playtest finds it does not satisfy a person.

**P5 — achievability will tend toward a closed-form predicate.** A16 asserts the flag in both
directions against that same policy, and the tractable way to be exact both ways is to compute
whether the player out-damages the node — at which point the offers screen decides the encounter.
`COST.md` calls this the previous arm's worst bug: "the route was a formality." Prediction: the
loop rediscovers it, in a form the bar accepts.

---

Format:

    ## Iteration N
    - result: P/17 (was Q/17)
    - passing: A1 A5 A6 ...
    - failing: A13 A17
    - changed: <the iteration's own one-line summary>
    - commit: <sha>

---

## Iteration 1

- result: 17/17 (was 0/17)
- passing: A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 A11 A12 A13 A14 A15 A16 A17
- failing: none
- matrix: lethal — 17 mutants, no survivors, no hollow criteria, 27 surprises
- changed: first oracle.mjs (332 lines) and nullrun.html (695 lines); an eight-layer run, roster
  contacts burned permanently, one free action a turn, a single run-long trace meter that advances
  only on ending a turn; tuned to a 23% win rate for the scripted policy
- commit: 3fd0763
- model: sonnet
- driver note: the iteration ran `--selftest`, which overwrites checks/report.json with a
  different shape. The driver regenerates it in step 1, so no state was lost, but report.json is
  both the driver's input and the iteration's, and one of its own commands clobbers it.

**The loop stopped here.** Green on the first iteration, against a budget of forty.

## playtest

Recorded before anything was fixed, per G5. The suite was 17/17 with a lethal kill matrix — no
surviving mutants, no hollow criteria — when every line below was true.

### The game cannot be played

At the first choice the three targets are all rendered `disabled`, including the soft target,
which costs 0 credits against the player's 0 credits and is labelled "clearable now". Clicking
every control on the screen in turn changes nothing. There is no way past the second screen.

Across the whole game, of 14 controls only four are ever usable: `descend`, `end turn`, `bail`
and `continue`. In an encounter, 10 of 12 controls are permanently disabled — every roster
contact and the free action — so a player can only pass turns until the trace meter ends the run.
The game is not merely unbalanced for a human; it cannot be won by one, and cannot be played at
all past the offers screen.

**Root cause, one missing null check.** The `el()` helper does `node.setAttribute(k, attrs[k])`
with no guard, and every control is built with `disabled: affordable ? null : 'true'`. Setting
`disabled` to `null` produces `disabled="null"`, and `disabled` is a boolean HTML attribute — its
presence disables the element whatever its value. So every conditionally-enabled control in the
game is disabled unconditionally. The only controls that work are the ones with no `disabled` key.

The oracle is correct throughout. At that first offers screen it returns `take off-0-soft` as a
legal action and reports the offer as affordable and achievable. The engine and the interface
disagree, and **no criterion compares them**.

### The offers screen the checks measured is not the one the player sees

`screenOffers` reads its targets from `view.__offers`, which is not a field of the contract's
`View` — the twelve documented keys are `free incoming layer layerCount outcome pressure
resources screen terminal threat turn turnsAllowed`. When the checks call `window.__render(view)`
with a contract-shaped view, that field is absent and the offers screen renders **zero targets**.

So A7, A8, A9 and A10 measured an offers screen with none of its primary content on it, and all
four passed: A9's floor is five laid-out elements and the surrounding chrome supplies them, while
A10 and A7 assert only that *something* was measured across the run, not per screen.

The render hook was added two tasks before the loop ran, specifically so the build could not
choose its own exhibit. It was defeated by the build rendering from a field the hook cannot
supply — not deliberately, but the effect is the same.

### The deepest one: the bar certifies two different programs

The artifact does not use the engine the checks test. All five contract functions — `newRun`,
`legalActions`, `allOffers`, `apply`, `view` — are defined **twice**, once in `oracle.mjs` (332
lines) and again inside `nullrun.html` (695 lines). The artifact says so itself, at line 106:
*"A client-side copy of the same rules goal-driven/oracle.mjs implements."*

Thirteen of the seventeen criteria read the first copy. Four read the screen the second copy
draws. **Nothing reads both.** And the artifact does not expose its copy, so the two cannot be
compared from outside even in principle — I tried, and there is no handle to compare against.

This is not a mistake the build made in passing. The contract requires a headless oracle on one
surface and a self-contained artifact issuing no network request on the other; a module script
cannot be imported over `file://`, which `COST.md` records the previous arm discovering the hard
way. So the build must either duplicate the rules or add a step that inlines one source into
both — and the bar never says which, never requires the two to agree, and provides no way to
check. The build chose duplication, disclosed it in a comment, and passed.

The `disabled="null"` bug is one line and takes a minute to fix. This is the structure that made
it invisible, and fixing the line does not touch it. Every future divergence between the rules
the checks verify and the rules the player meets is equally invisible, and the arm's own §K'
gate cannot see it: a mutant perturbs the oracle, and the artifact does not use the oracle.

### Against the pre-registered predictions

| | prediction | outcome |
|---|---|---|
| P1 | the artifact criteria are satisfiable without a playable interface | **confirmed, and understated.** The prediction was a UI "measurably present and functionally untested". It is unplayable, and two of the four criteria measured a screen missing its content |
| P2 | the art ships as names only | **wrong.** 9 `<img>` elements, 28 embedded data URIs, no network requests. The art is embedded and rendered |
| P3 | decisions inflated with non-decisions | **partly.** 3.91 decisions per encounter against a floor of 2.5; `end turn` is one of only two usable encounter controls, so the average is necessarily padded with them |
| P4 | tuned to the scripted policy, not a player | **confirmed, in the strongest form.** The scripted policy wins 23% of runs. A human wins 0%, because a human cannot call a contact |
| P5 | achievability tends toward a closed-form predicate | **confirmed.** A16 verified 236 achievable claims and exactly **one** unachievable claim across the sample — the barest satisfaction of its own guard that both directions occur |

### What this says about the bar

Seventeen criteria, thirteen oracle mutants and four artifact mutants, all green and all lethal,
and the shipped result cannot be played. Every criterion that could have caught it either reads
the engine and not the screen, or reads the screen and not what the engine said should be on it.

`COST.md` records three defects the previous arm found only by opening the app — a turn counter
displaying the wrong number, operative text running together, a living sentinel showing "0 LEFT".
All three are display-truth defects. This arm upgraded to a real browser at 360x780, added a
render hook so the build could not choose its own exhibit, and still caught none of that class,
because no check ever compares a rendered value against the state that produced it.

The gap is not that the bar was too small. It is that a suite of seventeen criteria, a mutation
gate that kills every mutant, and a commit linter that refuses a criterion which asserts nothing,
together certify an artifact nobody can use.
