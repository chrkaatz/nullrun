import { describe, it, expect } from 'vitest'
import { startRun, ceilingAgainst } from './run'
import { generateOffers, enterNode } from './route'
import { CONFIG } from './config'

const atLayer = (seed: string, layer: number) =>
  generateOffers({ ...startRun(seed), layer })

describe('generateOffers', () => {
  it('offers three distinct sentinels', () => {
    for (let i = 0; i < 50; i++) {
      const s = atLayer(`S-${i}`, 1 + (i % 7))
      expect(s.offers).toHaveLength(CONFIG.offersPerLayer)
      expect(new Set(s.offers.map(o => o.sentinelId)).size).toBe(CONFIG.offersPerLayer)
    }
  })

  it('never prices two offers the same', () => {
    for (let i = 0; i < 50; i++) {
      const s = atLayer(`P-${i}`, 1 + (i % 7))
      expect(new Set(s.offers.map(o => o.payout)).size).toBe(CONFIG.offersPerLayer)
    }
  })

  it('always includes at least one achievable node (A2)', () => {
    for (let i = 0; i < 50; i++) {
      const s = atLayer(`A-${i}`, 1 + (i % 7))
      const achievable = s.offers.some(o => o.integrity <= ceilingAgainst(s, o.guard))
      expect(achievable, `layer ${s.layer} seed A-${i} offered nothing achievable`).toBe(true)
    }
  })

  it('states a truthful ceiling on every offer (A16)', () => {
    const s = atLayer('C', 3)
    for (const o of s.offers) {
      expect(o.ceiling).toBe(ceilingAgainst(s, o.guard))
    }
  })

  it('is deterministic for a seed and layer', () => {
    expect(atLayer('D', 4).offers).toEqual(atLayer('D', 4).offers)
  })

  it('does not mutate the state it is given', () => {
    const before = startRun('M')
    const snapshot = JSON.stringify(before)
    generateOffers(before)
    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('guarantees an achievable node even when the team can bring nothing (A2)', () => {
    const s = generateOffers({ ...startRun('SOFT'), layer: 7, team: [] })
    expect(s.offers).toHaveLength(CONFIG.offersPerLayer)
    expect(s.offers.some(o => o.integrity <= o.ceiling)).toBe(true)
    expect(new Set(s.offers.map(o => o.payout)).size).toBe(CONFIG.offersPerLayer)
    // Softening sets integrity to exactly the ceiling, so this is observable
    // from outside. If it ever stops holding, the case has gone vacuous and
    // the fallback is no longer under test — fail loudly rather than quietly.
    const softened = s.offers.filter(o => o.integrity === o.ceiling)
    expect(softened, 'the softening fallback did not fire').toHaveLength(1)
  })
})

describe('enterNode', () => {
  it('moves to the encounter with heat reset and the team refreshed', () => {
    const s0 = generateOffers({ ...startRun('E'), layer: 2, heat: 40 })
    const spent = { ...s0, team: s0.team.map(t => ({ ...t, spent: true })) }
    const s = enterNode(spent, 0)
    expect(s.screen).toBe('encounter')
    expect(s.heat).toBe(0)
    expect(s.team.every(t => !t.spent)).toBe(true)
    expect(s.spentThisNode).toEqual([])
    expect(s.sentinel).not.toBeNull()
    expect(s.ram).toBe(s.ramMax)
  })

  it('shows an intent immediately, with its damage frozen (A4)', () => {
    const s0 = generateOffers(startRun('I'))
    const s = enterNode(s0, 0)
    expect(s.sentinel!.shownIntent).toBeDefined()
    expect(s.sentinel!.shownDamage).toBe(s.sentinel!.shownIntent.damage)
  })

  it('does not mutate the state it is given', () => {
    const before = generateOffers(startRun('EM'))
    const snapshot = JSON.stringify(before)
    enterNode(before, 0)
    expect(JSON.stringify(before)).toBe(snapshot)
  })
})
