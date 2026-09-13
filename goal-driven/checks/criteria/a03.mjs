import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

export default {
  id: 'A3',
  title: 'Resource accounting is conserved: nothing is silently created, duplicated or destroyed, over at least 500 turns of play.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let turns = 0, seedsUsed = 0, probedCandidates = 0;

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

          // The contract defines a call as spending a resource to act. A call that costs
          // nothing makes the resource decorative, and no other criterion reads a call's price.
          assert.ok(a.ram < b.ram,
            `a call left ram at ${b.ram} — it spent nothing (${where})`);
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

        // Credits may rise only on the action that ENTERS a payout, or out of the loadout where
        // a run is equipped. Permitting any action whose result is a payout screen lets an
        // action taken while already there mint freely.
        if (a.credits > b.credits) {
          const bScreen = oracle.view(before).screen, aScreen = oracle.view(after).screen;
          const entersPayout = bScreen !== 'payout' && aScreen === 'payout';
          assert.ok(entersPayout || bScreen === 'loadout',
            `${action.type} raised credits from ${b.credits} to ${a.credits} without entering a payout (${where})`);
        }

        // Probe the paths the policy never takes. A statistical harness cannot see what its own
        // policy never does, so ask the oracle directly: every action that is LEGAL here gets
        // checked, whether or not the player chose it. `apply` is pure, so this costs nothing
        // but a call and cannot disturb the run in progress.
        for (const cand of oracle.legalActions(before)) {
          const probedView = oracle.view(oracle.apply(before, cand));
          probedCandidates += 1;

          const bScreen = oracle.view(before).screen;
          const entersPayout = bScreen !== 'payout' && probedView.screen === 'payout';
          if (probedView.resources.credits > b.credits) {
            assert.ok(entersPayout || bScreen === 'loadout',
              `${cand.type} raised credits from ${b.credits} to ${probedView.resources.credits} without entering a payout (${where})`);
          }

          if (cand.type === 'take') {
            const offer = oracle.allOffers(before).find(o => o.id === cand.id);
            assert.ok(offer,
              `a take is legal for ${cand.id}, which allOffers does not list (${where})`);
            assert.equal(b.credits - probedView.resources.credits, offer.cost,
              `taking ${cand.id} charged ${b.credits - probedView.resources.credits} against a declared price of ${offer.cost} (${where})`);
          }
          if (cand.type === 'call') {
            const pr = probedView.resources;
            assert.equal(pr.burned.length, b.burned.length + 1,
              `a legal call would burn ${pr.burned.length - b.burned.length} ids, expected 1 (${where})`);
            assert.equal(pr.burned.at(-1), cand.id,
              `a legal call would burn the wrong id (${where})`);
            assert.ok(b.roster.includes(cand.id) && !pr.roster.includes(cand.id),
              `a legal call would not remove ${cand.id} from the roster (${where})`);
            assert.ok(pr.ram < b.ram,
              `a legal call would leave ram at ${b.ram} — it would spend nothing (${where})`);
          }
          if (cand.type === 'bail') {
            const pr = probedView.resources;
            const pAdded = pr.roster.filter(id => !b.roster.includes(id));
            const pRemoved = b.roster.filter(id => !pr.roster.includes(id));
            assert.deepEqual(pAdded, [],
              `bailing added ${pAdded.join(',')} to the roster (${where})`);
            assert.deepEqual(pRemoved, [],
              `bailing removed ${pRemoved.join(',')} from the roster (${where})`);
            assert.ok(pr.ram <= b.ram,
              `bailing raised ram from ${b.ram} to ${pr.ram} (${where})`);
          }
        }

        if (action.type === 'end') turns += 1;
      }
    }

    assert.ok(turns >= 500, `only ${turns} turns audited across ${seedsUsed} seeds, need 500`);
    note(`audited ${turns} turns across ${seedsUsed} seeds`);
    note(`probed ${probedCandidates} legal candidate actions, chosen or not, for silent credit creation`);
  }
};
