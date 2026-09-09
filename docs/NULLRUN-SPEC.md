# NULLRUN — Specification

**Version:** 0.7.0
**Status:** authoritative. The build derives from this document. If the build does anything not written here, the build is wrong or this document is incomplete. Fix the document first.

---

## Part I — Method

### M1. Code is ephemeral

The implementation is a disposable render of this spec. It carries no authority and is never where a decision lives. Anything worth keeping must appear in Part II or III before the next rebuild, or it vanishes — and that is correct.

### M2. The rebuild is a test of the spec

When a rebuild loses something desirable, the conclusion is never "the rebuild was bad" but "the spec was underspecified at line X". Amend, rebuild again. A requirement that documents only its purpose will lose its side effects on the next rebuild. The spec converging on sufficiency is the deliverable.

### M3. Feedback intake

All feedback is classified before anything changes:

| Class | Meaning | Lands in |
|---|---|---|
| `tune` | a number is wrong | §T tunables |
| `content` | a contact, construct or hardware item needs adding, cutting or changing | §C content tables |
| `defect` | build disagrees with spec | nothing; patch the build |
| `gap` | build and spec agree, both are wrong | relevant FR/NFR |
| `feature` | genuinely new capability | new FR |
| `feel` | vague dissatisfaction, no rule attached yet | §O open questions, until it can be named |

`feel` items are not acted on until converted into another class. Acting on unnamed dissatisfaction is how a spec loses its grip.

### M4. Rebuild or iterate

**Iterate** (patch the build in place) when all hold:
- the change is confined to §T, one row of §C, or one system in §S
- no invariant in §I changes
- the conformance checklist in §K still passes unchanged

**Rebuild** (regenerate the build from this document, discarding the old file) when any hold:
- an invariant in §I changes
- the turn contract FR-2 changes
- the change touches two or more systems in §S
- the build contains behavior not traceable to a line in this document
- three patches have accumulated since the last rebuild (drift budget)
- the build exceeds the size budget in NFR-7

The drift budget is not optional. It forces a rebuild when nothing demands one — the only reliable way to find the spec has quietly stopped being sufficient.

### M5. Spec budget

This document stays under 3,000 words so a rebuild is one pass with the whole spec in view. If it outgrows that, cut the product, not the spec.

---

## Part II — Product

### P1. Identity

**NULLRUN.** A short, turn-based deckbuilder about running a team into a hostile system. You descend eight layers of a dead arcology toward its core. Your deck is not software: it is the people you can call, and each answers once. Dark science fiction, degraded and industrial.

Tone: the system is indifferent, not theatrical. Log lines are terse machine output. No villain speaks.

### P2. Primary job

A complete, tense hand of decisions every turn, and a whole run in under fifteen minutes, on a phone held in one hand.

### P3. Design pillars

1. **No hidden damage.** Every attack states its exact value for a full turn before it lands. Losing firewall is a decision the player made, never a surprise.
2. **Time is the real enemy.** Trace rises per turn, not per action. A stronger team is a quieter run, because it needs fewer turns.
3. **Spending is losing.** Capability is rationed by exhaustion, not draw: every contact you call is gone for the rest of the node. The whole roster is always visible, so every play decides what you will not have when the intent lands. Beneath that sits a floor you can never spend: you always have something, it is simply never enough.
4. **Colour carries meaning.** Cyan is you. Amber is the world. Rust is incoming harm. Nothing is coloured decoratively.

---

## Part III — Requirements

### §S Systems

`S1` route · `S2` turn engine · `S3` constructs · `S4` roster and contacts · `S5` trace · `S6` payouts · `S7` presentation · `S8` persistence

### §I Invariants

- `I1` Same seed plus same input sequence yields the same run, bit for bit.
- `I3` **Roster conservation.** Every contact is ready or burned and never duplicated. Burned contacts return to ready only on entering a node, never within one.
- `I4` Firewall is only ever reduced by the intent displayed for that whole turn.
- `I5` The player always has a legal action: ending the turn, breaching and bailing are always available.
- `I6` A contact the player cannot afford costs no RAM, burns nobody, changes no state.
- `I7` Every screen has an exit. A run terminates on the end screen, which offers another.
- `I8` **Renewable resources.** Damage and firewall each have a source that does not burn: breach (FR-5) and repair (FR-12). A resource refilled only by burning contacts is bounded by roster size, which decides the run on entry rather than in play.

