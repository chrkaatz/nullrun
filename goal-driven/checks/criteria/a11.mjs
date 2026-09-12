import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A11',
  title: 'Any declared cap is enforced and never exceeded.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let rosterAtCap = 0, ramAtCap = 0, states = 0;

    for (const seed of seeds(60)) {
      const run = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const v of run.views) {
        states += 1;
        assert.ok(v.resources.rosterCap > 0, 'rosterCap is not a cap');
        assert.ok(v.resources.ramMax > 0, 'ramMax is not a cap');
        assert.ok(v.pressure.max > 0, 'the pressure meter has no ceiling');

        assert.ok(v.resources.roster.length <= v.resources.rosterCap,
          `roster ${v.resources.roster.length} exceeds cap ${v.resources.rosterCap} (seed ${seed})`);
        assert.ok(v.resources.ram <= v.resources.ramMax,
          `ram ${v.resources.ram} exceeds max ${v.resources.ramMax} (seed ${seed})`);
        assert.ok(v.pressure.value <= v.pressure.max,
          `pressure ${v.pressure.value} exceeds max ${v.pressure.max} (seed ${seed})`);

        if (v.resources.roster.length === v.resources.rosterCap) rosterAtCap += 1;
        if (v.resources.ram === v.resources.ramMax) ramAtCap += 1;
      }
    }

    assert.ok(states > 0, 'no state was examined');
    assert.ok(rosterAtCap > 0,
      'the roster cap was never reached across 60 seeds — the check proved nothing');
    assert.ok(ramAtCap > 0, 'the ram ceiling was never reached across 60 seeds');
    note(`${states} states; roster at cap ${rosterAtCap}, ram at ceiling ${ramAtCap}`);
  }
};
