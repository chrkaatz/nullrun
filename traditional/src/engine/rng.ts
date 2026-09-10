export type Rng = {
  next(): number
  int(n: number): number
  pick<T>(xs: readonly T[]): T
  shuffle<T>(xs: readonly T[]): T[]
  state(): number
}

function hash(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** mulberry32 over an FNV-1a seed. One generator, threaded explicitly. */
export function makeRng(seed: string): Rng {
  let a = hash(seed)
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (n: number) => Math.floor(next() * n)
  return {
    next,
    int,
    pick: <T,>(xs: readonly T[]): T => xs[int(xs.length)],
    shuffle: <T,>(xs: readonly T[]): T[] => {
      const out = [...xs]
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(i + 1)
        ;[out[i], out[j]] = [out[j], out[i]]
      }
      return out
    },
    state: () => a,
  }
}
