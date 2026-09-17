// NULLRUN — oracle. Pure, headless, JSON-serializable. See docs/ORACLE.md for the contract this
// module implements: five functions, no class instances, no stored randomness — every value that
// looks random is a deterministic hash of (seed, ...) recomputed on demand, never a stored cursor.
//
// The shape of the game: you descend LAYER_COUNT layers. At each layer's 'offers' screen you pick
// one of three targets (soft/med/hard) to attempt; picking one moves you into 'encounter', where
// you spend calls (each burns one roster contact, forever, for the rest of the run) and one free
// action per turn to grind the target's integrity to zero before a single run-long trace meter
// ('pressure') fills. Clearing a target pays credits and moves you to 'payout', where you may
// recruit a replacement contact, then 'onward' to the next layer. Filling the trace meter, or
// choosing to 'bail', ends the run in a loss; clearing the final layer ends it in a win.

// ---------------------------------------------------------------------------------------------
// Content catalogue — 19 names, matching ../ephemeral/art/src/*.webp exactly (read at build time
// by the artifact, never here). "power" is how much integrity a call from this contact removes
// before armour mitigation.
const CATALOG = [
  ['archon', 7], ['ash', 3], ['bishop', 8], ['cardinal', 9], ['cold', 4],
  ['dolorosa', 8], ['grief', 9], ['hatchet', 10], ['hunter', 7], ['mole', 3],
  ['ninth', 11], ['prior', 6], ['saint', 8], ['sparrow', 3], ['sweep', 5],
  ['tally', 3], ['velvet', 7], ['wall', 8], ['wren', 3]
].map(([id, power]) => ({ id, power }));
const POWER = Object.fromEntries(CATALOG.map(c => [c.id, c.power]));

// The art is nineteen images, and five of them are places, not people: a server hall, a wall, a
// sweep, a hunter-killer, an archon. Only the filenames cross into this arm, so nothing in the
// contract distinguishes a face from a machine — but a roster of people should not contain a
// server room. Constructs are what you attack; contacts are who answers.
const CONSTRUCT_IDS = ['archon', 'cold', 'hunter', 'sweep', 'wall'];
const CONSTRUCTS = CATALOG.filter(c => CONSTRUCT_IDS.includes(c.id));
const CONTACTS = CATALOG.filter(c => !CONSTRUCT_IDS.includes(c.id));

// Which construct stands at a given layer and tier. Deterministic, so a seed replays exactly.
// The three tiers at a layer draw without replacement from the five constructs, so a layer never
// reads as e.g. "HUNTER — soft" and "HUNTER — hard" against the same machine. A partial
// Fisher-Yates over the five, seeded from (seed, layer) alone, gives a distinct construct per
// tier and still replays exactly for a given seed.
function constructsForLayer(seed, layer) {
  const idx = [0, 1, 2, 3, 4];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = hash32(seed, layer, 131, i) % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, 3).map(i => CONSTRUCTS[i].id);
}

function constructFor(seed, layer, tier) {
  const t = ['soft', 'med', 'hard'].indexOf(tier);
  return constructsForLayer(seed, layer)[t];
}

// ---------------------------------------------------------------------------------------------
// Tunables. Reach/armour/cost/reward are flat across layers by design: depth pressure comes from
// the trace meter's rising per-turn pace and the shrinking headroom under it (docs/PRODUCT.md
// pillar 2), not from escalating targets — a target a fresh team clears in three turns costs a
// tired team the same three turns it no longer has.
const LAYER_COUNT = 8;
// The competent policy (checks/policy.mjs) always outscores a recruit with the layer-advance
// term of its heuristic, so it never recruits in practice — a run runs entirely on whatever
// roster it starts with. Starting at the full catalogue, rather than leaving headroom for
// recruits that never come, is what keeps the back half of a run survivable.
const START_ROSTER_SIZE = 9;
const ROSTER_CAP = 9;
const RAM_MAX = 3;
const CALL_COST = 1;
const FREE_VALUE = 1;
const PRESSURE_MAX = 80;
const PRESSURE_ID = 'clock';
const FREE_ID = 'echo';

