import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A4',
  title: 'No harm reaches the player that was not shown, at its exact value, before it landed.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let landed = 0;

    for (const seed of seeds(40)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before, action, after } of steps) {
        const b = oracle.view(before);
        if (b.screen !== 'encounter') continue;

        assert.ok(b.incoming !== null,
          `an encounter turn declared no incoming harm (seed ${seed}, turn ${b.turn})`);
        assert.ok(Number.isFinite(b.incoming.value),
          `incoming.value is not a number (seed ${seed})`);

        if (action.type !== 'end') {
          // Harm lands on ending the turn. Nothing else may move the pressure meter.
          const a0 = oracle.view(after);
          if (a0.screen === 'encounter') {
            assert.equal(a0.pressure.value, b.pressure.value,
              `pressure moved on a ${action.type} action (seed ${seed}) — undeclared harm`);
          }
          continue;
        }

        const a = oracle.view(after);
        assert.equal(a.pressure.value - b.pressure.value, b.incoming.value,
          `harm landed at ${a.pressure.value - b.pressure.value}, declared ${b.incoming.value} (seed ${seed}, turn ${b.turn})`);
        landed += 1;
      }
    }

    assert.ok(landed > 0, 'no harm ever landed — the check proved nothing');
    note(`verified ${landed} declared-then-landed harm events`);
  }
};
