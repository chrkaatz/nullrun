import { describe, it, expect } from 'vitest'
import { playRun } from './policy'
import { startRun, ceilingAgainst, pressDamage, turnsAllowed } from './run'
import { CONFIG } from './config'
import { SENTINELS } from './content'

const SEEDS = Array.from({ length: 200 }, (_, i) => `RUN-${i}`)
const careful = () => SEEDS.map(s => playRun(s, 'careful'))

describe('A1 determinism', () => {
  it('same seed and policy reproduce the run exactly', () => {
    expect(playRun('DET', 'careful')).toEqual(playRun('DET', 'careful'))
  })
})

describe('A3 conservation', () => {
  it('the team never duplicates or exceeds the cap, over 500+ turns', () => {
    let turns = 0
    for (const s of SEEDS) {
      const r = playRun(s, 'careful')
      turns += r.turns
      expect(r.teamSize).toBeLessThanOrEqual(CONFIG.teamCap)
    }
    expect(turns).toBeGreaterThan(500)
  })
})

describe('A15 the free action cannot carry a node', () => {
  it('pressing every allowed turn falls short of the softest node at every layer', () => {
    const softest = Math.min(
      ...Object.values(SENTINELS).filter(s => s.tag !== 'CORE').map(s => s.integrity),
    )
    for (let layer = 1; layer < CONFIG.layers; layer++) {
      const s = { ...startRun('X'), layer }
      const alone = pressDamage(s) * turnsAllowed(s)
      const target = Math.round(softest * (1 + (layer - 1) * CONFIG.layerScale))
      expect(alone, `layer ${layer}: press alone ${alone} vs ${target}`).toBeLessThan(target)
    }
  })
})

describe('A13 no resource decides the run before play', () => {
  it('the ceiling always exceeds what the team alone can do', () => {
    for (let layer = 1; layer < CONFIG.layers; layer++) {
      const s = { ...startRun('B'), layer }
      const withPress = ceilingAgainst(s, 0)
      const teamOnly = withPress - pressDamage(s) * turnsAllowed(s)
      expect(withPress).toBeGreaterThan(teamOnly)
    }
  })
})

describe('A14 pressure binds', () => {
  it('a policy that ignores the ceiling is ended by heat', () => {
    const greedy = SEEDS.map(s => playRun(s, 'greedy'))
    expect(greedy.filter(r => r.endedByHeat).length).toBeGreaterThan(0)
  })

  it('removing heat changes outcomes materially', () => {
    const on = careful().filter(r => r.won).length
    const off = SEEDS.map(s => playRun(s, 'careful', { heatMax: 1_000_000 }))
      .filter(r => r.won).length
    expect(Math.abs(on - off)).toBeGreaterThan(SEEDS.length * 0.1)
  })
})

describe('A17 viability', () => {
  const runs = careful()

  it('wins between 15% and 65% of runs', () => {
    const rate = runs.filter(r => r.won).length / runs.length
    expect(rate).toBeGreaterThanOrEqual(0.15)
    expect(rate).toBeLessThanOrEqual(0.65)
  })

  it('encounters average at least 2.5 decisions', () => {
    const enc = runs.reduce((n, r) => n + r.encounters, 0)
    const t = runs.reduce((n, r) => n + r.encounterTurns, 0)
    expect(t / enc).toBeGreaterThanOrEqual(2.5)
  })

  it('under a tenth of encounters end before a decision is taken', () => {
    const enc = runs.reduce((n, r) => n + r.encounters, 0)
    const instant = runs.reduce((n, r) => n + r.instantEncounters, 0)
    expect(instant / enc).toBeLessThanOrEqual(0.1)
  })

  it('every sentinel is met across the sample', () => {
    const seen = new Set(runs.flatMap(r => r.sentinelsSeen))
    for (const s of Object.values(SENTINELS)) {
      expect(seen.has(s.id), `${s.name} never fought`).toBe(true)
    }
  })
})
