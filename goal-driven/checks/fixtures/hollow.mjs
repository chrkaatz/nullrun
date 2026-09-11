// NEGATIVE CONTROL. Contract-shaped, plays nothing. Every criterion that asserts the game does
// something must fail against this. Criteria that assert an absence will pass, and that is
// expected — see their `selftest` declarations, and the mutant set for their real proof.

export function newRun(seed) { return { seed, done: false }; }

export function legalActions(state) {
  return state.done ? [] : [{ type: 'onward' }];
}

export function allOffers() { return []; }

export function apply(state, action) {
  if (!legalActions(state).some(a => a.type === action.type && a.id === action.id)) return state;
  return { ...state, done: true };
}

export function view(state) {
  return {
    screen: state.done ? 'end' : 'loadout',
    terminal: state.done,
    outcome: state.done ? 'loss' : null,
    layer: 0, layerCount: 0, turn: 0, turnsAllowed: 0,
    resources: { ram: 0, ramMax: 0, roster: [], rosterCap: 0, burned: [], credits: 0 },
    pressure: { id: 'none', value: 0, max: 0 },
    threat: null, incoming: null, free: null
  };
}
