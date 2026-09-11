import { describe, it, expect } from 'vitest'
import { startRun, pressDamage } from './run'
import { generateOffers, enterNode } from './route'
import { call, press, endTurn, canCall } from './encounter'
import { CONFIG } from './config'
import { OPERATIVES, SENTINELS } from './content'

const inEncounter = (seed = 'E') => enterNode(generateOffers(startRun(seed)), 0)

describe('call', () => {
  it('spends the operative and reduces RAM', () => {
    const s0 = inEncounter()
    const id = s0.team.find(t => OPERATIVES[t.id].cost <= s0.ram)!.id
    const s = call(s0, id)
    expect(s.team.find(t => t.id === id)!.spent).toBe(true)
    expect(s.ram).toBe(s0.ram - OPERATIVES[id].cost + (OPERATIVES[id].refund ?? 0))
    expect(s.callsMade).toBe(s0.callsMade + 1)
  })

  it('cannot be called twice in one node', () => {
    const s0 = inEncounter()
    const id = s0.team.find(t => OPERATIVES[t.id].cost <= s0.ram)!.id
    const once = call(s0, id)
    const twice = call({ ...once, ram: 9 }, id)
    expect(twice).toEqual({ ...once, ram: 9 })
  })

  it('never lets a refund push RAM above its declared max (A3, A11)', () => {
    // wren costs 0 and refunds 1, so calling it on a full tank creates RAM out
    // of nothing. No scripted policy reaches this — they spend big hitters
    // first — but a player clicking wren on a fresh turn does.
    const s0 = { ...inEncounter(), team: [{ id: 'wren', spent: false }] }
    expect(s0.ram).toBe(s0.ramMax)
    const s = call(s0, 'wren')
    expect(s.ram).toBeLessThanOrEqual(s.ramMax)
  })

  it('an unaffordable operative changes nothing at all (A5)', () => {
    const s0 = { ...inEncounter(), ram: 0 }
    const costly = s0.team.find(t => OPERATIVES[t.id].cost > 0)!.id
    expect(call(s0, costly)).toEqual(s0)
    expect(canCall(s0, costly)).toBe(false)
  })

  it('guard reduces damage but never below 1, and pierce ignores it (A12)', () => {
    const s0 = { ...inEncounter(), ram: 9 }
    const hard = { ...s0, sentinel: { ...s0.sentinel!, guard: 99, integrity: 500 } }
    const blunt = call(hard, 'bishop')
    expect(hard.sentinel!.integrity - blunt.sentinel!.integrity).toBe(1)
    const pierced = call(hard, 'mole')
    expect(hard.sentinel!.integrity - pierced.sentinel!.integrity).toBe(OPERATIVES.mole.damage)
  })
})

describe('press', () => {
  it('is free, spends nobody, and works once per turn (A15)', () => {
    const s0 = inEncounter()
    const s = press(s0)
    expect(s.ram).toBe(s0.ram)
    expect(s.team.filter(t => t.spent)).toHaveLength(0)
    expect(s.pressedThisTurn).toBe(true)
    expect(s.sentinel!.integrity).toBe(s0.sentinel!.integrity - pressDamage(s0))
    expect(press(s)).toEqual(s)
  })
})

describe('endTurn', () => {
  it('resolves exactly the damage that was shown (A4)', () => {
    const s0 = { ...inEncounter(), integrity: 999 }
    const shown = s0.sentinel!.shownDamage
    const s = endTurn(s0)
    expect(s0.integrity - s.integrity).toBe(shown)
  })

  it('raises heat and refreshes RAM and the press', () => {
    const s0 = { ...inEncounter(), integrity: 999, ram: 0, pressedThisTurn: true }
    const s = endTurn(s0)
    expect(s.heat).toBe(s0.heat + CONFIG.heatPerTurn)
    expect(s.ram).toBe(s.ramMax)
    expect(s.pressedThisTurn).toBe(false)
  })

  it('ends the run when heat fills', () => {
    const s0 = { ...inEncounter(), integrity: 999, heat: CONFIG.heatMax - 1 }
    const s = endTurn(s0)
    expect(s.screen).toBe('end')
    expect(s.won).toBe(false)
  })

  it('ends the run when integrity is gone', () => {
    const s0 = { ...inEncounter(), integrity: 1 }
    const s = endTurn(s0)
    expect(s.screen).toBe('end')
    expect(s.won).toBe(false)
  })

  it('advances to the next intent and freezes its damage', () => {
    const s0 = { ...inEncounter('SWEEPY'), integrity: 999 }
    const s = endTurn(s0)
    expect(s.screen, 'the turn ended the run — this case no longer exercises the intent advance').toBe('encounter')
    expect(s.sentinel!.shownIntent).toBe(SENTINELS[s.sentinel!.id].intents[s.sentinel!.intentIndex])
    expect(s.sentinel!.shownDamage).toBe(s.sentinel!.shownIntent.damage)
  })
})
