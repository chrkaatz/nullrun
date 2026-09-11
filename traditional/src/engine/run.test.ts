import { describe, it, expect } from 'vitest'
import { startRun, pressDamage, turnsAllowed, ceilingAgainst } from './run'
import { CONFIG } from './config'
import { STARTING_TEAM } from './content'
import { generateOffers, enterNode } from './route'
import { press, endTurn } from './encounter'

describe('startRun', () => {
  it('starts on the loadout screen at layer 1 with a full team', () => {
    const s = startRun('SEED')
    expect(s.screen).toBe('loadout')
    expect(s.layer).toBe(1)
    expect(s.team.map(t => t.id)).toEqual([...STARTING_TEAM])
    expect(s.team.every(t => !t.spent)).toBe(true)
    expect(s.integrity).toBe(CONFIG.integrity)
    expect(s.heat).toBe(0)
    expect(s.won).toBe(false)
  })

  it('is a pure function of its seed', () => {
    expect(startRun('X')).toEqual(startRun('X'))
  })
})

describe('immutability', () => {
  it('never mutates a state it is handed', () => {
    const s = startRun('SEED')
    const frozen = Object.freeze({
      ...s,
      team: Object.freeze(s.team.map(t => Object.freeze({ ...t }))),
    })
    const snapshot = JSON.stringify(frozen)
    pressDamage(frozen)
    turnsAllowed(frozen)
    ceilingAgainst(frozen, 0)
    ceilingAgainst(frozen, 3)
    expect(JSON.stringify(frozen)).toBe(snapshot)
  })
})

describe('pressDamage', () => {
  it('grows with depth', () => {
    const s = startRun('P')
    const l1 = pressDamage({ ...s, layer: 1 })
    const l5 = pressDamage({ ...s, layer: 5 })
    expect(l1).toBe(CONFIG.pressDamage)
    expect(l5).toBeGreaterThan(l1)
  })
})

describe('turnsAllowed', () => {
  it('is heatMax divided by the per-turn rise, rounded up', () => {
    const s = startRun('T')
    expect(turnsAllowed(s)).toBe(Math.ceil(CONFIG.heatMax / CONFIG.heatPerTurn))
  })
})

describe('ceilingAgainst', () => {
  it('counts every unspent operative plus presses for every allowed turn', () => {
    const s = startRun('C')
    const ceiling = ceilingAgainst(s, 0)
    expect(ceiling).toBeGreaterThan(0)
    // strictly greater than the team alone, because presses are included
    const teamOnly = 5 + 8 + 16 // bishop + mole + hatchet at guard 0
    expect(ceiling).toBeGreaterThan(teamOnly)
  })

  it('is reduced by guard, but pierce ignores it', () => {
    const s = startRun('C')
    expect(ceilingAgainst(s, 3)).toBeLessThan(ceilingAgainst(s, 0))
  })

  it('ignores operatives already spent this node', () => {
    const s = startRun('C')
    const spent = { ...s, team: s.team.map(t => ({ ...t, spent: true })) }
    expect(ceilingAgainst(spent, 0)).toBeLessThan(ceilingAgainst(s, 0))
  })
})

describe('turnsAllowed', () => {
  it('is the number of turns the player actually gets to act in', () => {
    // Counted by playing a node out against a sentinel nothing can kill, so the
    // only thing that ends it is heat. Asserting the formula against itself
    // would have missed the off-by-one this replaced.
    let s = enterNode(generateOffers({ ...startRun('TURNS'), layer: 7 }), 0)
    s = { ...s, integrity: 99_999, sentinel: { ...s.sentinel!, integrity: 99_999 } }
    let acted = 0
    while (s.screen === 'encounter') {
      const before = s.sentinel!.integrity
      s = press(s)
      if (s.sentinel!.integrity < before) acted++
      s = endTurn(s)
    }
    expect(acted).toBe(turnsAllowed(s))
  })
})
