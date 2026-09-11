import { describe, it, expect } from 'vitest'
import { playRun } from './policy'
import { startRun, ceilingAgainst, pressDamage, turnsAllowed } from './run'
import { scaleAt } from './route'
import { CONFIG } from './config'
import { OPERATIVES, SENTINELS } from './content'

const SEEDS = Array.from({ length: 200 }, (_, i) => `RUN-${i}`)
const careful = () => SEEDS.map(s => playRun(s, 'careful'))

describe('A1 determinism', () => {
  it('same seed and policy reproduce the run exactly', () => {
    expect(playRun('DET', 'careful')).toEqual(playRun('DET', 'careful'))
  })
})

describe('A3 conservation', () => {
  it('creates, duplicates and destroys nothing, over 500+ turns', () => {
    let turns = 0
    for (const r of careful()) {
      turns += r.turns
      expect(r.teamSize).toBeLessThanOrEqual(CONFIG.teamCap)
      expect(r.conservation.overRamMax, 'RAM rose above its declared max').toBe(0)
      expect(r.conservation.duplicateTeam, 'an operative appeared twice on the team').toBe(0)
      expect(r.conservation.overTeamCap, 'the team exceeded its cap mid-run').toBe(0)
      expect(r.conservation.creditsFell, 'credits decreased').toBe(0)
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
      const target = Math.round(softest * scaleAt(layer))
      expect(alone, `layer ${layer}: press alone ${alone} vs ${target}`).toBeLessThan(target)
    }
  })
})

describe('A13 no resource decides the run before play', () => {
  it('the core can be beaten by a team the run can assemble', () => {
    // The failure this criterion names is a run whose outcome is fixed before
    // the first turn. Its sharpest form here is a core no reachable team can
    // clear — which is exactly what the first arm of this experiment shipped.
    const best = Object.values(OPERATIVES)
      .filter(o => o.damage)
      .sort((a, b) => (b.damage ?? 0) - (a.damage ?? 0))
      .slice(0, CONFIG.teamCap)
      .map(o => ({ id: o.id, spent: false }))
    const core = SENTINELS.archon
    const s = { ...startRun('A13'), layer: CONFIG.layers, team: best }
    expect(ceilingAgainst(s, core.guard)).toBeGreaterThanOrEqual(core.integrity)
  })

  it('and not by the press alone, which would fix the outcome the other way', () => {
    const core = SENTINELS.archon
    const s = { ...startRun('A13'), layer: CONFIG.layers, team: [] }
    expect(ceilingAgainst(s, core.guard)).toBeLessThan(core.integrity)
  })

  it('what the player can bring tracks the team, not the clock', () => {
    // A ceiling that ignored the team would make the route a formality: every
    // node unreachable, every offer softened. That is the shape of the bug the
    // 200-seed run surfaced, and it is invisible to any assertion that only
    // compares the ceiling against itself.
    for (let layer = 1; layer < CONFIG.layers; layer++) {
      const s = { ...startRun('B'), layer }
      const spent = { ...s, team: s.team.map(t => ({ ...t, spent: true })) }
      expect(
        ceilingAgainst(s, 0),
        `layer ${layer}: a fresh team brings no more than an exhausted one`,
      ).toBeGreaterThan(ceilingAgainst(spent, 0))
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
