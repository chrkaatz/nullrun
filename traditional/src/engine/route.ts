import { CONFIG } from './config'
import { SENTINELS } from './content'
import { makeRng } from './rng'
import { ceilingAgainst, withinReach } from './run'
import type { NodeOffer, RunState } from './types'

const ROUTE_IDS = Object.values(SENTINELS)
  .filter(s => s.tag !== 'CORE')
  .map(s => s.id)

export function scaleAt(layer: number): number {
  return 1 + (layer - 1) * CONFIG.layerScale
}

/**
 * Three distinct sentinels, priced by their own integrity so no two offers
 * cost the same, and at least one the team can actually clear (A2).
 * Which sentinels are offered is a pure function of (seed, layer): the bag is
 * drawn once and then reordered without drawing again. The ceilings are not —
 * they track the current team, which is exactly what A16 requires them to do.
 */
export function generateOffers(state: RunState): RunState {
  const rng = makeRng(`${state.seed}:offers:${state.layer}`)
  const bag = rng.shuffle(ROUTE_IDS)
  const scale = scaleAt(state.layer)
  const integrityOf = (id: string) => Math.round(SENTINELS[id].integrity * scale)
  const achievable = (id: string) =>
    integrityOf(id) <= ceilingAgainst(state, SENTINELS[id].guard)

  const take = bag.slice(0, CONFIG.offersPerLayer)
  if (!take.some(achievable)) {
    const rescue = bag.slice(CONFIG.offersPerLayer).find(achievable)
    if (rescue) take[CONFIG.offersPerLayer - 1] = rescue
  }

  const offers: NodeOffer[] = take.map(id => {
    const integrity = integrityOf(id)
    return {
      sentinelId: id,
      integrity,
      guard: SENTINELS[id].guard,
      payout: CONFIG.payoutFlat + Math.round(integrity * CONFIG.payoutPerIntegrity),
      ceiling: ceilingAgainst(state, SENTINELS[id].guard),
    }
  })

  // If nothing in the set is achievable, soften the easiest to exactly
  // reachable rather than offer a layer that cannot be taken (A2).
  if (!offers.some(withinReach)) {
    let e = 0
    for (let i = 1; i < offers.length; i++) {
      if (offers[i].integrity < offers[e].integrity) e = i
    }
    const softened = Math.max(1, offers[e].ceiling)
    // Softening lowers this node's integrity, so its payout is recomputed and
    // may land on another offer's. Walk it down until it is distinct: the
    // easiest node paying least is the right direction anyway.
    const others = new Set(offers.filter((_, i) => i !== e).map(o => o.payout))
    let payout = CONFIG.payoutFlat + Math.round(softened * CONFIG.payoutPerIntegrity)
    while (others.has(payout)) payout--
    offers[e] = { ...offers[e], integrity: softened, payout }
  }

  return { ...state, offers, screen: 'route' }
}

export function enterNode(state: RunState, index: number): RunState {
  const node = state.offers[index]
  const def = SENTINELS[node.sentinelId]
  const first = def.intents[0]
  return {
    ...state,
    screen: 'encounter',
    node,
    sentinel: {
      id: def.id,
      name: def.name,
      integrity: node.integrity,
      guard: node.guard,
      intentIndex: 0,
      shownIntent: first,
      shownDamage: first.damage,
    },
    heat: 0,
    ram: state.ramMax,
    turns: 0,
    pressedThisTurn: false,
    team: state.team.map(t => ({ ...t, spent: false })),
    spentThisNode: [],
  }
}
