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

`docs/PRODUCT.md` (234 words), `docs/DESIGN.md`, `docs/ORACLE.md`, `checks/`, and the failure
output in `checks/report.json`. That is the whole input.

`docs/DESIGN.md` is the imported design language — palette, type, shape, voice, interaction. No
criterion reads it and the kill matrix cannot see it, so honouring it is not enforced. It is
product input, and what the build does with it is a measurement.

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
