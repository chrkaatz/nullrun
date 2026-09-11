import { CONFIG } from './config'
import { OPERATIVES, STARTING_TEAM } from './content'
import { makeRng } from './rng'
import type { Operative, RunState } from './types'

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

/**
 * How many turns the player gets to act in one node.
 *
 * Heat rises only when a turn is ended, and the turn that pushes it to heatMax
 * is still a turn you act in — you press, and a kill on that press clears the
 * node through clearNode before the heat check ever runs. So the count is the
 * ceiling, not the floor: at heatMax 100 and heatPerTurn 15 the player acts
 * seven times, not six. Using the floor here understated every ceiling the
 * route screen shows by a whole press, and let A15 pass on the difference.
 */
export function turnsAllowed(_state: RunState): number {
  return Math.ceil(CONFIG.heatMax / CONFIG.heatPerTurn)
}

/** A12: mitigation never reduces a hit to nothing; pierce ignores guard entirely. */
export function mitigate(op: Operative, guard: number): number {
  if (op.damage === undefined) return 0
  return op.pierce ? op.damage : Math.max(CONFIG.minHit, op.damage - guard)
}

/** Prepend a log line, dropping empties so a silent turn leaves no blank row. */
export function logged(state: RunState, note: string): readonly string[] {
  return note ? [note, ...state.log].slice(0, CONFIG.logLines) : state.log
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
    return n + mitigate(op, guard)
  }, 0)
  return Math.round(burst + pressDamage(state) * turnsAllowed(state))
}
