import { CONFIG } from './config'
import { SENTINELS } from './content'
import { makeRng } from './rng'
import { ceilingAgainst } from './run'
import type { NodeOffer, RunState } from './types'

const ROUTE_IDS = Object.values(SENTINELS)
  .filter(s => s.tag !== 'CORE')
  .map(s => s.id)

function scaleAt(layer: number): number {
  return 1 + (layer - 1) * CONFIG.layerScale
}

/**
 * Three distinct sentinels, priced by their own integrity so no two offers
 * cost the same, and at least one the team can actually clear (A2).
 * The achievable-node guarantee is enforced here, not hoped for: the offer
 * set is drawn once, then reordered without drawing again so determinism holds.
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
  if (!offers.some(o => o.integrity <= o.ceiling)) {
    let e = 0
    for (let i = 1; i < offers.length; i++) {
      if (offers[i].integrity < offers[e].integrity) e = i
    }
    const softened = Math.max(1, offers[e].ceiling)
    offers[e] = {
      ...offers[e],
      integrity: softened,
      payout: CONFIG.payoutFlat + Math.round(softened * CONFIG.payoutPerIntegrity),
    }
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
      max: node.integrity,
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
