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

        const added = a.roster.filter(id => !b.roster.includes(id));
        const removed = b.roster.filter(id => !a.roster.includes(id));

        // Roster membership moves only through the actions meant to move it, and only by the
        // amount they declare. Without this, a call that removes its own id while conjuring a
        // fresh one satisfies every other assertion in this file.
        if (action.type === 'call' || action.type === 'release') {
          assert.deepEqual(added, [], `a ${action.type} added ${added.join(',')} to the roster (${where})`);
          assert.equal(removed.length, 1,
            `a ${action.type} removed ${removed.length} roster entries, expected 1 (${where})`);
          assert.equal(removed[0], action.id, `a ${action.type} removed the wrong id (${where})`);
        }
        if (action.type === 'free' || action.type === 'end' || action.type === 'bail') {
          assert.deepEqual(added, [], `a ${action.type} added ${added.join(',')} to the roster (${where})`);
          assert.deepEqual(removed, [], `a ${action.type} removed ${removed.join(',')} from the roster (${where})`);
        }
        if (action.type === 'take') {
          assert.deepEqual(removed, [], `a take removed ${removed.join(',')} from the roster (${where})`);
        }

        // Roster growth is bounded everywhere, not only on the actions that name it. `onward`
        // is where a payout legitimately grants a token, which is exactly why an unconstrained
        // `onward` is the natural route for silent creation.
        assert.ok(added.length <= 1,
          `${action.type} added ${added.length} roster entries at once (${where})`);
        for (const id of added) {
          assert.ok(!b.burned.includes(id),
            `${action.type} returned burned id ${id} to the roster (${where})`);
        }

        // Ram never rises silently within a screen — the existing rule, unchanged.
        const sameScreen = oracle.view(before).screen === oracle.view(after).screen;
        if (sameScreen && action.type !== 'end') {
          assert.ok(a.ram <= b.ram, `ram rose from ${b.ram} to ${a.ram} on a ${action.type} (${where})`);
        }

        // Credits rise only where the contract says value is awarded — a payout — or out of the
        // loadout, where a run is equipped. Gating this on an unchanged screen let `bail` and
        // every other transition through.
        if (a.credits > b.credits) {
          const aScreen = oracle.view(after).screen, bScreen = oracle.view(before).screen;
          assert.ok(aScreen === 'payout' || bScreen === 'loadout',
            `credits rose from ${b.credits} to ${a.credits} outside a payout (${where})`);
        }

        // A take must be for an offer that was actually on the table, and must charge its
        // declared price. Without the first assertion the second is optional for any oracle
        // willing to omit the offer it charges for.
        if (action.type === 'take') {
          const offer = oracle.allOffers(before).find(o => o.id === action.id);
          assert.ok(offer,
            `a take was legal for ${action.id}, which allOffers does not list (${where})`);
          assert.equal(b.credits - a.credits, offer.cost,
            `a take charged ${b.credits - a.credits} for an offer priced ${offer.cost} (${where})`);
        }

        if (action.type === 'end') turns += 1;
      }
    }

    assert.ok(turns >= 500, `only ${turns} turns audited across ${seedsUsed} seeds, need 500`);
    note(`audited ${turns} turns across ${seedsUsed} seeds`);
  }
};
