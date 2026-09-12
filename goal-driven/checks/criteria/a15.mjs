import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A15',
  title: 'No free or renewable action may trivialise the primary resource.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let worst = { margin: Infinity, layer: null, seed: null, freeTotal: 0, reach: 0 };
    let measured = 0;
    const byLayer = new Map();

    for (const seed of seeds(120)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 800 });
      for (const { before } of steps) {
        const v = oracle.view(before);
        if (v.screen !== 'offers') continue;

        const offers = oracle.allOffers(before);
        if (offers.length === 0) continue;
        const softest = offers.slice().sort((a, b) => a.reach - b.reach)[0];
        const take = oracle.legalActions(before).find(a => a.type === 'take' && a.id === softest.id);
        if (!take) continue;

        // Enter the softest node and read the free action against the turns actually granted.
        const inside = oracle.view(oracle.apply(before, take));
        if (inside.screen !== 'encounter' || !inside.free || !inside.threat) continue;

        const freeTotal = inside.free.value * inside.turnsAllowed;
        const margin = inside.threat.integrity - freeTotal;
        measured += 1;
        byLayer.set(v.layer, Math.min(byLayer.get(v.layer) ?? Infinity, margin));
        if (margin < worst.margin) {
          worst = { margin, layer: v.layer, seed, freeTotal, reach: inside.threat.integrity };
        }
      }
    }

    assert.ok(measured > 0, 'no encounter was ever entered — the check proved nothing');
    note(`measured ${measured} softest-node entries; worst margin ${worst.margin} at layer ${worst.layer} (seed ${worst.seed}: free total ${worst.freeTotal} vs reach ${worst.reach})`);
    note(`worst margin by layer: ${[...byLayer.entries()].sort((a, b) => a[0] - b[0]).map(([l, m]) => `L${l}:${m}`).join(' ')}`);

    assert.ok(worst.margin > 0,
      `the free action alone clears the softest node at layer ${worst.layer} (free ${worst.freeTotal} vs reach ${worst.reach}, seed ${worst.seed})`);
  }
};
