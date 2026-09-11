import { describe, it, expect } from 'vitest'
import { playRun } from './policy'
import { startRun, ceilingAgainst, pressDamage, turnsAllowed } from './run'
import { scaleAt, generateOffers, enterNode } from './route'
import { CONFIG } from './config'
import { DRAFT_POOL, OPERATIVES, SENTINELS } from './content'
import { call, press, endTurn } from './encounter'
import { clearNode, takePatch } from './spoils'

const SEEDS = Array.from({ length: 200 }, (_, i) => `RUN-${i}`)
const careful = () => SEEDS.map(s => playRun(s, 'careful'))

describe('A1 determinism', () => {
  it('same seed and policy reproduce the run exactly', () => {
    expect(playRun('DET', 'careful')).toEqual(playRun('DET', 'careful'))
  })

  it('reproduces every intermediate state, not just the summary', () => {
    // Comparing summaries only would miss any nondeterminism that does not
    // move a summary field — a different route taken to the same outcome, a
    // different operative drafted, a different intent shown. This replays the
    // whole state sequence and compares it step by step.
    const trace = (seed: string): string[] => {
      const out: string[] = []
      let s = generateOffers(startRun(seed))
      let steps = 0
      while (s.screen !== 'end' && steps++ < 20_000) {
        out.push(JSON.stringify(s))
        if (s.screen === 'route') { s = enterNode(s, 0); continue }
        if (s.screen === 'encounter') {
          const ready = s.team.find(t => !t.spent && OPERATIVES[t.id].cost <= s.ram)
          if (!s.pressedThisTurn) s = press(s)
          else if (ready) s = call(s, ready.id)
          else s = endTurn(s)
          continue
        }
        s = takePatch(s)
      }
      out.push(JSON.stringify(s))
      return out
    }
    for (const seed of ['DET-1', 'DET-2', 'DET-3']) {
      const a = trace(seed)
      const b = trace(seed)
      expect(a.length).toBeGreaterThan(10)
      expect(a).toEqual(b)
      // and a different seed really does diverge, or the above proves nothing
      expect(trace(seed + 'X')).not.toEqual(a)
    }
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

describe('A2 the route stays a choice', () => {
  it('never softens every offer on a screen, and rarely most screens', () => {
    // The A2 fallback rewrites an unreachable node down to the team's ceiling.
    // One softened offer is the guarantee working. A screen where all three
    // are softened is the route ceasing to be a decision, and a high rate
    // across the sample means the content has outrun the team.
    const runs = careful()
    const screens = runs.reduce((n, r) => n + r.route.screens, 0)
    const withSoft = runs.reduce((n, r) => n + r.route.withSoftened, 0)
    const allSoft = runs.reduce((n, r) => n + r.route.allSoftened, 0)
    expect(screens).toBeGreaterThan(500)
    expect(allSoft, `${allSoft} of ${screens} route screens offered nothing but softened nodes`).toBe(0)
    expect(withSoft / screens, 'softening carries too much of the route').toBeLessThan(1 / 3)
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

  it('every draft operative is reachable across the sample', () => {
    // The criterion says every piece of content is reached. Sentinels were the
    // only content it checked; the nine draftable operatives are content too,
    // and nothing asserted they could ever be offered.
    const offered = new Set<string>()
    for (const seed of SEEDS) {
      for (let layer = 1; layer < CONFIG.layers; layer++) {
        let s = { ...startRun(seed), layer, credits: 0 }
        s = clearNode({ ...s, node: { sentinelId: 'cold', integrity: 1, guard: 0, payout: 0, ceiling: 1 } })
        if (s.offer) offered.add(s.offer)
      }
    }
    for (const id of DRAFT_POOL) {
      expect(offered.has(id), `${id} is never offered in 200 seeds`).toBe(true)
    }
  })

  it('every sentinel is met across the sample', () => {
    const seen = new Set(runs.flatMap(r => r.sentinelsSeen))
    for (const s of Object.values(SENTINELS)) {
      expect(seen.has(s.id), `${s.name} never fought`).toBe(true)
    }
  })
})
