import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

// Independent oracle: rather than trusting the flag, take the offer and play it out.
// A mismatch in either direction is a lie the player was told before committing.
function clears(oracle, state, offerId) {
  const take = oracle.legalActions(state).find(a => a.type === 'take' && a.id === offerId);
  if (!take) return null;                       // not offered as a legal take: not this check's business
  const startLayer = oracle.view(state).layer;
  let s = oracle.apply(state, take);
  for (let i = 0; i < 400; i++) {
    const v = oracle.view(s);
    if (v.terminal) return v.outcome === 'win';
    if (v.screen !== 'encounter') return v.layer >= startLayer;  // reached payout: cleared
    const a = policy(oracle, s);
    if (!a) return false;
    s = oracle.apply(s, a);
  }
  return false;
}

export default {
  id: 'A16',
  title: 'The player can see whether a choice is achievable before committing to it.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'pass' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    let claimedTrue = 0, claimedFalse = 0;

    for (const seed of seeds(30)) {
      const { steps } = playRun(oracle, seed, policy, { maxSteps: 600 });
      for (const { before } of steps) {
        if (oracle.view(before).screen !== 'offers') continue;
        for (const o of oracle.allOffers(before)) {
          const actual = clears(oracle, before, o.id);
          if (actual === null) continue;
          if (o.achievable) {
            claimedTrue += 1;
            assert.ok(actual, `offer ${o.id} was advertised achievable and could not be cleared (seed ${seed})`);
          } else {
            claimedFalse += 1;
            assert.ok(!actual, `offer ${o.id} was advertised unachievable and cleared anyway (seed ${seed})`);
          }
        }
      }
    }

    assert.ok(claimedTrue > 0, 'no offer was ever advertised achievable');
    assert.ok(claimedFalse > 0,
      'no offer was ever advertised unachievable — the flag is a constant, not information');
    note(`verified ${claimedTrue} achievable and ${claimedFalse} unachievable claims by playing them out`);
  }
};
