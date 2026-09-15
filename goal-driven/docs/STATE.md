# STATE

Overwritten every iteration by the driver, by transcription from `checks/report.json`. The only
sections an iteration writes are `## failed hypotheses`, `## last change` and `## disputes`.

iteration: 1
result: 17/17
matrix: lethal
stop: green

## criteria

| id | status | consecutive failures | hypotheses recorded | last message |
|---|---|---|---|---|
| A1 | pass | 0 | 0 |  |
| A2 | pass | 0 | 2 |  |
| A3 | pass | 0 | 0 |  |
| A4 | pass | 0 | 0 |  |
| A5 | pass | 0 | 0 |  |
| A6 | pass | 0 | 0 |  |
| A7 | pass | 0 | 0 |  |
| A8 | pass | 0 | 0 |  |
| A9 | pass | 0 | 0 |  |
| A10 | pass | 0 | 0 |  |
| A11 | pass | 0 | 0 |  |
| A12 | pass | 0 | 0 |  |
| A13 | pass | 0 | 0 |  |
| A14 | pass | 0 | 0 |  |
| A15 | pass | 0 | 1 |  |
| A16 | pass | 0 | 1 |  |
| A17 | pass | 0 | 0 |  |

## last change

Wrote the first `oracle.mjs` and `nullrun.html` from scratch: an 8-layer run where each layer
offers a soft/med/hard target (priced in credits, sized in "integrity") that a turn-based
encounter clears by calling roster contacts (each burned for the rest of the run) and one free
action per turn, against a single run-long trace meter that only advances on ending a turn. The
central design problem was that A2 ("some offer is always achievable") and A15 ("free alone never
clears the softest node") are only jointly satisfiable if the roster can never hit zero with
layers still ahead — solved by replenishing one roster slot on every `onward` from payout (the one
step A3 doesn't restrict from adding a roster id) and by ending a doomed run at that same
`onward`, before an all-unachievable 'offers' screen is ever shown, rather than presenting a fake
choice. Tuning (roster size 9, soft reach 11, pressure budget 80 over a flat pace of 10) landed a
23% win rate. The artifact is a single self-contained HTML file duplicating the oracle's rules in
plain JS (importing the module would itself be a network-adjacent request under A8), with the 19
portraits inlined as base64 from `../ephemeral/art/src/`. `node checks/run.mjs`: 17/17.

`node checks/matrix.mjs` was not lethal on the first pass: the `am-colour-only` mutant survived
against A7, and A7 killed nothing else in the battery. Diffing the two compared buttons' per-pixel
PNGs (via ImageMagick, `compare -metric AE`) showed only ~25 of 4800 pixels differing, all at the
button's rounded corners, by 1/255 of brightness — anti-aliasing on `border-radius`, whose
rasterisation depends on the element's absolute Y position, not colour. Two buttons at different Y
offsets never hashed identically even when genuinely identical in every CSS property, which is what
let earlier state-carried-by-colour bugs (differing `border-color` on `.primary`/`.danger`, and
child spans with fixed-px `font-size` surviving the mutant's `font-size:0`) hide behind a check that
could never register a match to compare against in the first place. Fixed by removing
`border-radius` from buttons (eliminating the position-dependent antialiasing) and switching
`.btn-title`/`.btn-meta` to `em` sizing (so a parent `font-size:0` actually zeroes them) — the
matrix is now lethal: every mutant killed, every criterion kills.

## failed hypotheses

- [A13/A17] Starting roster at the full 19-name catalogue with headroom to recruit more — win rate
  100%, zero seed-to-seed variance (every run starts with the same contact set), iteration 1.
- [A2] Partial starting roster (14-19) with no replenishment mechanism — the competent policy
  (`checks/policy.mjs`) never recruits voluntarily (its score weights `layer * 10000` far above any
  roster-size term, so `onward` always beats `take`), so roster only shrinks; runs long enough to
  need most layers reach an 'offers' screen with nothing achievable, iteration 1.
- [A15] Capping calls at one per encounter (to make consumption match a one-per-layer replenish
  rate exactly) — any leftover integrity below what one call+one free clears needs a full extra
  turn to grind out via free alone, and each such turn costs the full per-turn pace regardless of
  how little integrity remains; this "quantization tax" burned the pressure budget far faster than
  multi-call clears ever did, iteration 1.
- [A2/A15] Reserving the run's last roster member from ever being called while layers remain (a
  floor of 1) — `capacityDamage` then has to exclude that reserved member too, which leaves exactly
  the free-alone contribution A15 forbids relying on, so the floor didn't avoid the conflict, it
  just relocated it to roster-length-1 instead of roster-length-0, iteration 1.
- [A2] Keeping med/hard tiers priced and reached close to soft, to limit how much extra roster a
  greedy "take the hardest affordable" policy could burn — kept the run almost as safe as soft-only
  play, but also kept win rate near 100%, iteration 1.
- [A16] Med/hard tiers cheap (cost ~5) but reached far above soft (17+), to force some legal-but-
  unachievable offers for A16 to validate — the greedy policy always prefers the highest-reach
  affordable option regardless of how costly it is in roster/pressure, so cheap-and-hard tiers got
  taken constantly and win rate collapsed to 0%, iteration 1.

## disputes

_(an iteration's argument that a check is wrong rather than the code. Not acted on during the loop.)_
