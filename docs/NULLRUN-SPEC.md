# NULLRUN — Specification

**Version:** 0.3.3
**Status:** authoritative. The build is derived from this document. If the build does anything not written here, the build is wrong or this document is incomplete. Fix the document first.

---

## Part I — Method

### M1. Code is ephemeral

The implementation is a disposable render of this spec. It carries no authority and is never where a decision lives. Anything worth keeping must appear in Part II or III before the next rebuild, or it vanishes, and that is correct.

### M2. The rebuild is a test of the spec

When a rebuild loses something desirable, the conclusion is never "the rebuild was bad" but "the spec was underspecified at line X". Amend, rebuild again. The spec converging on sufficiency is the actual deliverable.

### M3. Feedback intake

Every piece of feedback is classified before anything is changed:

| Class | Meaning | Lands in |
|---|---|---|
| `tune` | a number is wrong | §T tunables |
| `content` | a contact, construct or hardware item needs adding, cutting or changing | §C content tables |
| `defect` | build disagrees with spec | nothing, patch the build |
| `gap` | build and spec agree, both are wrong | relevant FR/NFR |
| `feature` | genuinely new capability | new FR |
| `feel` | vague dissatisfaction, no rule attached yet | §O open questions, until it can be named |

`feel` items are not acted on until converted into another class. Acting on unnamed dissatisfaction is how a spec loses its grip on the code.

### M4. Rebuild or iterate

**Iterate** (patch the existing build in place) when all of these hold:
- the change is confined to §T, a single row of §C, or one system in §S
- no invariant in §I changes
- the conformance checklist in §K still passes unchanged

**Rebuild** (regenerate the whole build from this document, discarding the old file) when any of these hold:
- an invariant in §I changes
- the turn contract FR-2 changes
- the change touches two or more systems in §S
- the build contains behavior that cannot be traced to a line in this document
- three patches have accumulated since the last rebuild (drift budget)
- the build exceeds the size budget in NFR-7

The drift budget is not optional. It forces a scheduled rebuild even when nothing demands one, which is the only reliable way to discover that the spec has quietly stopped being sufficient.

### M5. Spec budget

This document stays under 3,000 words so a rebuild is a single pass with the whole spec in view. If it outgrows that, cut the product, not the spec.

---

## Part II — Product

### P1. Identity

**NULLRUN.** A short, turn-based deckbuilder about running a team into a hostile system. You descend eight layers of a dead arcology toward its core. Your deck is not software: it is the people you can call, and each answers once. Dark science fiction, degraded and industrial: a hostile system seen through cheap equipment.

Tone rule: the system is indifferent, not theatrical. Log lines are terse machine output. No villain speaks.

### P2. Primary job

Deliver a complete, tense hand of decisions every turn, and a complete run in under fifteen minutes, on a phone held in one hand.

### P3. Design pillars

1. **No hidden damage.** Every attack states its exact value for a full turn before it lands. Losing firewall is a decision the player made, never a surprise.
2. **Time is the real enemy.** Trace rises per turn, not per action. A stronger team is a quieter run, because it needs fewer turns.
3. **Spending is losing.** Capability is rationed by exhaustion, not draw: every contact you call is gone for the rest of the run. The whole roster is always visible, so every play decides what you will no longer have.
4. **Colour carries meaning.** Cyan is you. Amber is the world. Rust is incoming harm. Nothing is coloured decoratively.

---

## Part III — Requirements

### §S Systems

`S1` route generation · `S2` turn engine · `S3` construct behaviour · `S4` roster and contacts · `S5` trace and alarm · `S6` progression and payouts · `S7` presentation · `S8` persistence and collection

### §I Invariants

- `I1` Same seed plus same input sequence yields the same run, bit for bit.
- `I2` Every offer layer presents at least one node that does not raise alarm.
- `I3` **Roster conservation.** Every contact is either ready or burned, never duplicated, and never returns to ready before the run ends.
- `I4` Firewall is only ever reduced by the intent displayed for the whole of that turn.
- `I5` The player always has a legal action: ending the turn and bailing are always available.
- `I6` A contact the player cannot afford costs no RAM, burns nobody, and changes no state.
- `I7` Every screen has an exit. A run always terminates on the end screen, which offers another.

