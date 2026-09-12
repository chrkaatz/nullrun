import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A6',
  title: 'The player always has a legal action, and every screen offers a way onward.',
  surface: 'oracle',
  selftest: { hollow: 'pass', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const screensSeen = new Set();
    let checked = 0;

    for (const seed of seeds(40)) {
      const run = playRun(oracle, seed, policy, { maxSteps: 600 });
      assert.notEqual(run.ended, 'no-action',
        `run dead-ended with no legal action (seed ${seed})`);
      assert.notEqual(run.ended, 'maxSteps',
        `run never terminated within 600 steps (seed ${seed})`);

      for (const v of run.views) {
        screensSeen.add(v.screen);
        if (v.terminal) continue;
        checked += 1;
      }
      for (const { before } of run.steps) {
        const v = oracle.view(before);
        if (v.terminal) continue;
        assert.ok(oracle.legalActions(before).length > 0,
          `no legal action on screen ${v.screen} (seed ${seed})`);
      }
    }

    assert.ok(checked > 0, 'no non-terminal state was ever examined');
    note(`screens reached: ${[...screensSeen].sort().join(', ')}`);
  }
};
