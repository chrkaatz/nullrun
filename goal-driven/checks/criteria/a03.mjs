import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A3',
  title: 'Resource accounting is conserved: nothing is silently created, duplicated or destroyed, over at least 500 turns of play.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let turns = 0, seedsUsed = 0;

    for (const seed of seeds(200)) {
      if (turns >= 500) break;
      seedsUsed += 1;
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });

      for (const { before, action, after } of steps) {
        const b = oracle.view(before).resources;
        const a = oracle.view(after).resources;
        const where = `seed ${seed}, action ${action.type}/${action.id ?? ''}`;

        assert.equal(new Set(b.roster).size, b.roster.length, `duplicate id in roster (${where})`);
        assert.equal(new Set(a.roster).size, a.roster.length, `duplicate id in roster after (${where})`);
        for (const id of a.roster) {
          assert.ok(!a.burned.includes(id), `id ${id} is both live and burned (${where})`);
        }

        assert.ok(a.burned.length >= b.burned.length, `burned list shrank (${where})`);
        for (let i = 0; i < b.burned.length; i++) {
          assert.equal(a.burned[i], b.burned[i], `burned list reordered at ${i} (${where})`);
        }

        assert.ok(a.credits >= 0, `credits went negative (${where})`);
        assert.ok(a.ram >= 0, `ram went negative (${where})`);

        if (action.type === 'call') {
          assert.equal(a.burned.length, b.burned.length + 1,
            `a call burned ${a.burned.length - b.burned.length} ids, expected 1 (${where})`);
          assert.equal(a.burned.at(-1), action.id, `a call burned the wrong id (${where})`);
          assert.ok(b.roster.includes(action.id) && !a.roster.includes(action.id),
            `a call did not remove its id from the roster (${where})`);
        }
        if (action.type === 'release') {
          assert.equal(a.roster.length, b.roster.length - 1, `a release removed other than one (${where})`);
          assert.ok(!a.roster.includes(action.id), `a release kept its id (${where})`);
        }
        if (action.type === 'take') {
          assert.ok(a.roster.length - b.roster.length <= 1, `a take added more than one (${where})`);
        }
        if (action.type === 'end') turns += 1;
      }
    }

    assert.ok(turns >= 500, `only ${turns} turns audited across ${seedsUsed} seeds, need 500`);
    note(`audited ${turns} turns across ${seedsUsed} seeds`);
  }
};
