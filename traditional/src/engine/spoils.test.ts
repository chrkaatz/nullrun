import { describe, it, expect } from 'vitest'
import { startRun } from './run'
import { generateOffers, enterNode } from './route'
import { clearNode, takeOperative, takePatch, release, declineSpoils, advanceLayer, bail } from './spoils'
import { CONFIG } from './config'
import { DRAFT_POOL } from './content'

const cleared = (seed = 'S') => clearNode(enterNode(generateOffers(startRun(seed)), 0))

describe('clearNode', () => {
  it('pays the node payout and moves to spoils', () => {
    const s0 = enterNode(generateOffers(startRun('C')), 0)
    const s = clearNode(s0)
    expect(s.screen).toBe('spoils')
    expect(s.credits).toBe(s0.credits + s0.node!.payout)
  })
})

describe('spoils choices', () => {
  it('offers an operative not already on the team', () => {
    const s = cleared()
    if (s.offer) {
      expect(s.team.map(t => t.id)).not.toContain(s.offer)
      expect(DRAFT_POOL).toContain(s.offer)
    }
  })

  it('taking an operative grows the team by exactly one (A3)', () => {
    const s0 = cleared()
    if (!s0.offer) return
    const s = takeOperative(s0)
    expect(s.team).toHaveLength(s0.team.length + 1)
    expect(new Set(s.team.map(t => t.id)).size).toBe(s.team.length)
  })

  it('patch restores integrity and adds nobody', () => {
    const s0 = { ...cleared(), integrity: 10 }
    const s = takePatch(s0)
    expect(s.integrity).toBe(10 + CONFIG.patch)
    expect(s.team).toHaveLength(s0.team.length)
  })

  it('patch is available even with no operative on offer (A6)', () => {
    const s0 = { ...cleared(), offer: null, integrity: 5 }
    expect(takePatch(s0).integrity).toBe(5 + CONFIG.patch)
  })

  it('accepting at the cap forces a release and never exceeds it (A11)', () => {
    const base = cleared()
    const extras = DRAFT_POOL.filter(id => !base.team.some(t => t.id === id))
    let s = { ...base, team: [...base.team] }
    while (s.team.length < CONFIG.teamCap && extras.length) {
      s = { ...s, team: [...s.team, { id: extras.shift()!, spent: false }] }
    }
    if (s.team.length < CONFIG.teamCap || !extras.length) return
    const full = { ...s, offer: extras.shift()!, releasing: false }
    const forced = takeOperative(full)
    expect(forced.releasing).toBe(true)
    expect(forced.team).toHaveLength(CONFIG.teamCap)
    const done = release(forced, forced.team[0].id)
    expect(done.team).toHaveLength(CONFIG.teamCap)
    expect(done.releasing).toBe(false)
  })
})

describe('advanceLayer', () => {
  it('moves to the next layer and offers a route', () => {
    const s0 = cleared()
    const s = advanceLayer(declineSpoils(s0))
    expect(s.layer).toBe(s0.layer + 1)
    expect(s.screen).toBe('route')
    expect(s.offers).toHaveLength(CONFIG.offersPerLayer)
  })

  it('the final layer is the core, entered directly', () => {
    const s0 = { ...cleared(), layer: CONFIG.layers - 1 }
    const s = advanceLayer(declineSpoils(s0))
    expect(s.layer).toBe(CONFIG.layers)
    expect(s.screen).toBe('encounter')
    expect(s.sentinel!.id).toBe('archon')
  })
})

describe('bail', () => {
  it('ends the run as a loss from any encounter state (A6)', () => {
    const s = bail(enterNode(generateOffers(startRun('B')), 0))
    expect(s.screen).toBe('end')
    expect(s.won).toBe(false)
  })
})
