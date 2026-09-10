import { CONFIG } from './config'
import { OPERATIVES, STARTING_TEAM } from './content'
import { makeRng } from './rng'
import type { RunState } from './types'

export function startRun(seed: string): RunState {
  const s = seed.toUpperCase()
  return {
    seed: s,
    rngState: makeRng(s).state(),
    screen: 'loadout',
    layer: 1,
    integrity: CONFIG.integrity,
    ram: CONFIG.ram,
    ramMax: CONFIG.ram,
    heat: 0,
    credits: 0,
    turns: 0,
    callsMade: 0,
    team: STARTING_TEAM.map(id => ({ id, spent: false })),
    spentThisNode: [],
    pressedThisTurn: false,
    offers: [],
    node: null,
    sentinel: null,
    offer: null,
    releasing: false,
    log: [],
    won: false,
  }
}

/** The free action grows with depth, because sentinel integrity does. */
export function pressDamage(state: RunState): number {
  return CONFIG.pressDamage + (state.layer - 1) * CONFIG.pressGrowth
}

/** How many turns heat allows in one node. */
export function turnsAllowed(_state: RunState): number {
  return Math.floor(CONFIG.heatMax / CONFIG.heatPerTurn)
}

/**
 * The most damage this team could bring against `guard` before heat ends the
 * node: every unspent operative once, plus a press every allowed turn.
 * A16 requires this to be shown before a node is chosen.
 */
export function ceilingAgainst(state: RunState, guard: number): number {
  const burst = state.team.reduce((n, slot) => {
    if (slot.spent) return n
    const op = OPERATIVES[slot.id]
    if (!op.damage) return n
    return n + (op.pierce ? op.damage : Math.max(CONFIG.minHit, op.damage - guard))
  }, 0)
  return Math.round(burst + pressDamage(state) * turnsAllowed(state))
}
