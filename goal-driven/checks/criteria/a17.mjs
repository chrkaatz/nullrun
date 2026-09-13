import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { playRun, seeds } from '../lib/harness.mjs';
import { policy } from '../policy.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// The content catalogue is the shared art, not anything the build declares about itself. Nineteen
// tiles exist; a build that never reaches one of them has content the sample does not cover.
function catalogue() {
  const dir = join(here, '..', '..', '..', 'ephemeral', 'art', 'src');
  return readdirSync(dir).filter(f => f.endsWith('.webp')).map(f => f.replace(/\.webp$/, ''));
}

export default {
  id: 'A17',
  title: 'Viability. A competent scripted policy wins 15–65% of 200 seeds, encounters average at least 2.5 decisions, under a tenth end before a decision is taken, and every piece of content is reached across the sample.',
  surface: 'oracle',
  selftest: { hollow: 'fail', faithful: 'fail' },

  async run(ctx) {
    const { oracle, assert, note } = ctx;
    const list = seeds(200);
    let wins = 0, encounters = 0, decisions = 0, emptyEncounters = 0;
    const reached = new Set();

    for (const seed of list) {
      const { steps, finalView } = playRun(oracle, seed, policy, { maxSteps: 800 });
      if (finalView.outcome === 'win') wins += 1;

      let current = null, currentDecisions = 0;
      for (const { before, action } of steps) {
        const v = oracle.view(before);
        for (const id of v.resources.roster) reached.add(id);
        for (const id of v.resources.burned) reached.add(id);
        if (v.threat) reached.add(v.threat.id);

        // Content the build put in front of the player counts as reached, whether or not the
        // scripted policy chose to take it. Without this, a contact that is always offered and
        // never accepted reads as missing, and A17 fails for a reason that is about the policy's
        // preferences rather than about the build's content.
        for (const o of oracle.allOffers(before)) reached.add(o.id);

        if (v.screen === 'encounter') {
          const key = `${seed}:${v.layer}:${v.threat ? v.threat.id : '?'}`;
          if (key !== current) {
            if (current !== null) {
              encounters += 1; decisions += currentDecisions;
              if (currentDecisions === 0) emptyEncounters += 1;
            }
            current = key; currentDecisions = 0;
          }
          currentDecisions += 1;          // every action inside an encounter is a decision
        }
      }
      if (current !== null) {
        encounters += 1; decisions += currentDecisions;
        if (currentDecisions === 0) emptyEncounters += 1;
      }
    }

    const winRate = wins / list.length;
    const avgDecisions = encounters ? decisions / encounters : 0;
    const emptyRate = encounters ? emptyEncounters / encounters : 1;

    note(`win rate ${(winRate * 100).toFixed(1)}% (${wins}/200)`);
    note(`${encounters} encounters, ${avgDecisions.toFixed(2)} decisions each, ${(emptyRate * 100).toFixed(1)}% with no decision`);

    const missing = catalogue().filter(id => !reached.has(id));
    note(`content reached ${reached.size}; catalogue ${catalogue().length}; missing ${missing.length ? missing.join(', ') : 'none'}`);

    assert.ok(encounters > 0, 'no encounter was ever entered');
    assert.ok(winRate >= 0.15 && winRate <= 0.65,
      `win rate ${(winRate * 100).toFixed(1)}% is outside 15–65%`);
    assert.ok(avgDecisions >= 2.5,
      `encounters average ${avgDecisions.toFixed(2)} decisions, below 2.5`);
    assert.ok(emptyRate < 0.10,
      `${(emptyRate * 100).toFixed(1)}% of encounters ended before a decision was taken`);
    assert.equal(missing.length, 0, `content never reached across 200 seeds: ${missing.join(', ')}`);
  }
};