### Functional

- `FR-1` **Encounter.** One player, one construct. No grid, no movement. The only decision is which contact to spend, and when.
- `FR-2` **Turn contract.** The construct's next intent shows for the whole turn. The player calls any number of affordable ready contacts in any order, and may breach once. Ending the turn resolves in order: trace rises; the run ends if trace is full; the shown intent resolves against firewall; the run ends if firewall hits zero; the next intent shows; RAM refills. RAM never carries over; nothing else expires.
- `FR-3` **Telegraphing.** A shown intent states its label and exact resolved value in text, and resolves at the end of the turn it was shown for. Its value is fixed when shown. Intents run a fixed per-construct cycle.
- `FR-4` **Roster and RAM.** The whole roster is visible at once: no draw, discard, shuffle or hand. Contacts cost 0 to 3 RAM. Calling one resolves its effect and burns it for the rest of the node (P3.3, I3). An effect may refund RAM.
- `FR-5` **Breach.** Once per turn the player may breach: it deals the §T breach damage plus the breach growth for each layer below the first, costs no RAM, burns nobody, ignores armour, and is available in every encounter state. It grows because node integrity grows — a flat trickle decays in relative terms until deep nodes are unclearable. Both its jobs are load-bearing: it guarantees a meaningful action (I5), and it is the only damage that does not deplete (I8), converting turns into damage and making encounter length a resource bought with trace. It stays too weak to carry an encounter, only to extend one.
- `FR-6` **Firewall.** The player's only health. Contacts may add to it; it is uncapped and never decays. At zero or below the run ends.
- `FR-7` **Construct.** Constructs have integrity and armour. Contact damage is reduced by armour to a minimum of 1 unless the contact pierces. A contact may strip armour; a construct may restore its own. Integrity at zero clears the node.
- `FR-8` **Bail.** Available in every encounter state. Ends the run at once as a loss, banking credits earned. Guarantees I7.
- `FR-9` **Trace.** 0 to 100, rising a fixed amount per turn, modified by persona; contacts may raise or lower it. **At 100 the run ends: you are traced.** Trace resets on entering a node, so it bounds how long one node may be worked. It is the only cost of taking a turn, and so the only thing stopping breach from grinding any construct down for free.
- `FR-10` **Route.** Eight layers. Layers 1 to 7 offer three nodes drawn without replacement from the construct set, so no two match. A node states construct, integrity, armour and payout, both of which scale with layer. No map: three offers, a short run log, the layer counter. One must be taken.
- `FR-11` **Layer 8.** A fixed encounter against the core. No offers, no alternative route.
- `FR-12` **Payout.** Clearing a node pays credits and offers a choice: one new contact from the unlocked pool excluding those on the roster, or repair, restoring the §T repair value to firewall. A contact is permanent growth, not a replacement for one spent. Repair is offered even when the contact pool is empty at the current tier. The screen names every contact burned. Declining both is always offered.
- `FR-13` **Roster pressure.** The roster is capped (§T; hardware may raise it). Accepting at the cap requires releasing one, chosen from the full roster, burned or ready. Keeping the roster unchanged is always offered.
- `FR-14` **Persona and hardware.** A run starts from a persona and its fitted hardware. The persona sets starting firewall, RAM and one run-long passive; hardware adds named contacts, RAM or roster slots. Both modify tunables and roster composition only, never rules. Changing hardware restarts the run.
- `FR-15` **Ending.** Firewall at zero or below, or bailing, ends the run as a loss; destroying the core wins it. The end screen shows layers cleared, credits banked, calls made, turns taken and the seed, and offers a new run and a rerun.
- `FR-16` **Collection.** Credits accumulate across runs and unlock further contacts into the payout pool at fixed thresholds. Storage is local; losing it degrades to a fresh collection and never blocks play.
- `FR-17` **Screens.** Exactly five: loadout, offers, encounter, payout, end. Every transition is one tap. Releasing a contact is a state of payout, not a sixth screen.
- `FR-18` **Input.** Touch first, one-handed. Targets are at least 44px on the short edge, and each screen's primary action sits in thumb reach at the bottom. Keyboard mirrors everything: digits select a contact or node, B breaches, enter ends the turn, escape bails or declines.
- `FR-19` **Seeding.** The seed shows in the top bar at all times and is enterable at the loadout screen.

