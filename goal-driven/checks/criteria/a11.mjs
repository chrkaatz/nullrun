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
    let peakPressure = 0, pressureCeiling = 0;

    for (const seed of seeds(60)) {
      const run = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const v of run.views) {
        states += 1;
        peakPressure = Math.max(peakPressure, v.pressure.value);
        pressureCeiling = Math.max(pressureCeiling, v.pressure.max);
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

      // A cap that moves is tracking its resource. A cap that only ever falls is a mirror; one
      // that only ever rises is a ratchet, and a ratchet is never exceeded either. Neither is a
      // bound. Real caps hold for the length of a run.
      const first = run.views[0];
      for (const v of run.views) {
        assert.equal(v.resources.rosterCap, first.resources.rosterCap,
          `rosterCap changed from ${first.resources.rosterCap} to ${v.resources.rosterCap} mid-run (seed ${seed})`);
        assert.equal(v.resources.ramMax, first.resources.ramMax,
          `ramMax changed from ${first.resources.ramMax} to ${v.resources.ramMax} mid-run (seed ${seed})`);
        assert.equal(v.pressure.max, first.pressure.max,
          `pressure ceiling changed from ${first.pressure.max} to ${v.pressure.max} mid-run (seed ${seed})`);
      }
    }

    assert.ok(states > 0, 'no state was examined');
    assert.ok(rosterAtCap > 0,
      'the roster cap was never reached across 60 seeds — the check proved nothing');
    assert.ok(ramAtCap > 0, 'the ram ceiling was never reached across 60 seeds');

    // A ceiling the meter never comes near bounds nothing. This cannot demand the ceiling be
    // reached — a game a competent player wins is a game where the meter usually does not fill —
    // so it demands the ceiling be of the same order as the values that climb toward it. The
    // factor of two is a judgement, and it is the loosest bound that still rejects a ceiling
    // chosen to be unreachable.
    assert.ok(peakPressure * 2 >= pressureCeiling,
      `pressure peaked at ${peakPressure} against a ceiling of ${pressureCeiling} — the ceiling bounds nothing`);

    note(`${states} states; roster at cap ${rosterAtCap}, ram at ceiling ${ramAtCap}`);
    note(`pressure peaked at ${peakPressure} against ceiling ${pressureCeiling}`);
  }
};
