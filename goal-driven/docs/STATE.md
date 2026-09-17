# STATE

Overwritten every iteration by the driver, by transcription from `checks/report.json`. The only
sections an iteration writes are `## failed hypotheses`, `## last change` and `## disputes`.

iteration: 3
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

Adopted docs/DESIGN.md's look and voice in `nullrun.html`. No criterion reads that document and
none of this touches `oracle.mjs`, `CATALOG`, `TIERS`, `LAYER_COUNT`, `START_ROSTER_SIZE`, the
trace ceiling or the free action's value — `node checks/run.mjs`: 17/17 before and after,
`node checks/matrix.mjs`: lethal before and after (the button-radius constraint below was the one
change with any real risk to the matrix, and it was re-verified after).

**Adopted, mechanically:** the three semantic tokens, applied strictly to what they name and
nothing else — `--you` (roster/ram/credits card bands, chips and lrows, the free action) never
touches `--world` (the trace meter, the threat's `integrity` chip, a construct's tag) or `--harm`
(the `incoming`-this-turn chip, the only place it appears). System sans for prose and titles, mono
reserved for kickers, chips, lrows, meter labels, the feed line and the keys line, replacing the
previous iteration's all-monospace page. The bordered 430px column with a persistent top bar
(`ZAIBATSU CONSOLE` left, `LAYER n OF m` right — see below), 13px screen gaps, `20px 18px 24px`
screen padding, and the radius steps (panels 16px, portraits 14px, non-button cards 12px,
chips/meters 99px). New components: `chip`, `lrow` (the resource panel is now colour-railed rows,
not bare stat lines), `node` (offer buttons), a real `card` (role band, portrait, name, effect
sentence — replacing the bare portrait-and-two-stats tile), `dash` (one, on loadout, stating
PRODUCT.md's own pillar-1 line), and a `keys` line. Screen-change rise animation (`8px`/`.28s`),
switched off under `prefers-reduced-motion`; nothing else moves except the trace meter, which now
only pulses past 85% of its ceiling. Voice: all six of DESIGN.md's own example lines are in use,
one per screen/outcome ("Who are you taking in?" loadout, "Choose your way down." offers, "Someone
has to go." encounter, "Node is yours." payout, "The arcology goes quiet." win, "You got out with
less than you brought." loss) — none invented, all lifted verbatim because the fit was exact.
Below 380px the roster grid drops from three cards to two, per DESIGN.md's own breakpoint; at the
real 360px test width this is always in effect, and the extra per-card width is what made room for
a role band and an effect sentence that the previous iteration's three-per-row, 58px card had no
space for (see "A second human playtest" below) — adopting the breakpoint solved a problem the
prior iteration recorded as unsolved, for free.

**Content added, and where:** a fixed id -> role lookup (`ROLE` in `nullrun.html`, one of
DESIGN.md's twelve role names per contact, two repeated since there are fourteen contacts) and a
templated flat sentence of effect (`${ROLE}. ${dealt}/${raw} dmg, ${CALL_COST} RAM.`) — this is
new copy, cosmetic only, read by no check. It is *not* the per-contact flavour verb DESIGN.md's own
card example shows ("Drone strike. 8 damage, ignores armour."): nothing in PRODUCT.md or
ORACLE.md gives a contact an identity beyond its id, so a unique verb-phrase per contact would be
invented lore rather than derived content, and that line was not written. `CONSTRUCT_DISPLAY` (a
display name and one-word tag for each of the five construct ids) is a different case: DESIGN.md
names `wall`/`sweep`/`cold`/`hunter`/`archon` *by those exact ids* as ICE WALL/COMBAT, CORPSEC
SWEEP/HARD, COLD STORAGE/QUIET, HUNTER/HARD, ARCHON/CORE — this is a lookup over an id the View
already carries, not new invention, and it was adopted directly. "ZAIBATSU CONSOLE" (the top bar's
left-hand identity) is DESIGN.md's own literal example text for that exact position, adopted
verbatim.

**Not adopted, and why — the actual point of this iteration:**
- **Button/art radius on interactive controls.** DESIGN.md calls for 14px on "buttons and art."
  Every `<button>` (including a roster card acting as the call action) stays square. This is the
  one place design and a prior technical finding in this same file collide: `checks/matrix.mjs`'s
  `am-colour-only` mutant forces two same-size buttons to differ only by saturation, and this
  arm's second iteration found that a rounded corner's antialiasing depends on the element's
  absolute Y position, so two genuinely identical buttons at different Y offsets never hashed
  identically — fixed then by removing button radius entirely (see the matrix paragraph below).
  Reintroducing it would risk exactly that regression, so it stays not adopted for buttons; art
  (`<img>` portraits, never a button) and non-interactive cards do take the 14px/12px radii.
- **`SEED` in the persistent bar.** DESIGN.md's own example reads "SEED ABC123 · LAYER 3 OF 8"
  beside "ZAIBATSU CONSOLE". Tried it verbatim first: at the real 360px console width, with mono
  type at `.16em` tracking, the two together overflow and `text-overflow: ellipsis` truncates the
  *layer* figure — the more useful of the two — down to "LAYER …". Dropped the seed from the
  visible bar rather than ship a truncated one; `view.__seed` is still attached to the standalone
  view (recorded below, in failed hypotheses, since it was actually tried and reverted).
- **A proportional threat-integrity meter.** DESIGN.md's meter component implies a fill
  proportional to a maximum. `View.threat` carries only `{id, integrity, armour}` — no starting
  value — so a proportion cannot be computed without guessing a denominator; the *previous*
  iteration's meter here was already a silent no-op for exactly this reason (its ratio was
  `integrity / integrity`, always 100%, never actually reflecting damage taken). Rendered a
  `chip.world` stating the raw integrity number instead of shipping a bar that cannot move.
- **A portrait on the `node` (offer) component.** DESIGN.md's own node example carries no
  portrait, only name/tag/terms — so none was added; only `card` (the roster) carries one.
- **The old `.grain` noise overlay.** Not in DESIGN.md — its ground is a radial wash with no
  texture — so it was dropped along with the all-monospace body font it sat on.

A third human playtest found that a layer's three targets could name the same construct twice —
`constructFor` drew each tier's construct independently from the five, so e.g. `HUNTER — soft` and
`HUNTER — hard` at the same layer were a real, common occurrence: the same machine standing as two
different difficulties reads as a bug even though nothing in the contract is violated by it (A2
keys distinctness on offer `id`, already unique as `off-<layer>-<tier>`, so this was invisible to
every check). Replaced the independent per-tier hash draw with a partial Fisher-Yates over the
five constructs, seeded from `(seed, layer)` alone: the three tiers at a layer now draw without
replacement, still replay exactly for a given seed, in both `oracle.mjs` and `nullrun.html`.
Verified 0 collisions across 1600 (seed, layer) pairs. `node checks/run.mjs`: 17/17, unchanged.
`node checks/matrix.mjs`: lethal, unchanged.

A second human playtest, of this same build, found that the roster shows a portrait and a name
and nothing else: no damage, no cost. Choosing between `tally` and `ninth` was guesswork, because
the `View` contract gives a check (and a player) no way to know — `resources.roster` is bare id
strings, and every other actionable thing in the contract (`Offer`, `threat`, `incoming`, `free`)
declares its own value. That gap is in the contract, not fixable from inside it, so it is recorded
rather than patched: `oracle.mjs`/`docs/ORACLE.md` are unchanged. `nullrun.html` renders from its
own (already-local) `POWER` table instead, now exposed off `NullrunOracle` alongside the five
contract functions for the renderer to read. Each roster card states its contact's damage —
mitigated against the current threat's armour, with the raw figure alongside, once one is in view
— and the ram cost of calling it. Fitting that on a 58px card without truncating (`scrollWidth >
clientWidth`, caught by direct measurement, not by eye) meant dropping the "dmg"/"ram" unit words
from every card and saying them once in the panel heading instead (`roster — call one (dmg · ram
cost)`) — same information, stated at the panel rather than repeated nine times. The same
card-height budget that made the earlier threat-portrait fix exact (see below) had no slack left
for a second text line, so the design keeps every card to a portrait plus two short lines, encounter
included. Confirmed this changed no criterion's result: `node checks/run.mjs` was 17/17 before and
after, `node checks/matrix.mjs` lethal before and after — a human looking at the screen is still
the only thing that catches what these seventeen checks cannot see a roster card at all.

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

- [presentation] Showing DESIGN.md's persistent-bar example verbatim ("ZAIBATSU CONSOLE" left,
  "SEED nnnnnn · LAYER n OF m" right) at the real 360px test width — the combined string overflows
  and `text-overflow: ellipsis` silently truncates the layer count, the more useful of the two
  figures; dropped the seed from the bar rather than ship a truncated readout, iteration 3.

## disputes

_(an iteration's argument that a check is wrong rather than the code. Not acted on during the loop.)_
