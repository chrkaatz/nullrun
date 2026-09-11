import { CONFIG } from './config'
import { DRAFT_POOL, SENTINELS } from './content'
import { makeRng } from './rng'
import { generateOffers, enterNode } from './route'
import { ceilingAgainst, logged } from './run'
import type { OperativeId, RunState } from './types'

/**
 * Keyed on (seed, layer), but the result also depends on the team: it can only
 * offer someone not already held. That is intentional, and the key alone does
 * not determine the answer.
 */
function nextOffer(state: RunState): OperativeId | null {
  const held = new Set(state.team.map(t => t.id))
  const avail = DRAFT_POOL.filter(id => !held.has(id))
  if (!avail.length) return null
  return makeRng(`${state.seed}:spoils:${state.layer}`).pick(avail)
}

export function clearNode(state: RunState): RunState {
  const paid = state.credits + (state.node?.payout ?? 0)
  const name = state.sentinel?.name ?? 'the node'
  const withLog = {
    ...state,
    credits: paid,
    log: logged(state, `Layer ${state.layer} — ${name} down.`),
  }
  // The fight is over: drop the sentinel and the node rather than carrying a
  // dead encounter's state into screens that have no business reading it.
  const done = { ...withLog, sentinel: null, node: null }
  if (state.layer >= CONFIG.layers) {
    return { ...done, screen: 'end', won: true }
  }
  return { ...done, screen: 'spoils', offer: nextOffer(done), releasing: false }
}

/** A11: at the cap, accepting requires a release first. */
export function takeOperative(state: RunState): RunState {
  if (!state.offer) return advanceLayer(state)
  if (state.team.length >= CONFIG.teamCap) return { ...state, releasing: true }
  return advanceLayer({
    ...state,
    team: [...state.team, { id: state.offer, spent: false }],
    offer: null,
  })
}

export function release(state: RunState, id: OperativeId): RunState {
  if (!state.offer) return state
  const team = state.team.filter(t => t.id !== id)
  // A11: releasing someone who is not on the team would let the offer push the
  // team past the cap. The guard belongs here, not in whoever calls this.
  if (team.length === state.team.length) return state
  return advanceLayer({
    ...state,
    team: [...team, { id: state.offer, spent: false }],
    offer: null,
    releasing: false,
  })
}

export function takePatch(state: RunState): RunState {
  return advanceLayer({
    ...state,
    integrity: state.integrity + CONFIG.patch,
    offer: null,
    releasing: false,
  })
}

export function declineSpoils(state: RunState): RunState {
  return { ...state, offer: null, releasing: false }
}

export function advanceLayer(state: RunState): RunState {
  const layer = state.layer + 1
  if (layer >= CONFIG.layers) {
    // The core alone does not scale with layerScale: route nodes climb toward
    // it, and a core that climbed too would make depth pointless. At the
    // shipped tuning layer-7 nodes land around 112-128 against its fixed 144,
    // so it is the hardest fight without being a different kind of fight.
    const core = SENTINELS.archon
    // The core is entered directly rather than offered, but its ceiling is
    // still stated truthfully: computed against the team as it will be inside
    // the encounter, which enterNode refreshes to fully unspent.
    const refreshed = { ...state, layer, team: state.team.map(t => ({ ...t, spent: false })) }
    const atCore: RunState = {
      ...refreshed,
      offers: [{
        sentinelId: core.id, integrity: core.integrity, guard: core.guard,
        payout: CONFIG.corePayout, ceiling: ceilingAgainst(refreshed, core.guard),
      }],
    }
    return enterNode(atCore, 0)
  }
  return generateOffers({ ...state, layer, offer: null, releasing: false, team: state.team.map(t => ({ ...t, spent: false })) })
}

export function bail(state: RunState): RunState {
  return { ...state, screen: 'end', won: false }
}
