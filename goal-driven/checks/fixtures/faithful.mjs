// POSITIVE CONTROL. An abstract three-layer resource game. Structurally honest: deterministic,
// conserving, caps enforced, harm declared before it lands, achievability truthful.
//
// It is NOT NULLRUN and must never be read by the loop — see goal-driven/CLAUDE.md. It exists so
// that a criterion which can never pass anything is caught at scaffolding time rather than by a
// forty-iteration stall.
//
// Declared to FAIL A13, A14, A15 and A17. A toy small enough to be a control is not a game.

const LAYERS = 3, RAM_MAX = 6, ROSTER_CAP = 3, CLOCK_MAX = 8, FREE_VALUE = 2;

const TOKENS = {
  t1: { value: 3, cost: 1 }, t2: { value: 4, cost: 2 }, t3: { value: 5, cost: 3 },
  t4: { value: 6, cost: 4 }, t5: { value: 10, cost: 1 }, t6: { value: 7, cost: 5 }
};
const ALL = Object.keys(TOKENS);

const lcg = s => (Math.imul(s, 1664525) + 1013904223) >>> 0;
const rand = s => { const n = lcg(s); return [n / 4294967296, n]; };
const clone = x => JSON.parse(JSON.stringify(x));

function incomingFor(layer) { return 2 + layer; }

function turnsAllowed(s) {
  // Counts the turn on which the clock fills. That turn is still a turn you act in.
  const step = incomingFor(s.layer);
  return Math.floor((CLOCK_MAX - s.clock - 1) / step) + 1;
}

function burst(s, armour) {
  const fromRoster = s.roster.reduce((t, id) => t + Math.max(1, TOKENS[id].value - armour), 0);
  return fromRoster + FREE_VALUE * turnsAllowed(s);
}

function makeOffers(s) {
  let rs = s.rs;
  const base = 10 + s.layer * 1;
  const offers = [];
  for (let i = 0; i < 3; i++) {
    const [r, ns] = rand(rs); rs = ns;
    offers.push({
      id: `n${s.layer}_${i}`, label: `node ${s.layer}-${i}`,
      cost: i, reach: base + i * 3 + (r < 0.5 ? 0 : 1), armour: i
    });
  }
  return { offers, rs };
}

export function newRun(seed) {
  const s = {
    rs: (seed >>> 0) || 1, screen: 'loadout', layer: 0, turn: 0, clock: 0,
    ram: RAM_MAX, roster: ['t1', 't2', 't3'], burned: [], credits: 0,
    threat: null, offers: [], pending: null, outcome: null, freeSpent: false
  };
  return s;
}

export function allOffers(state) {
  if (state.screen === 'offers') {
    return state.offers.map(o => ({
      id: o.id, label: o.label, cost: o.cost, reach: o.reach,
      achievable: burst(state, o.armour) >= o.reach && o.cost <= state.credits
    }));
  }
  if (state.screen === 'payout' && state.pending) {
    return [{ id: state.pending, label: `token ${state.pending}`, cost: 0, reach: 0, achievable: true }];
  }
  return [];
}

export function legalActions(state) {
  const s = state;
  if (s.screen === 'end') return [];
  if (s.screen === 'loadout') return [{ type: 'onward' }];
  if (s.screen === 'offers') {
    const acts = allOffers(s).filter(o => o.cost <= s.credits).map(o => ({ type: 'take', id: o.id }));
    return acts.length ? acts.concat([{ type: 'bail' }]) : [{ type: 'bail' }];
  }
  if (s.screen === 'payout') {
    if (s.pending && s.roster.length >= ROSTER_CAP) {
      return s.roster.map(id => ({ type: 'release', id }));
    }
    return [{ type: 'onward' }];
  }
  // encounter
  const acts = s.roster.filter(id => TOKENS[id].cost <= s.ram).map(id => ({ type: 'call', id }));
  if (!s.freeSpent) acts.push({ type: 'free' });
  acts.push({ type: 'end' });
  acts.push({ type: 'bail' });
  return acts;
}

export function apply(state, action) {
  const legal = legalActions(state);
  if (!legal.some(a => a.type === action.type && a.id === action.id)) return state;
  const s = clone(state);

  if (action.type === 'bail') { s.screen = 'end'; s.outcome = 'loss'; return s; }

  if (s.screen === 'loadout') {
    const { offers, rs } = makeOffers(s);
    s.offers = offers; s.rs = rs; s.screen = 'offers'; s.credits = 3;
    return s;
  }

  if (s.screen === 'offers') {
    const o = s.offers.find(x => x.id === action.id);
    s.credits -= o.cost;
    s.threat = { id: o.id, integrity: o.reach, armour: o.armour };
    s.screen = 'encounter'; s.turn = 0; s.clock = 0; s.ram = RAM_MAX; s.freeSpent = false;
    return s;
  }

  if (s.screen === 'payout') {
    if (action.type === 'release') {
      s.roster = s.roster.filter(id => id !== action.id);
      return s;
    }
    if (s.pending) { s.roster.push(s.pending); s.pending = null; }
    if (s.layer + 1 >= LAYERS) { s.screen = 'end'; s.outcome = 'win'; return s; }
    s.layer += 1;
    const { offers, rs } = makeOffers(s);
    s.offers = offers; s.rs = rs; s.screen = 'offers';
    return s;
  }

  // encounter
  if (action.type === 'call') {
    const tok = TOKENS[action.id];
    s.ram -= tok.cost;
    s.roster = s.roster.filter(id => id !== action.id);
    s.burned.push(action.id);
    s.threat.integrity -= Math.max(1, tok.value - s.threat.armour);
  } else if (action.type === 'free') {
    s.threat.integrity -= FREE_VALUE;
    s.freeSpent = true;
  } else if (action.type === 'end') {
    s.clock += incomingFor(s.layer);
    s.turn += 1;
    s.ram = RAM_MAX;
    s.freeSpent = false;
  }

  if (s.threat.integrity <= 0) {
    s.threat = null; s.screen = 'payout'; s.credits += 2 + s.layer;
    const free = ALL.filter(id => !s.roster.includes(id) && !s.burned.includes(id));
    s.pending = free.length ? free[0] : null;
    return s;
  }
  if (s.clock >= CLOCK_MAX) { s.screen = 'end'; s.outcome = 'loss'; }
  return s;
}

export function view(state) {
  const s = state;
  return {
    screen: s.screen, terminal: s.screen === 'end', outcome: s.outcome,
    layer: s.layer, layerCount: LAYERS, turn: s.turn,
    turnsAllowed: s.screen === 'encounter' ? turnsAllowed(s) : 0,
    resources: {
      ram: s.ram, ramMax: RAM_MAX,
      roster: s.roster.slice(), rosterCap: ROSTER_CAP,
      burned: s.burned.slice(), credits: s.credits
    },
    pressure: { id: 'clock', value: s.clock, max: CLOCK_MAX },
    threat: s.threat ? { ...s.threat } : null,
    incoming: s.screen === 'encounter'
      ? { value: incomingFor(s.layer), label: `clock +${incomingFor(s.layer)}` } : null,
    free: s.screen === 'encounter' ? { id: 'free', value: FREE_VALUE } : null
  };
}
