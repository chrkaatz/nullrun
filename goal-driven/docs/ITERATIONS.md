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