### Functional

- `FR-1` **Encounter.** One player, one construct. No grid, no movement. The only decision is which contact to spend, and when.
- `FR-2` **Turn contract.** The construct's next intent shows for the whole turn. The player calls any number of affordable ready contacts in any order. Ending the turn resolves in order: trace rises; alarm increments if trace is full; the shown intent resolves against firewall; the run ends if firewall hits zero; the next intent shows; RAM refills. RAM never carries over, and nothing else expires.
- `FR-3` **Telegraphing.** A shown intent states its label and exact resolved value in text, and resolves at the end of the turn it was shown for. Its value is fixed when it is shown: an alarm increment later in that turn applies to the next intent, never to the pending one. Intents run a fixed per-construct cycle; a one-intent construct shows it every turn.
- `FR-4` **Roster and RAM.** The whole roster is visible at once: no draw, discard, shuffle or hand. Contacts cost 0 to 3 RAM. Calling one resolves its effect and burns it for the rest of the run (P3.3, I3). An effect may refund RAM.
- `FR-5` **Firewall.** The player's only health. Contacts may add to it; it is uncapped and never decays. At zero or below the run ends.
- `FR-6` **Construct.** Constructs have integrity and armour. Damage is reduced by armour to a minimum of 1 unless the contact pierces. A contact may strip armour; a construct may restore its own. Integrity at zero clears the node.
- `FR-7` **Bail.** Available in every encounter state. Ends the run at once as a loss, banking credits earned. Guarantees I5 and I7.
- `FR-8` **Trace.** 0 to 100, rising a fixed amount per turn, modified by persona; contacts may raise or lower it. At 100 alarm increments and trace resets to a carry-over. Every intent value gains the alarm scale per alarm level. Trace resets on entering a node; alarm persists for the run and also rises when an alarm node is taken.
- `FR-9` **Route.** Eight layers. Layers 1 to 7 offer three nodes drawn without replacement from the construct set, so no two match; HUNTER joins that set once alarm is above zero. A node states construct, integrity, armour, payout, and whether it raises alarm. Integrity and payout both scale with layer and alarm, and an alarm node pays more. No map: three offers, a short run log, the layer counter. One must be taken.
- `FR-10` **Layer 8.** A fixed encounter against the core. No offers, no alternative route.
- `FR-11` **Payout.** Clearing a node pays credits and offers at most one new contact from the unlocked pool, excluding those on the roster; if that pool is empty at the current tier, none is offered and the screen says so. The screen also names every contact burned so far. Declining is always offered.
- `FR-12` **Roster pressure.** The roster is capped (§T; hardware may raise it). Accepting at the cap requires releasing one, chosen from the full roster, burned or ready. Keeping the roster unchanged is always offered.
- `FR-13` **Persona and hardware.** A run starts from a persona and its fitted hardware. The persona sets starting firewall, RAM and one run-long passive; hardware adds named contacts, RAM or roster slots. Both modify tunables and roster composition only, never rules. Changing hardware restarts the run on the same seed.
- `FR-14` **Ending.** Firewall at zero or below, or bailing, ends the run as a loss; destroying the core wins it. The end screen shows layers cleared, credits banked, contacts burned, turns taken and the seed, and offers a new run and a rerun of the seed.
- `FR-15` **Collection.** Credits accumulate across runs and unlock further contacts into the payout pool at fixed thresholds. Storage is local; losing it degrades to a fresh collection and never blocks play.
- `FR-16` **Screens.** Exactly five: loadout, offers, encounter, payout, end. Every transition is one tap. Releasing a contact is a state of payout, not a sixth screen.
- `FR-17` **Input.** Touch first, one-handed. Targets are at least 44px on the short edge, and each screen's primary action sits in thumb reach at the bottom. Keyboard mirrors everything: digits select a contact or node, enter advances or ends the turn, escape bails or declines.
- `FR-18` **Seeding.** The seed shows in the top bar at all times and is enterable at the loadout screen.

### Non-functional

