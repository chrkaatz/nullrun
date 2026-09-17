# STATE

Overwritten every iteration by the driver, by transcription from `checks/report.json`. The only
sections an iteration writes are `## failed hypotheses`, `## last change` and `## disputes`.

iteration: 2
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
| A13 | pass | 0 | 1 |  |
| A14 | pass | 0 | 2 |  |
| A15 | pass | 0 | 1 |  |
| A16 | pass | 0 | 1 |  |
| A17 | pass | 0 | 4 |  |

## last change

A human playtest found that five of the nineteen shared art tiles (`archon`, `cold`, `hunter`,
`sweep`, `wall`) are places, not people — a server hall, a wall, a sweep, a hunter-killer, an
archon — and the roster, the only place in the build that used names, had been drawing from all
nineteen. `oracle.mjs` now splits the catalogue into `CONSTRUCT_IDS` (those five) and contacts
(the other fourteen): the roster and its replenishment draw from contacts only, and each offer and
threat is named after the construct standing at that layer and tier (`constructFor(seed, layer,
tier)`, a deterministic hash draw over the five, mirroring how `computeOffers` already drew tiers).

Removing five names from the contact pool cut total available call damage from 105 (all nineteen)
to 74 (fourteen), against eight layers whose soft tier alone needs 11 reach each — every run lost,
every criterion measuring viability failed (A13, A14, A16, A17), all at a 0% win rate. Re-tuning
the fourteen contacts' `power` values (`CATALOG`) back up, without touching `TIERS`, `LAYER_COUNT`,
`PRESSURE_MAX`, pace, `START_ROSTER_SIZE` or the free action, restored 17/17: a bimodal spread
(five contacts held near their original value, nine raised) landed a 40% win rate with a real,
rescuable pressure dependency (A14: 40% with the trace mechanic active, 65% with it disabled — see
below for why that specific shape was necessary, not just "more power").

Investigating why several tunings passed A17 but left A14 flat (0% of outcomes changed by
disabling the pressure mechanic) surfaced the actual mechanism behind A14: a run only ever loses
by the `onward`-time "nothing achievable" gate (`capacityDamage` across every tier `< reach`),
never by hitting the pressure ceiling mid-encounter, because that gate uses the same formula the
encounter itself is bound by — if it says achievable, the encounter can always be finished within
budget. Disabling pressure can only rescue a loss at that gate by inflating the free action's
`turnsAllowed`-scaled contribution (pinned to the mechanic's dormant value, 8, instead of whatever
budget remains); by A15's own margin (reach 11 must exceed free-alone's max total of 8), that
rescue is arithmetically possible only when the roster at the gate is non-empty (`>= 1` contact
left), never when it has hit exactly zero. So A14 sensitivity requires runs to end their pool
mid-strand — one or two contacts short — rather than exactly used up, and that split turned out to
be a narrow function of total contact power: small integer changes (+1 to one contact's `power`,
or dropping `soft.reach` from 11 to 12) swung the 200-seed win rate by 20-60 points, because the
whole system is discrete thresholds compounding across eight layers. Tuning by search (adjusting
one or two `power` values at a time, rerunning `node checks/run.mjs`) rather than by formula was
what converged.

Mirroring the split into `nullrun.html` (`CONSTRUCT_IDS`/`CONTACTS`, `constructFor`, the roster
build, the `take`/`payout` handlers, the offer label) and adding a threat portrait to the
`encounter` screen (previously the target showed only text, never a face) broke A7: the added
portrait row pushed the `encounter` screen's rendered height from 780px to 828px at 360×780,
making it vertically scrollable for the first time. `elementHandle.screenshot()` auto-scrolls its
target into view before capturing, and the two auto-scrolls A7 performs around its colour/greyscale
round-trip landed at very slightly different sub-pixel offsets, producing a real (not flaky — fully
reproducible, same two hashes every run) pixel difference in an element that never changed CSS
property between the two shots. Fixed by making `portrait(id, size)` size itself inline instead of
depending on a `.contact`-ancestor CSS rule, and rendering the threat portrait small (20px) inline
in the target's existing stat-row rather than as a new row, which brings the screen back to exactly
780px and off the scroll boundary. (A spent GPU-decode-warm-up detour — preloading every portrait
as an `Image()`, then as an off-screen but painted DOM box — changed nothing, because the actual
cause was never decode timing.)

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
- [A13/A14/A16/A17] After splitting constructs out of the contact pool (19 → 14 names), leaving
  `CATALOG` power values, `TIERS`, `START_ROSTER_SIZE` and the pressure budget unchanged — every
  seed lost, all at layer 6, roster driven to exactly zero; total available call damage (74) was
  below what eight layers of soft alone need (88), so no tuning of play could have won, iteration 2.
- [A17] Raising all fourteen contacts' `power` uniformly high (avg ~9, so any single call nearly
  or fully cleared the softest tier) — win rate hit 100% and average decisions per encounter fell
  to ~1.8 (below A17's 2.5 floor), since most encounters resolved in one action, iteration 2.
- [A14] Total contact power tuned to reliably land a 15-65% win rate (avg ~6.3-7.1, uniform spread)
  still measured 0% A14 sensitivity — every loss came from the roster hitting exactly zero contacts
  at the `onward` gate, and by A15's own margin a fully empty roster can never be rescued by
  disabling the pressure mechanic (free alone always falls short of reach, disabled or not), so win
  rate alone does not imply the pressure mechanic binds, iteration 2.
- [A17] Reducing `START_ROSTER_SIZE` from 9 to 8 to raise difficulty (intending "fewer starting
  contacts, harder run") instead raised the win rate (61.5% → 67.5%) — more of the run's total
  contact budget arrived via the steadier one-per-layer replenishment trickle instead of being
  front-loaded and burned early, smoothing out the late-run scarcity that was driving losses,
  iteration 2.
- [A17] Raising `TIERS.soft.reach` from 11 to 12 with contact power otherwise unchanged (at a
  tuning that had given 64.5% win rate at reach 11) collapsed the win rate to 0% — the system's
  outcome is a discrete threshold compounded across eight layers, not a smooth function of reach,
  so single-unit reach changes are far more destructive than similarly-sized power changes,
  iteration 2.

## disputes

_(an iteration's argument that a check is wrong rather than the code. Not acted on during the loop.)_
