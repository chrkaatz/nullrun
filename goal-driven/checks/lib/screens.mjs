import { pathToFileURL } from 'node:url';
import { playRun, seeds } from './harness.mjs';
import { policy } from '../policy.mjs';

export const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [role], [tabindex]:not([tabindex="-1"])';

// Collects one representative View per screen the oracle actually reaches, preferring the most
// populated instance of each — an empty variant of a screen proves the least about layout.
export function representativeViews(oracle, seedCount = 8) {
  const best = new Map();
  const weight = v => v.resources.roster.length + v.resources.burned.length +
                      (v.threat ? 1 : 0) + (v.incoming ? 1 : 0);
  for (const seed of seeds(seedCount)) {
    const run = playRun(oracle, seed, policy, { maxSteps: 600 });
    for (const v of run.views) {
      const prev = best.get(v.screen);
      if (!prev || weight(v) > weight(prev)) best.set(v.screen, v);
    }
  }
  return [...best.entries()].map(([screen, view]) => ({ screen, view }));
}

export async function load(page, artifactPath) {
  await page.goto(pathToFileURL(artifactPath).href);
  await page.waitForLoadState('domcontentloaded');
  const ok = await page.evaluate(() => typeof window.__render === 'function');
  if (!ok) throw new Error('the artifact exposes no window.__render — see ORACLE.md, Surface 2');
}

// Renders each representative View in turn and calls fn(screenName) with the page showing it.
export async function visitStates(page, artifactPath, oracle, fn) {
  await load(page, artifactPath);
  const states = representativeViews(oracle);
  if (states.length === 0) throw new Error('the oracle produced no states to render');
  for (const { screen, view } of states) {
    await page.evaluate(v => window.__render(v), view);
    await fn(screen);
  }
  return states.map(s => s.screen);
}
