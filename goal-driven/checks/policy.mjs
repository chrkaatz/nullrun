// The competent scripted policy. Uses only contract surface: legalActions, allOffers, apply, view.
// Deterministic — ties break on the order legalActions returned, and strictly greater wins.

export function score(v) {
  if (v.terminal) return v.outcome === 'win' ? 1e9 : -1e9;
  let s = 0;
  s += v.layer * 10000;                                   // depth is the point
  s -= (v.threat ? v.threat.integrity : 0) * 100;         // hurt the thing in front of you
  if (v.pressure.max > 0) s -= (v.pressure.value / v.pressure.max) * 5000;
  s += v.resources.credits * 10;
  s += v.resources.roster.length * 50;                    // options are worth something
  s += v.resources.ram;
  return s;
}

export function policy(oracle, state) {
  const legal = oracle.legalActions(state);
  if (!legal || legal.length === 0) return null;
  const v = oracle.view(state);

  // At a choice point, take the hardest node that is advertised as achievable — that is where the
  // payout is. When NOTHING is achievable a competent player still has to move, and takes the
  // softest: ranking the fallback by descending reach would make the policy choose the worst
  // option available, and A13, A15 and A17 are all measured under it.
  if (v.screen === 'offers') {
    const offers = oracle.allOffers(state);
    const pool = offers.filter(o => o.achievable);
    const byId = (a, b) => String(a.id).localeCompare(String(b.id));
    const ranked = pool.length
      ? pool.slice().sort((a, b) => b.reach - a.reach || byId(a, b))
      : offers.slice().sort((a, b) => a.reach - b.reach || byId(a, b));
    for (const o of ranked) {
      const take = legal.find(a => a.type === 'take' && a.id === o.id);
      if (take) return take;
    }
  }

  const now = score(v);
  let best = null, bestScore = -Infinity;
  for (const a of legal) {
    if (a.type === 'bail') continue;                      // never voluntarily abandon the run
    const s = score(oracle.view(oracle.apply(state, a)));
    if (s > bestScore) { bestScore = s; best = a; }
  }
  if (best === null) return legal[0];

  // Nothing on offer improves the position: end the turn rather than churn inside it.
  if (bestScore <= now) {
    const end = legal.find(a => a.type === 'end');
    if (end) return end;
  }
  return best;
}
