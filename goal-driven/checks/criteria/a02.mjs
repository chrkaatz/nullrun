import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A2',
  title: 'Every choice point offers distinct options, priced differently, at least one of which is achievable with what the player currently has.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let points = 0;

    for (const seed of seeds(50)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before } of steps) {
        if (oracle.view(before).screen !== 'offers') continue;
        const offers = oracle.allOffers(before);
        points += 1;

        assert.ok(offers.length >= 3, `only ${offers.length} options at a choice point (seed ${seed})`);
        const ids = new Set(offers.map(o => o.id));
        assert.equal(ids.size, offers.length, `duplicate option ids at a choice point (seed ${seed})`);

        const costs = new Set(offers.map(o => o.cost));
        const reaches = new Set(offers.map(o => o.reach));
        assert.ok(costs.size > 1 || reaches.size > 1,
          `every option identical in cost and reach (seed ${seed}) — not a choice`);

        assert.ok(offers.some(o => o.achievable),
          `no achievable option at layer ${oracle.view(before).layer} (seed ${seed})`);
      }
    }

    assert.ok(points > 0, 'no choice point was ever reached — the check proved nothing');
    note(`inspected ${points} choice points across 50 seeds`);
  }
};
