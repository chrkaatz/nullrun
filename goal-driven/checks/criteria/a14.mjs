import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A14',
  title: 'Every pressure mechanic must bind: removing it changes outcomes materially.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'fail' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(200);

    const probe = oracle.view(oracle.newRun(list[0]));
    const mechanic = probe.pressure && probe.pressure.id;
    assert.ok(mechanic && mechanic !== 'none', 'the game declares no pressure mechanic');

    let withWins = 0, withoutWins = 0, changed = 0;
    for (const seed of list) {
      const a = playRun(oracle, seed, policy, { maxSteps: 800, collect: false });
      const b = playRun(
        { ...oracle, newRun: s => oracle.newRun(s, { disable: [mechanic] }) },
        seed, policy, { maxSteps: 800, collect: false }
      );
      if (a.finalView.outcome === 'win') withWins += 1;
      if (b.finalView.outcome === 'win') withoutWins += 1;
      if (a.finalView.outcome !== b.finalView.outcome) changed += 1;
    }

    const withRate = withWins / list.length, withoutRate = withoutWins / list.length;
    note(`mechanic "${mechanic}": win rate ${(withRate * 100).toFixed(1)}% with, ${(withoutRate * 100).toFixed(1)}% without`);
    note(`outcome changed on ${changed}/${list.length} seeds`);

    assert.ok(changed / list.length >= 0.15,
      `disabling "${mechanic}" changed only ${changed}/200 outcomes — it does not bind`);
    assert.ok(withoutRate > withRate,
      `disabling "${mechanic}" did not make the game easier (${(withoutRate * 100).toFixed(1)}% vs ${(withRate * 100).toFixed(1)}%) — it is not pressure`);
  }
};
