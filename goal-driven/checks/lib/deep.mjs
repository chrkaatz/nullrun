// Structural helpers. Contract states are JSON-serializable, so JSON is the whole story.

export function stableStringify(x) {
  // JSON.stringify collapses every non-finite number to "null", which would make NaN and null
  // compare equal — and deepEqual is what the determinism check uses. '#' cannot begin any
  // JSON fragment the rest of this function emits, so these tokens cannot collide.
  if (typeof x === 'number' && !Number.isFinite(x)) return '#' + String(x);
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return '[' + x.map(stableStringify).join(',') + ']';
  const keys = Object.keys(x).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(x[k])).join(',') + '}';
}

export function deepEqual(a, b) {
  return stableStringify(a) === stableStringify(b);
}

export function clone(x) {
  return JSON.parse(JSON.stringify(x));
}

// Throws if a value cannot survive a JSON round trip unchanged. The contract requires it, and a
// violation here is the cheapest possible explanation for a mysterious determinism failure.
export function assertSerializable(x, label) {
  const bad = [];
  (function walk(v, path) {
    if (typeof v === 'number' && !Number.isFinite(v)) { bad.push(path || '(root)'); return; }
    if (v === null || typeof v !== 'object') return;
    if (Array.isArray(v)) { v.forEach((e, i) => walk(e, `${path}[${i}]`)); return; }
    for (const k of Object.keys(v)) walk(v[k], path ? `${path}.${k}` : k);
  })(x, '');
  if (bad.length) {
    throw new Error(`${label} holds non-finite numbers at: ${bad.slice(0, 5).join(', ')}`);
  }
  const round = JSON.parse(JSON.stringify(x));
  if (!deepEqual(x, round)) {
    throw new Error(`${label} is not JSON-serializable without loss`);
  }
  return round;
}
