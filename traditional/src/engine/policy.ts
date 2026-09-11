import { CONFIG, type Config } from './config'
import { OPERATIVES } from './content'
import { call, press, endTurn } from './encounter'
import { generateOffers, enterNode } from './route'
import { ceilingAgainst, startRun } from './run'
import { advanceLayer, declineSpoils, takeOperative, takePatch } from './spoils'
import type { RunState } from './types'

export type Policy = 'careful' | 'greedy'

/**
 * CONFIG is declared `as const`, so every number in it is a literal type and
 * `Partial<typeof CONFIG>` would only accept the value already there. A probe
 * that replaces one needs the numbers widened.
 */
export type ConfigOverrides = Partial<LooseConfig>
type LooseConfig = { [K in keyof Config]: Config[K] extends number ? number : Config[K] }

export type RunSummary = {
  won: boolean
  layersCleared: number
  turns: number
  credits: number
  encounters: number
  encounterTurns: number
  instantEncounters: number
  endedByHeat: boolean
  sentinelsSeen: string[]
  callsMade: number
  teamSize: number
  /** A3: counts of accounting violations seen while the run was played. */
  conservation: Conservation
}

/**
 * A3 asks that nothing is silently created, duplicated or destroyed. Counting
 * violations as the run plays is the only way to see them — a summary taken at
 * the end cannot show a resource that went up and came back down.
 */
export type Conservation = {
  overRamMax: number
  duplicateTeam: number
  overTeamCap: number
  creditsFell: number
}

/**
 * Config overrides let A14 ask "what changes if this mechanic is removed?"
 * without a global mutable. Only the fields named are replaced.
 */
export function playRun(
  seed: string,
  policy: Policy,
  overrides: ConfigOverrides = {},
): RunSummary {
  const cfg: LooseConfig = { ...CONFIG, ...overrides }
  let s: RunState = generateOffers(startRun(seed))
  const seen: string[] = []
  let encounters = 0, encounterTurns = 0, instant = 0, steps = 0
  let inEncounter = false
  const conservation: Conservation = {
    overRamMax: 0, duplicateTeam: 0, overTeamCap: 0, creditsFell: 0,
  }
  let credits = 0

  const audit = () => {
    if (s.ram > s.ramMax) conservation.overRamMax++
    if (new Set(s.team.map(t => t.id)).size !== s.team.length) conservation.duplicateTeam++
    if (s.team.length > cfg.teamCap) conservation.overTeamCap++
    if (s.credits < credits) conservation.creditsFell++
    credits = s.credits
  }

  // Encounter bookkeeping lives on the screen's edges, so every encounter is
  // counted however it was entered (route or the core) and however it ended
  // (cleared, killed, or timed out). `turns` survives the exit because only
  // enterNode resets it.
  const sync = () => {
    if (s.screen === 'encounter' && !inEncounter) {
      inEncounter = true
      encounters++
      if (s.sentinel) seen.push(s.sentinel.id)
    } else if (s.screen !== 'encounter' && inEncounter) {
      inEncounter = false
      encounterTurns += s.turns
      if (s.turns === 0) instant++
    }
  }

  while (s.screen !== 'end' && steps < 20_000) {
    sync()
    audit()
    steps++
    if (s.screen === 'route') {
      const indexed = s.offers.map((o, i) => ({ o, i }))
      const pool = policy === 'careful'
        ? (indexed.filter(({ o }) => o.integrity <= ceilingAgainst(s, o.guard)).length
            ? indexed.filter(({ o }) => o.integrity <= ceilingAgainst(s, o.guard))
            : indexed)
        : indexed
      const chosen = pool.sort((a, b) => b.o.payout - a.o.payout)[0].i
      s = enterNode(s, chosen)
      continue
    }
    if (s.screen === 'encounter') {
      const affordable = s.team.filter(
        t => !t.spent && OPERATIVES[t.id].cost <= s.ram,
      )
      const lethal = s.integrity <= s.sentinel!.shownDamage * 1.5
      const healers = affordable
        .filter(t => OPERATIVES[t.id].shield)
        .sort((a, b) => (OPERATIVES[b.id].shield ?? 0) - (OPERATIVES[a.id].shield ?? 0))
      const hitters = affordable
        .filter(t => OPERATIVES[t.id].damage)
        .sort((a, b) => (OPERATIVES[b.id].damage ?? 0) - (OPERATIVES[a.id].damage ?? 0))

      if (!s.pressedThisTurn) s = press(s)
      else if (lethal && healers.length) s = call(s, healers[0].id)
      else if (hitters.length) s = call(s, hitters[0].id)
      else s = endTurnWith(s, cfg)

      continue
    }
    if (s.screen === 'spoils') {
      s = s.integrity < cfg.integrity * 0.5 || !s.offer
        ? takePatch(s)
        : takeOperative(s)
      if (s.releasing) s = advanceLayer(declineSpoils(s))
      continue
    }
  }
  // A run that hits the cap would otherwise be reported as an ordinary loss and
  // fold a fabricated data point into every statistic this task produces.
  if (steps >= 20_000) throw new Error(`run ${seed} (${policy}) did not terminate`)
  sync()
  audit()

  return {
    won: s.won,
    layersCleared: Math.max(0, s.layer - (s.won ? 0 : 1)),
    turns: encounterTurns,
    credits: s.credits,
    encounters,
    encounterTurns,
    instantEncounters: instant,
    endedByHeat: !s.won && s.heat >= cfg.heatMax,
    sentinelsSeen: seen,
    callsMade: s.callsMade,
    teamSize: s.team.length,
    conservation,
  }
}

/** endTurn honouring a heatMax override, for A14's removal probe. */
function endTurnWith(s: RunState, cfg: LooseConfig): RunState {
  if (cfg.heatMax === CONFIG.heatMax) return endTurn(s)
  // endTurn reads CONFIG.heatMax directly, so the override is applied by
  // shifting heat below it first. With a very large override this pins heat at
  // one tick, which is a faithful removal rather than a delay: enterNode zeroes
  // heat per node, so nothing accumulates a level across nodes.
  return endTurn({ ...s, heat: Math.max(0, s.heat - cfg.heatMax) })
}
