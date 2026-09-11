// Structural helpers. Contract states are JSON-serializable, so JSON is the whole story.

export function stableStringify(x) {
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
  const round = JSON.parse(JSON.stringify(x));
  if (!deepEqual(x, round)) {
    throw new Error(`${label} is not JSON-serializable without loss`);
  }
  return round;
}
