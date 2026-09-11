import { clone, deepEqual, assertSerializable } from './deep.mjs';

// Plays one run to termination under `choose`. Pure with respect to the oracle: every state it
// holds is a value the oracle returned.
//
//   choose(oracle, state) -> Action | null    // null ends the run early
//
// Returns { steps, views, final, finalView, ended }.
//   steps  : [{ before, action, after }]  (only when opts.collect)
//   views  : [View]                       (only when opts.collect)
//   ended  : 'terminal' | 'no-action' | 'declined' | 'maxSteps'
export function playRun(oracle, seed, choose, opts = {}) {
  const { maxSteps = 2000, collect = true } = opts;
  let state = oracle.newRun(seed);
  assertSerializable(state, `newRun(${seed})`);

  const steps = [];
  const views = [];
  let ended = 'maxSteps';
  let n = 0;

  while (n < maxSteps) {
    const v = oracle.view(state);
    if (collect) views.push(clone(v));
    if (v.terminal) { ended = 'terminal'; break; }

    const legal = oracle.legalActions(state);
    if (!legal || legal.length === 0) { ended = 'no-action'; break; }

    const action = choose(oracle, state);
    if (action === null || action === undefined) { ended = 'declined'; break; }

    const before = clone(state);
    const after = oracle.apply(state, action);
    if (collect) steps.push({ before, action: clone(action), after: clone(after) });

    // apply must not mutate its argument (contract, Surface 1).
    if (!deepEqual(before, state)) {
      throw new Error(`apply mutated its argument at step ${n} (seed ${seed})`);
    }
    state = after;
    n += 1;
  }

  return { steps, views, final: state, finalView: oracle.view(state), ended };
}

// Replays a recorded action sequence from a fresh newRun. Used by A1.
export function replay(oracle, seed, actions) {
  let state = oracle.newRun(seed);
  const trail = [clone(state)];
  for (const a of actions) {
    state = oracle.apply(state, a);
    trail.push(clone(state));
  }
  return trail;
}

// A deterministic seed list. Fixed so a failure is reproducible across iterations.
export function seeds(count, base = 1000) {
  return Array.from({ length: count }, (_, i) => base + i * 7919);
}
