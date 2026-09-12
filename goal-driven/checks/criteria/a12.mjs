import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A12',
  title: 'Damage mitigation never reduces an attack to nothing unless the rules say so explicitly.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let offensive = 0, againstArmour = 0, maxArmour = 0;

    for (const seed of seeds(60)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before, action, after } of steps) {
        if (action.type !== 'call' && action.type !== 'free') continue;
        const b = oracle.view(before);
        if (b.screen !== 'encounter' || !b.threat) continue;
        const a = oracle.view(after);

        // The threat is either still standing, or it was cleared by this action.
        const remaining = a.threat && a.threat.id === b.threat.id ? a.threat.integrity : 0;
        const dealt = b.threat.integrity - remaining;
        offensive += 1;
        maxArmour = Math.max(maxArmour, b.threat.armour);
        if (b.threat.armour > 0) againstArmour += 1;

        assert.ok(dealt >= 1,
          `a ${action.type} dealt ${dealt} against armour ${b.threat.armour} (seed ${seed})`);
      }
    }

    assert.ok(offensive > 0, 'no offensive action was ever taken — the check proved nothing');
    assert.ok(againstArmour > 0,
      'no offensive action ever met armour — mitigation was never exercised');
    note(`${offensive} offensive actions, ${againstArmour} against armour, highest armour ${maxArmour}`);
  }
};
