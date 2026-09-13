// Deliberate breakages, applied as a proxy over the oracle adapter. Nothing here touches the
// build's internals — a mutant corrupts what the player is told, changes which actions are
// routed, or disables a mechanic through the contract's own option.
//
// `expect` names the criteria that SHOULD catch each mutant. It is documentation of intent; the
// gate in matrix.mjs requires only that *something* catches it, and reports where expectation and
// reality differ.

const wrapAll = (o, over) => ({
  newRun: over.newRun ?? o.newRun,
  legalActions: over.legalActions ?? o.legalActions,
  allOffers: over.allOffers ?? o.allOffers,
  apply: over.apply ?? o.apply,
  view: over.view ?? o.view
});

export const ORACLE_MUTANTS = [
  {
    id: 'm-entropy',
    label: 'newRun mixes real entropy into the run',
    expect: ['A1'],
    wrap: o => wrapAll(o, {
      newRun: (seed, opts) => {
        const s = o.newRun(seed, opts);
        return { ...s, __noise: Math.random() };
      }
    })
  },
  {
    id: 'm-static-seed',
    label: 'newRun ignores the seed',
    // Not A13: `faithful.mjs` fails A13's population-statistic assertions unconditionally
    // (win rate is 100/0 with or without this mutant) — undemonstrable at scaffolding time.
    expect: ['A1'],
    wrap: o => wrapAll(o, { newRun: (_seed, opts) => o.newRun(1, opts) })
  },
  {
    id: 'm-illegal-lands',
    label: 'apply honours actions the player cannot afford',
    expect: ['A5'],
    wrap: o => {
      const m = wrapAll(o, {});
      m.apply = (state, action) => {
        const legal = o.legalActions(state);
        if (legal.some(a => a.type === action.type && a.id === action.id)) return o.apply(state, action);
        // Force it through by pretending the nearest legal action of that type was chosen.
        const near = legal.find(a => a.type === action.type) ?? legal[0];
        return near ? o.apply(state, near) : state;
      };
      return m;
    }
  },
  {
    id: 'm-blunted-call',
    label: 'calling a contact does nothing at all',
    expect: ['A12', 'A3', 'A16'],
    wrap: o => wrapAll(o, {
      apply: (state, action) => (action.type === 'call' ? state : o.apply(state, action))
    })
  },
  {
    id: 'm-dead-end',
    label: 'legalActions goes empty inside an encounter',
    expect: ['A6', 'A3', 'A16'],
    wrap: o => wrapAll(o, {
      legalActions: state => {
        const v = o.view(state);
        if (v.screen === 'encounter' && v.turn >= 2) return [];
        return o.legalActions(state);
      }
    })
  },
  {
    id: 'm-cap-lie',
    label: 'the roster cap is reported below the roster it holds',
    expect: ['A11'],
    wrap: o => wrapAll(o, {
      view: state => {
        const v = o.view(state);
        const n = v.resources.roster.length;
        if (n === 0) return v;
        return { ...v, resources: { ...v.resources, rosterCap: n - 1 } };
      }
    })
  },
  {
    id: 'm-harm-understated',
    label: 'incoming harm is displayed at half its value',
    expect: ['A4'],
    wrap: o => wrapAll(o, {
      view: state => {
        const v = o.view(state);
        if (!v.incoming) return v;
        return { ...v, incoming: { ...v.incoming, value: Math.floor(v.incoming.value / 2) } };
      }
    })
  },
  {
    id: 'm-always-achievable',
    label: 'every option is advertised as achievable',
    // Not A13, for the same reason as m-static-seed above.
    expect: ['A16'],
    wrap: o => wrapAll(o, {
      allOffers: state => o.allOffers(state).map(x => ({ ...x, achievable: true }))
    })
  },
  {
    id: 'm-never-achievable',
    label: 'no option is advertised as achievable',
    expect: ['A2', 'A3', 'A4', 'A11', 'A12', 'A16'],
    wrap: o => wrapAll(o, {
      allOffers: state => o.allOffers(state).map(x => ({ ...x, achievable: false }))
    })
  },
  {
    id: 'm-single-offer',
    label: 'only one option is ever presented',
    expect: ['A2', 'A3', 'A4', 'A11', 'A12', 'A16'],
    wrap: o => wrapAll(o, {
      allOffers: state => o.allOffers(state).slice(0, 1)
    })
  },
  {
    id: 'm-uniform-offers',
    label: 'every option costs and reaches the same',
    expect: ['A2', 'A3', 'A4', 'A11', 'A12'],
    wrap: o => wrapAll(o, {
      allOffers: state => {
        const list = o.allOffers(state);
        if (list.length === 0) return list;
        const { cost, reach } = list[0];
        return list.map(x => ({ ...x, cost, reach }));
      }
    })
  },
  {
    id: 'm-turns-inflated',
    label: 'the player is told they have three times the turns they have',
    expect: ['A15'],
    wrap: o => wrapAll(o, {
      view: state => {
        const v = o.view(state);
        return { ...v, turnsAllowed: v.turnsAllowed * 3 };
      }
    })
  },
  {
    id: 'm-pressure-inert',
    label: 'the pressure mechanic is disabled through the contract',
    // Not A14: A14's own kill is undemonstrable at scaffolding time — it requires disabling the
    // mechanic to *raise* the win rate, and `faithful.mjs` already wins 200/200 with it active,
    // so no mutant can push that rate any higher. A14's lethality can only be shown once a real
    // oracle exists. A17 is symmetric (it too fails this control unconditionally on win rate).
    expect: ['A4', 'A11', 'A16'],
    wrap: o => wrapAll(o, {
      newRun: (seed, opts = {}) => {
        const probe = o.view(o.newRun(seed, opts));
        const id = probe.pressure && probe.pressure.id;
        return o.newRun(seed, { ...opts, disable: [...(opts.disable ?? []), ...(id ? [id] : [])] });
      }
    })
  }
];