- `NFR-1` **Self-contained.** One HTML file. No network requests at runtime, including fonts. System font stacks only.
- `NFR-2` **Determinism.** All in-run randomness, node and payout offers included, draws from one run-scoped generator in a fixed order. Only the initial random seed sits outside it.
- `NFR-3` **Legibility without colour.** Every contact is readable by name, role and cost without colour; every intent states its value in text. Burned contacts are marked by label, not tint.
- `NFR-4` **Motion.** No non-user-triggered motion except the trace meter at critical level. All animation is suppressed under `prefers-reduced-motion`.
- `NFR-5` **Portrait first.** Designed for 390px, playable from 360px up. The roster wraps rather than scrolling off screen. No horizontal page scroll at any width.
- `NFR-6` **No frame loop.** Render on state change only. Idle cost is zero.
- `NFR-7` **Size budget.** Under 1,600 lines and under 150 KB.
- `NFR-8` **Presentation.** Corporate system software the player does not own: flat panels, soft radii, generous spacing, one accent. Contact faces are banded — role and cost, image window, name, effect text.

### §T Tunables

All balance numbers live in one `CONFIG` object at the top of the build. Changing any of them is always an iterate, never a rebuild.

Current values: firewall 24, RAM 3, roster cap 6, trace max 100, trace per turn 6, alarm carry-over 40, alarm intent scale 3, layers 8, offers per layer 3, node integrity +14% per layer and +10% per alarm level, node payout 60 flat plus 40 scaled plus 60 for an alarm node, core payout 600, unlock thresholds 400 / 1200 / 2400 credits, construct integrity 34 to 96, construct armour 0 to 3, contact cost 0 to 3.

### §C Content tables

**Constructs.** ICE WALL heavily armoured, one heavy intent. CORPSEC SWEEP highest integrity, low armour, two alternating intents. COLD STORAGE fragile, unarmoured, alternates a held turn with a heavy purge. HUNTER joins the offer set only once alarm is above zero. ARCHON the core: a three-intent cycle that restores its own armour mid-cycle.

**Contact effects** compose only from: damage, armour pierce, armour strip, firewall gain, trace change, RAM refund.

**Personas.** KESTREL decker, firewall 24, RAM 3, passive: trace rises 1 slower per turn.

**Base roster (3).** VELVET face · BISHOP decker · SPARROW scout. Fitted hardware brings the rest, so the default loadout starts at five.

**Contact pool by unlock tier.**
- always: GRIEF medic, TALLY fixer, ASH courier
- tier 1: PRIOR muscle, NINE-TENTHS forger
- tier 2: CARDINAL rigger, WREN infiltrator
- tier 3: SAINT ex-corpsec, DOLOROSA unknown

**Hardware.** HAMMER-4 cyberdeck adds MOLE and HATCHET · SPLIT REFLEX wetware +1 RAM · COLD WALLET +1 roster slot. Fitted and unfitted at the loadout screen.

### §K Conformance checklist

A rebuild is accepted only when all pass.

- `K1` Two generators from one seed produce identical first node offers and first payout offer.
- `K2` Across 50 runs, every offer layer shows three distinct constructs, at least one raising no alarm (I2, FR-9).
- `K3` A burned contact can never be called again in the same run (I3).
- `K4` Over 500 turns, roster count equals base plus hardware plus accepted minus released, never above the cap (I3, FR-12).
- `K5` Firewall only ever falls by the value displayed on that turn's intent (I4).
- `K6` An unaffordable contact leaves RAM, roster and construct unchanged (I6).
- `K7` One seed and one input sequence produce identical final credits (I1).
- `K8` End turn and bail are reachable from every encounter state (I5).
- `K9` Every contact and every intent value is readable in a greyscale screenshot (NFR-3).
- `K10` No network request is issued (NFR-1).
- `K11` No horizontal scroll at 360px (NFR-5).
- `K12` Every interactive target is at least 44px on its short edge (FR-17).
- `K13` Accepting at the cap forces a release and never exceeds it (FR-12).
- `K14` Damage never falls below 1 against armour; pierce ignores armour (FR-6).
- `K15` **Viability.** A scripted competent policy clears layer 1 from the starting roster, and wins at least some runs across 200 seeds. Conformance is not playability; without this, §K passes on an unwinnable game.