### Non-functional

- `NFR-1` **Self-contained.** One HTML file. No network requests at runtime, including fonts. System font stacks only.
- `NFR-2` **Determinism.** All in-run randomness, node and payout offers included, draws from one run-scoped generator in a fixed order. Only the initial random seed sits outside it.
- `NFR-3` **Legibility without colour.** Every contact is readable by name, role and cost without colour; every intent states its value in text. Burned contacts are marked by label, not tint.
- `NFR-4` **Motion.** No non-user-triggered motion except the trace meter at critical level. All animation is suppressed under `prefers-reduced-motion`.
- `NFR-5` **Portrait first.** Designed for 390px, playable from 360px up. The roster wraps rather than scrolling off screen. No horizontal page scroll at any width.
- `NFR-6` **No frame loop.** Render on state change only. Idle cost is zero.
- `NFR-7` **Size budget.** Under 1,600 lines and under 150 KB.
- `NFR-9` **Presentation.** Corporate system software the player does not own: flat panels, soft radii, generous spacing, one accent. Contact faces are banded — role and cost, image window, name, effect text.

### §T Tunables

All balance numbers live in one `CONFIG` object at the top of the build. Changing one is always an iterate, never a rebuild.

Current values: firewall 60, RAM 3, breach damage 4, breach growth 2 per layer, repair 24, roster cap 6, trace max 100, trace per turn 15, layers 8, offers per layer 3, node integrity +14% per layer and +10% per alarm level, node payout 60 flat plus 40 scaled plus 60 for an alarm node, core payout 600, unlock thresholds 400 / 1200 / 2400 credits, construct integrity 34 to 96, construct armour 0 to 3, contact cost 0 to 3.

### §C Content tables

**Constructs.** Integrity · armour · intents. ICE WALL 78 · 3 · STRIKE 7. CORPSEC SWEEP 111 · 1 · BURST 5, SUPPRESS 9. COLD STORAGE 51 · 0 · HOLD, PURGE 7. HUNTER 90 · 2 · HUNT 8. ARCHON the core, 144 · 3 · SHOCKWAVE 10, RESTORE 2 armour, SHOCKWAVE 12.

**Contact effects** compose only from: damage, pierce, strip, firewall, trace, RAM refund. Anything else is a rebuild trigger.

**Personas.** KESTREL decker, firewall 60, RAM 3, passive: trace rises 1 slower per turn.

**Base roster (3).** VELVET face · BISHOP decker · SPARROW scout. Hardware brings the rest; the default loadout starts at five.

**Contact pool by unlock tier.**
- always: GRIEF medic, TALLY fixer, ASH courier
- tier 1: PRIOR muscle, NINE-TENTHS forger
- tier 2: CARDINAL rigger, WREN infiltrator
- tier 3: SAINT ex-corpsec, DOLOROSA unknown

**Hardware.** HAMMER-4 adds MOLE and HATCHET · SPLIT REFLEX +1 RAM · COLD WALLET +1 roster slot. Fitted at the loadout screen.

### §K Conformance checklist

A rebuild is accepted only when all pass.

