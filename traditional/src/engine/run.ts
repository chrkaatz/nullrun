import { CONFIG } from './config'
import { OPERATIVES, STARTING_TEAM } from './content'
import type { NodeOffer, Operative, RunState } from './types'

export function startRun(seed: string): RunState {
  const s = seed.toUpperCase()
  return {
    seed: s,
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

/**
 * Whether a node can be cleared with what the player has. This is the rule A2
 * guarantees, A16 displays and the route generator enforces; it was written
 * out at four call sites, one of them in a React component.
 */
export function withinReach(offer: NodeOffer): boolean {
  return offer.integrity <= offer.ceiling
}

/**
 * How a finished run ended. The End screen used to derive this from heat, which
 * restated the scripted policy's rule in React and — worse — called an aborted
 * run a death: bail() ends the run with heat below heatMax and integrity
 * intact, so the screen announced "you did not come back" to a player who
 * walked out. Aborting is now its own outcome.
 */
export type Ending = 'won' | 'heat' | 'dead' | 'aborted'

export function endingOf(state: RunState): Ending {
  if (state.won) return 'won'
  if (state.heat >= CONFIG.heatMax) return 'heat'
  if (state.integrity <= 0) return 'dead'
  return 'aborted'
}

/** How many of those turns are left from where this state stands. */
export function turnsRemaining(state: RunState): number {
  return Math.ceil((CONFIG.heatMax - state.heat) / CONFIG.heatPerTurn)
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
 * What this team can be relied on to bring against `guard` before heat ends
 * the node: every unspent operative once, plus a press every turn it acts in.
 *
 * It is a floor, not a true maximum, and deliberately so — two things let a
 * real player exceed it. Heat-reducing operatives buy turns the budget does
 * not know about (`tally` at -15 heat is a whole extra turn, and therefore an
 * extra press). And `mitigate` is evaluated against the node's base guard,
 * while `bishop` and `ninth` strip it, so later hits land harder than budgeted.
 * Both err toward understating, which is the safe direction: A16 promises the
 * player what they can count on, and A2 decides achievability on the same
 * conservative figure. Budgeting the strips would make it sharper at the cost
 * of promising a sequencing the player might not find.
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
