import { describe, it, expect } from 'vitest'
import { OPERATIVES, SENTINELS } from './content'
import { CONFIG } from './config'

describe('content tables', () => {
  it('every operative has a unique id matching its key', () => {
    for (const [key, op] of Object.entries(OPERATIVES)) {
      expect(op.id).toBe(key)
    }
  })

  it('operative costs are within the RAM ceiling', () => {
    for (const op of Object.values(OPERATIVES)) {
      expect(op.cost).toBeGreaterThanOrEqual(0)
      expect(op.cost).toBeLessThanOrEqual(CONFIG.ram)
    }
  })

  it('every operative does something', () => {
    for (const op of Object.values(OPERATIVES)) {
      const effects = [op.damage, op.shield, op.calm, op.refund, op.strip]
      expect(effects.some(v => v !== undefined), `${op.id} is inert`).toBe(true)
    }
  })

  it('has at least four sentinels so a three-of-N offer has choice', () => {
    const route = Object.values(SENTINELS).filter(s => s.tag !== 'CORE')
    expect(route.length).toBeGreaterThanOrEqual(4)
  })

  it('every sentinel has at least one intent and non-zero integrity', () => {
    for (const s of Object.values(SENTINELS)) {
      expect(s.intents.length).toBeGreaterThan(0)
      expect(s.integrity).toBeGreaterThan(0)
    }
  })

  it('exactly one sentinel is the core', () => {
    expect(Object.values(SENTINELS).filter(s => s.tag === 'CORE')).toHaveLength(1)
  })
})
