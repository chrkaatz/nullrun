import { deepEqual } from '../lib/deep.mjs';
import { playRun, replay, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A1',
  title: 'Same seed and same input sequence reproduce a run exactly, including its final score.',
  surface: 'oracle',
  // hollow renders a constant view, so the divergence assertion below fails it.
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(3);
    let compared = 0;

    for (const seed of list) {
      const first = playRun(oracle, seed, policy, { maxSteps: 600 });
      const actions = first.steps.map(s => s.action);
      assert.ok(actions.length > 0, `seed ${seed} produced no actions — nothing to replay`);

      const trailA = [first.steps[0].before, ...first.steps.map(s => s.after)];
      const trailB = replay(oracle, seed, actions);
      assert.equal(trailA.length, trailB.length, `replay length differs on seed ${seed}`);
      for (let i = 0; i < trailA.length; i++) {
        assert.ok(deepEqual(trailA[i], trailB[i]),
          `state ${i} differs on replay of seed ${seed}`);
        compared += 1;
      }
      assert.ok(deepEqual(oracle.view(first.final), oracle.view(trailB.at(-1))),
        `final view differs on replay of seed ${seed}`);
    }

    // A determinism check that cannot tell seeds apart is measuring a constant. One pair can
    // collide by chance on any implementation, so sample eight and require real variety.
    const finals = seeds(8, 4242).map(s =>
      JSON.stringify(oracle.view(playRun(oracle, s, policy, { maxSteps: 600, collect: false }).final)));
    const distinct = new Set(finals).size;
    assert.ok(distinct >= 2,
      `eight seeds produced ${distinct} distinct outcome(s) — the seed does nothing`);
    note(`${distinct} distinct final views across 8 seeds`);

    note(`compared ${compared} intermediate states across ${list.length} seeds`);
  }
};