- `K1` Two generators from one seed produce identical first node offers and first payout offer.
- `K2` Across 50 runs, every offer layer shows three distinct constructs (FR-10).
- `K3` A burned contact can never be called again in the same run (I3).
- `K4` Over 500 turns, roster count equals base plus hardware plus accepted minus released, never above the cap, and no contact is called twice within one node (I3).
- `K5` Firewall only ever falls by the value displayed on that turn's intent (I4).
- `K6` An unaffordable contact leaves RAM, roster and construct unchanged (I6).
- `K7` One seed and one input sequence produce identical final credits (I1).
- `K8` End turn, breach and bail are reachable from every encounter state (I5).
- `K9` Every contact and every intent value is readable in a greyscale screenshot (NFR-3).
- `K10` No network request is issued (NFR-1).
- `K11` No horizontal scroll at 360px (NFR-5).
- `K12` Every interactive target is at least 44px on the short edge (FR-18).
- `K13` Accepting at the cap forces a release, never exceeding it (FR-13).
- `K14` Contact damage never falls below 1 against armour; pierce and breach ignore armour (FR-7, FR-5).
- `K16` **Renewable resources.** A layer-1 node is clearable by breach alone with every contact burned, and repair is reachable with no contact offered (I8). Regression guard: 0.3.x lost both silently and passed every other check.
- `K17` **Trace bites.** Trace ends some runs across 200 seeds. A clock that never strikes is the alarm system again.
- `K15` **Viability.** A competent policy wins 15% to 65% of 200 seeds, encounters average at least 2.5 turns, and under a tenth end before a turn is taken. A win bought by ending encounters instantly is not playability.

### §O Open questions and known risks

- `O1` **Roster size.** Six may be too few for real combinations, or just enough to keep the decision on one screen.
- `O2` Whether eight layers suits single-construct duels. Five may be tighter.
- `O3` **Resolved 0.3.0.** The model is a visible roster of exhaustible people, not a shuffled deck. Draw, discard, shuffle and hand are rejected. The collection in FR-16 stays, but only to widen the payout pool.
- `O4` **Resolved 0.4.0.** Without renewable damage, per-encounter damage is bounded by roster size whatever the burn scope, so per-encounter burn was never the fix. It, lower integrity and higher firewall were each measured against 0.3.1 and rejected (`docs/conformance/`). Contacts burn for the run; breach supplies the renewal.
- `O5` Payout offers are uniform. Weighting toward missing roles may read fairer, or flatten identity.
- `O6` **Upgrades.** No path improves a contact instead of replacing it. Adding one changes FR-12 and §C: a rebuild.
- `O7` **Node variety.** Every layer offers the same three-node shape. Rest, fixer and elite nodes are the largest missing structure.
- `O8` Whether trace now supplies real pressure, or breach only lengthens fights without tightening them.
- `O9` Whether hardware that only injects contacts and numbers is interesting, or must touch the turn contract.
- `O10` **Persona depth.** One persona exists. Whether personas unlock with credits, and whether a passive can exceed a tunable modifier, is open.
- `O11` **Bail semantics.** Bailing ends the run. Abandoning one encounter and continuing needs a rule for what that costs.
- `O12` **Breach and weak contacts.** Breach grows while contact damage does not, so by layer 6 a free action out-damages most of the roster. Contacts must eventually earn their slot on what breach cannot do — strip, firewall, trace — not on damage. The most likely next structural failure.
- `O13` **Breach and trace.** Nothing costs trace today. Whether breach should — making the quiet run and the fast run one run — is unexplored.

### Change log

Older entries live in git history, under the `spec/*` tags.

- `0.7.0` **Rebuild.** Breach grows per layer (FR-5); firewall, repair and every construct's integrity and intents are retuned with it (§T, §C). Breach had to grow because integrity does: damage per node was capped at 57 while layer 6's softest node reached 58, capping the run at layer 5 — the 0.3.x bug's shape, one level up. Scaling breach alone passed K15 by collapsing encounters to one turn, so K15 now requires encounters of real length: a win bought by ending them instantly is not playability. The four quantities are over-constrained and were solved jointly.
- `0.6.0` **Rebuild.** Burn narrowed to node-scoped (I3, FR-4, P3.3), fixing a ratio that burned four contacts per node against one replaced. The 0.3.1 run rejected this change; that verdict predated breach and did not survive re-measurement.
- `0.5.0` **Rebuild.** Alarm cut after firing in 0% of runs across three builds. Trace takes its place: at 100 the run ends (FR-9). `K17` immediately caught the replacement being as dead as the original.
- `0.4.0` – `0.4.1` **Rebuild.** Added breach (FR-5) and I8, restoring what the 0.2.x free step was silently doing; then repair (FR-12), firewall having the identical structure.
