import { playRun, seeds } from '../lib/harness.mjs';
import { policy, makeLazyPolicy } from '../policy.mjs';

export default {
  id: 'A13',
  title: 'No resource may be bounded such that the outcome is decided before play begins.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'fail' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(200);

    // (i) Outcomes are not constant across the sample.
    const outcomes = { win: 0, loss: 0, other: 0 };
    for (const seed of list) {
      const r = playRun(oracle, seed, policy, { maxSteps: 800, collect: false });
      const o = r.finalView.outcome;
      if (o === 'win') outcomes.win += 1;
      else if (o === 'loss') outcomes.loss += 1;
      else outcomes.other += 1;
    }
    note(`competent policy: ${outcomes.win} wins, ${outcomes.loss} losses, ${outcomes.other} neither`);
    assert.ok(outcomes.win > 0 && outcomes.loss > 0,
      `outcome is constant across 200 seeds (${JSON.stringify(outcomes)}) — settled before play`);

    // (ii) Achievability varies. If every option is always achievable, or never, the choice is
    // arithmetic rather than play.
    let allAchievable = 0, noneAchievable = 0, mixed = 0;
    for (const seed of list.slice(0, 60)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 800 });
      for (const { before } of steps) {
        if (oracle.view(before).screen !== 'offers') continue;
        const offers = oracle.allOffers(before);
        const n = offers.filter(o => o.achievable).length;
        if (n === offers.length) allAchievable += 1;
        else if (n === 0) noneAchievable += 1;
        else mixed += 1;
      }
    }
    note(`choice points: ${allAchievable} all-achievable, ${mixed} mixed, ${noneAchievable} none`);
    assert.ok(mixed > 0,
      'every choice point was uniformly achievable or uniformly not — the route is a formality');

    // (iii) Play matters. A deliberately weak player must not match the competent one.
    let lazyWins = 0, diverged = 0;
    for (const seed of list) {
      const lazy = playRun(oracle, seed, makeLazyPolicy(), { maxSteps: 800, collect: false });
      const comp = playRun(oracle, seed, policy, { maxSteps: 800, collect: false });
      if (lazy.finalView.outcome === 'win') lazyWins += 1;
      if (lazy.finalView.outcome !== comp.finalView.outcome) diverged += 1;
    }
    const divergence = diverged / list.length;
    note(`weak player won ${lazyWins}/200; outcomes diverged from competent on ${diverged}/200 (${(divergence * 100).toFixed(1)}%)`);
    assert.ok(divergence >= 0.20,
      `the weak and competent players reached the same outcome on ${(100 - divergence * 100).toFixed(1)}% of seeds — play barely matters`);
    assert.ok(lazyWins < outcomes.win,
      `the weak player won as often as the competent one (${lazyWins} vs ${outcomes.win})`);
  }
};