### §O Open questions and known risks

- `O1` **Roster size.** Six visible contacts may be too few for real combinations, or exactly enough to keep the decision on one screen.
- `O2` Whether eight layers is right for single-construct duels. Five may be tighter.
- `O3` **Resolved 0.3.0.** The reference model is a visible roster of exhaustible people, not a shuffled deck. Draw, discard, shuffle and hand are rejected, and not reopened without new feedback. The collection in FR-15 stays, but only to widen the payout pool.
- `O4` **Burn severity — measured, blocking.** Contacts burn and never return within their scope, so damage per encounter is bounded by roster size, not by time: an encounter is decided arithmetically on entry, and turns, firewall, trace and telegraphing cannot change its outcome. The build fails K15 — the starting roster deals 29 against a softest node of 34; a competent policy cleared 0 of 200 runs. Three measured fixes fail: per-encounter burn still wins 0–5%; lower integrity wins only by ending 71% of encounters before a single turn, with alarm never firing across 200 runs; more firewall buys turns the player cannot use. What is missing is a renewable damage source — a free action, or contacts that do not burn — which is a `feature`, and a rebuild. See `docs/conformance/`.
- `O5` Payout offers are uniform over the unlocked pool. Weighting toward missing roles may read fairer, or flatten identity.
- `O6` **Upgrades.** No path improves a contact rather than replacing them. Adding one changes FR-11 and §C: a rebuild.
- `O7` **Node variety.** Every layer offers the same three-node shape. Rest, fixer and elite nodes are the largest unimported structure.
- `O8` Without a grid, whether trace alone supplies enough pressure, or encounters resolve too fast to feel tense.
- `O9` Whether hardware that only injects contacts and numbers is interesting, or must touch the turn contract to matter.
- `O10` **Persona depth.** One persona exists. Whether personas unlock with credits, and whether a passive can exceed a tunable modifier without breaking FR-13, is undecided.
- `O11` **Bail semantics.** Bailing ends the run. Abandoning one encounter and continuing the route is the alternative, and needs a rule for what the abandoned layer costs.

### Change log

- `0.3.3` Spec only. `O4` rewritten from the measurements: the blocker is structural, not a number, and the fallback `O4` itself proposed (per-encounter burn) is neither a `tune` nor sufficient — it changes I3, so M4 makes it a rebuild, and it does not make the game winnable. Recorded so the next rebuild does not retry it.
- `0.3.2` Spec only. Added `K15`, a viability check, after the first build passed all fourteen conformance checks while being unwinnable: §K tested that the rules hold, never that the game can be finished. `O4` upgraded from speculation to measurement.
- `0.3.1` Spec only, no rebuild; the first 0.3.x build is generated from this revision. M5 raised from 2,500 to 3,000 words: every requirement traces to the prototype, so the budget was cutting the record rather than the product. FR-3 now fixes an intent's value at display time, closing a `gap` where an alarm increment during end-of-turn resolution raised the resolved value above the value displayed all turn, violating I4 and pillar 1.
- `0.3.0` **Rebuild**, derived from the design prototype `nullrun.html`. Grid tactics cut entirely: movement, vision, positioning, map generation and their invariants go with FR-1. A visible roster of contacts that burn on use replaces the deck, so draw, discard, shuffle, hand, powers and scrub are cut, and card conservation becomes roster conservation (I3). Three node offers per layer replace the map (FR-9). Added persona and hardware (FR-13), roster cap and release (FR-12), armour (FR-6), portrait- and touch-first (NFR-5, FR-17), banded contact face (NFR-8). `O3` reversed. A `feature` classification touching S1, S2, S4, S6 and S7, past the M4 iterate threshold. Where the prototype disagreed with the draft spec beside it, the prototype won: FR-3, FR-7, FR-6, FR-11 and §T.
- `0.2.1` Spec only. `O3` resolved in favour of in-run deckbuilding.
- `0.2.0` **Rebuild.** Cooldown modules replaced by deck, hand, energy and discard; enemies act once per player turn; trace moved to per-turn.
- `0.1.0` Initial specification and first build.
