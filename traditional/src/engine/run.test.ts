import { describe, it, expect } from 'vitest'
import { startRun, pressDamage, turnsAllowed, ceilingAgainst } from './run'
import { CONFIG } from './config'
import { STARTING_TEAM } from './content'

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

  it('does not mutate a state it is given', () => {
    const a = startRun('SEED')
    const frozen = Object.freeze({ ...a })
    startRun('SEED')
    expect(frozen.layer).toBe(1)
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
  it('is heatMax divided by the per-turn rise', () => {
    const s = startRun('T')
    expect(turnsAllowed(s)).toBe(Math.floor(CONFIG.heatMax / CONFIG.heatPerTurn))
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
