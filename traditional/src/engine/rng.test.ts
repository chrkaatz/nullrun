import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng('SEED-1')
    const b = makeRng('SEED-1')
    const draw = (r: ReturnType<typeof makeRng>) =>
      Array.from({ length: 20 }, () => r.next())
    expect(draw(a)).toEqual(draw(b))
  })

  it('differs between seeds', () => {
    const ra = makeRng('A')
    const rb = makeRng('B')
    const a = Array.from({ length: 20 }, () => ra.next())
    const b = Array.from({ length: 20 }, () => rb.next())
    expect(a).not.toEqual(b)
  })

  it('returns values in [0, 1)', () => {
    const r = makeRng('RANGE')
    for (let i = 0; i < 1000; i++) {
      const v = r.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(n) stays within bounds', () => {
    const r = makeRng('INT')
    for (let i = 0; i < 1000; i++) {
      const v = r.int(7)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(7)
    }
  })

  it('shuffle is a permutation and does not mutate its input', () => {
    const input = Object.freeze([1, 2, 3, 4, 5])
    const out = makeRng('SHUF').shuffle(input)
    expect(out).toHaveLength(5)
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5])
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('shuffle is deterministic per seed', () => {
    const xs = [1, 2, 3, 4, 5, 6, 7, 8]
    expect(makeRng('S').shuffle(xs)).toEqual(makeRng('S').shuffle(xs))
  })
})
