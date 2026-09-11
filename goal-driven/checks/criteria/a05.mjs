import { deepEqual, clone } from '../lib/deep.mjs';
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A5',
  title: 'An action the player cannot afford changes no state at all.',
  surface: 'oracle',
  // hollow does nothing, so it never affords anything and trivially passes. Declared, not hidden.
  selftest: { hollow: 'pass', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let probed = 0;

    for (const seed of seeds(12)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 400 });
      for (const { before } of steps) {
        const legal = oracle.legalActions(before);
        const legalKeys = new Set(legal.map(a => a.type + '/' + (a.id ?? '')));

        // Every offer the player is shown but cannot take, plus every action type not offered.
        const illegal = [];
        for (const o of oracle.allOffers(before)) {
          const key = 'take/' + o.id;
          if (!legalKeys.has(key)) illegal.push({ type: 'take', id: o.id });
        }
        for (const t of ['call', 'free', 'end', 'take', 'release', 'onward', 'bail']) {
          if (![...legalKeys].some(k => k.startsWith(t + '/'))) illegal.push({ type: t });
        }

        for (const action of illegal) {
          const guard = clone(before);
          const after = oracle.apply(before, action);
          assert.ok(deepEqual(after, before),
            `illegal action ${JSON.stringify(action)} changed state (seed ${seed})`);
          assert.ok(deepEqual(guard, before),
            `apply mutated its argument on an illegal action (seed ${seed})`);
          probed += 1;
        }
      }
    }

    note(`probed ${probed} illegal applications across 12 seeds`);
    assert.ok(probed > 0, 'no illegal action was ever reachable — the check proved nothing');
  }
};