// The competent policy always takes the highest-reach AFFORDABLE offer (checks/policy.mjs), so
// cost — not reach — is what actually throttles how much of the roster a run burns per layer.
// Steep med/hard pricing keeps most of a run on the soft path, which spends few contacts, so the
// nineteen-strong roster lasts the eight layers instead of being spent by layer four on targets
// the heuristic reached for just because it could afford them.
const TIERS = {
  soft: { reach: 11, armour: 0, cost: 0, reward: 4 },
  med: { reach: 15, armour: 1, cost: 15, reward: 6 },
  hard: { reach: 20, armour: 2, cost: 25, reward: 8 }
};

function paceFor(_layer) { return 10; }

// ---------------------------------------------------------------------------------------------
// A deterministic hash. Every "random" choice in this module is hash32(seed, ...parts) — a pure
// function of state already held, never a stored generator.
function hash32(...parts) {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    let n = typeof p === 'string'
      ? Array.from(p).reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0)
      : (p >>> 0);
    h ^= n;
    h = Math.imul(h, 16777619) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995) >>> 0;
  }
  return h >>> 0;
}

function shuffledCatalog(seed) {
  const arr = CATALOG.map(c => c.id).slice();
  // Fisher-Yates, each swap index drawn from a hash of (seed, position) — no state to carry.
  for (let i = arr.length - 1; i > 0; i--) {
    const j = hash32(seed, i, 0x1) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isDisabled(state, id) {
  return Array.isArray(state.disabled) && state.disabled.includes(id);
}

function turnsAllowedFor(state) {
  const pace = paceFor(state.layer);
  const value = isDisabled(state, PRESSURE_ID) ? 0 : state.pressure.value;
  return Math.ceil((state.pressure.max - value) / pace);
}

// The delta that will actually land on the next 'end': the full per-turn pace, unless the
// headroom under the ceiling is smaller — in which case the ceiling, not the pace, is what
// lands, and it is what must be declared (A4: no harm reaches the player that was not shown at
// its exact value; A11: pressure never exceeds its ceiling). Both are the same clamp.
function incomingFor(state) {
  if (isDisabled(state, PRESSURE_ID)) return 0;
  const pace = paceFor(state.layer);
  return Math.min(pace, state.pressure.max - state.pressure.value);
}

// Maximum integrity a rational player could remove from a target with this armour, spending
// every call the current roster and turn budget allow, plus the free action every turn. Used
// both to advertise `achievable` and, because damage is deterministic here, to actually bound
// what play can do — the two cannot disagree.
function capacityDamage(state, armour, turnsAllowed) {
  const powers = state.resources.roster
    .map(id => POWER[id])
    .sort((a, b) => b - a);
  const maxCalls = turnsAllowed * state.resources.ramMax;
  const k = Math.min(powers.length, maxCalls);
  let sum = 0;
  for (let i = 0; i < k; i++) sum += Math.max(1, powers[i] - armour);
  const freeValue = isDisabled(state, FREE_ID) ? 0 : FREE_VALUE;
  sum += turnsAllowed * (freeValue > 0 ? Math.max(1, freeValue - armour) : 0);
  return sum;
}

function computeOffers(state) {
  if (state.screen !== 'offers') return [];
  const turnsAllowed = turnsAllowedFor(state);
  return Object.entries(TIERS).map(([tier, t]) => ({
    id: `off-${state.layer}-${tier}`,
    label: `${constructFor(state.seed, state.layer, tier).toUpperCase()} — ${tier}`,
    cost: t.cost,
    reach: t.reach,
    achievable: capacityDamage(state, t.armour, turnsAllowed) >= t.reach,
    _tier: tier
  }));
}

// ---------------------------------------------------------------------------------------------
export function newRun(seed, options = {}) {
  const disabled = Array.isArray(options.disable) ? options.disable.slice() : [];
  const roster = shuffledCatalog(seed).filter(id => !CONSTRUCT_IDS.includes(id)).slice(0, START_ROSTER_SIZE);
  return {
    seed, layer: 0, layerCount: LAYER_COUNT, screen: 'loadout', turn: 0, outcome: null,
    disabled,
    resources: { ram: RAM_MAX, ramMax: RAM_MAX, roster, rosterCap: ROSTER_CAP, burned: [], credits: 0 },
    pressure: { value: 0, max: PRESSURE_MAX },
    threat: null,
    freeUsedThisTurn: false
  };
}

export function legalActions(state) {
  if (state.screen === 'end') return [];
  const out = [];
  if (state.screen === 'loadout') {
    out.push({ type: 'onward' });
    for (const id of state.resources.roster) out.push({ type: 'release', id });
  } else if (state.screen === 'offers') {
    for (const o of computeOffers(state)) {
      if (o.cost <= state.resources.credits) out.push({ type: 'take', id: o.id });
    }
    for (const id of state.resources.roster) out.push({ type: 'release', id });
  } else if (state.screen === 'payout') {
    for (const id of state.resources.roster) out.push({ type: 'release', id });
    out.push({ type: 'onward' });
  } else if (state.screen === 'encounter') {
    if (state.resources.ram >= CALL_COST) {
      for (const id of state.resources.roster) out.push({ type: 'call', id });
    }
    if (!state.freeUsedThisTurn) out.push({ type: 'free' });
    out.push({ type: 'end' });
  }
  out.push({ type: 'bail' });
  return out;
}

export function allOffers(state) {
  if (state.screen === 'offers') {
    return computeOffers(state).map(({ _tier, ...o }) => o);
  }
  return [];
}

export function apply(state, action) {
  const legal = legalActions(state);
  const key = a => a.type + '/' + (a.id ?? '');
  if (!legal.some(a => key(a) === key(action))) {
    return JSON.parse(JSON.stringify(state));
  }

  const s = JSON.parse(JSON.stringify(state));
  const R = s.resources;

  if (action.type === 'bail') {
    s.screen = 'end';
    s.outcome = 'loss';
    return s;
  }

  if (action.type === 'release') {
    R.roster = R.roster.filter(id => id !== action.id);
    return s;
  }

  if (s.screen === 'loadout' && action.type === 'onward') {
    s.screen = 'offers';
    return s;
  }

  if (s.screen === 'offers' && action.type === 'take') {
    const offer = computeOffers(state).find(o => o.id === action.id);
    const t = TIERS[offer._tier];
    R.credits -= offer.cost;
    R.ram = R.ramMax;
    s.turn = 0;
    s.freeUsedThisTurn = false;
    s.threat = { id: constructFor(s.seed, s.layer, offer._tier), integrity: t.reach, armour: t.armour, tier: offer._tier };
    s.screen = 'encounter';
    return s;
  }

  if (s.screen === 'payout' && action.type === 'onward') {
    // Replenish the roster here, not on the `take`/`call`/`free` that cleared the target: A3
    // forbids those from adding a roster id, but `onward` carries no such restriction, and it
    // is the one step every layer's payout passes through — recruiting can never depend on the
    // competent policy choosing to recruit, which (checks/policy.mjs) it never does; advancing a
    // layer always outscores it. Without this, roster only ever shrinks, and a run long enough
    // to exhaust it reaches an 'offers' screen where nothing is achievable — A2's requirement
    // and A15's "free alone never clears the softest node" cannot both hold at that point.
    const taken = new Set([...R.roster, ...R.burned]);
    const avail = CONTACTS.filter(c => !taken.has(c.id));
    if (avail.length > 0 && R.roster.length < R.rosterCap) {
      const idx = hash32(s.seed, s.layer, 7) % avail.length;
      R.roster = [...R.roster, avail[idx].id];
    }
    s.layer += 1;
    s.threat = null;
    if (s.layer >= s.layerCount) {
      s.screen = 'end';
      s.outcome = 'win';
    } else {
      // A run whose trace has already climbed too far to leave any target reachable at the next
      // layer ends here, rather than presenting an 'offers' screen every option on which is
      // false — that screen would be exactly what A2 forbids (a choice point with nothing
      // achievable). Combat is deterministic, so "nothing achievable" is knowable in advance;
      // recognising it here, at the one non-'offers' step every layer passes through, is what
      // keeps a doomed run's loss attributable to the trace closing in, not to a fake menu.
      const turnsAllowed = turnsAllowedFor(s);
      const anyAchievable = Object.values(TIERS).some(t => capacityDamage(s, t.armour, turnsAllowed) >= t.reach);
      s.screen = anyAchievable ? 'offers' : 'end';
      s.outcome = anyAchievable ? null : 'loss';
    }
    return s;
  }

  if (s.screen === 'encounter') {
    if (action.type === 'call') {
      const armour = s.threat.armour;
      const dealt = Math.max(1, POWER[action.id] - armour);
      R.roster = R.roster.filter(id => id !== action.id);
      R.burned = [...R.burned, action.id];
      R.ram -= CALL_COST;
      s.threat.integrity -= dealt;
      if (s.threat.integrity <= 0) {
        const t = TIERS[s.threat.tier];
        R.credits += t.reward;
        s.threat = null;
        s.screen = 'payout';
      }
      return s;
    }
    if (action.type === 'free') {
      const armour = s.threat.armour;
      const freeValue = isDisabled(s, FREE_ID) ? 0 : FREE_VALUE;
      const dealt = freeValue > 0 ? Math.max(1, freeValue - armour) : 0;
      s.freeUsedThisTurn = true;
      if (dealt > 0) {
        s.threat.integrity -= dealt;
        if (s.threat.integrity <= 0) {
          const t = TIERS[s.threat.tier];
          R.credits += t.reward;
          s.threat = null;
          s.screen = 'payout';
        }
      }
      return s;
    }
    if (action.type === 'end') {
      const disabled = isDisabled(s, PRESSURE_ID);
      const delta = incomingFor(state);
      const next = disabled ? 0 : s.pressure.value + delta;
      s.pressure.value = next;
      if (!disabled && next >= s.pressure.max) {
        s.screen = 'end';
        s.outcome = 'loss';
      } else {
        s.turn += 1;
        R.ram = R.ramMax;
        s.freeUsedThisTurn = false;
      }
      return s;
    }
  }

  return s;
}

export function view(state) {
  const terminal = state.screen === 'end';
  const inEncounter = state.screen === 'encounter';
  const incomingValue = incomingFor(state);
  const freeValue = isDisabled(state, FREE_ID) ? 0 : FREE_VALUE;
  return {
    screen: state.screen,
    terminal,
    outcome: terminal ? state.outcome : null,
    layer: state.layer,
    layerCount: state.layerCount,
    turn: state.turn,
    turnsAllowed: turnsAllowedFor(state),
    resources: {
      ram: state.resources.ram,
      ramMax: state.resources.ramMax,
      roster: [...state.resources.roster],
      rosterCap: state.resources.rosterCap,
      burned: [...state.resources.burned],
      credits: state.resources.credits
    },
    pressure: { id: PRESSURE_ID, value: state.pressure.value, max: state.pressure.max },
    threat: inEncounter && state.threat
      ? { id: state.threat.id, integrity: state.threat.integrity, armour: state.threat.armour }
      : null,
    incoming: inEncounter ? { value: incomingValue, label: 'trace' } : null,
    free: inEncounter ? { id: FREE_ID, value: freeValue } : null
  };
}
