import { CONFIG } from './config'
import { OPERATIVES, SENTINELS } from './content'
import { pressDamage } from './run'
import type { OperativeId, RunState } from './types'

export function canCall(state: RunState, id: OperativeId): boolean {
  if (state.screen !== 'encounter' || !state.sentinel) return false
  const slot = state.team.find(t => t.id === id)
  if (!slot || slot.spent) return false
  return OPERATIVES[id].cost <= state.ram
}

/** A5: an operative that cannot be called changes nothing at all. */
export function call(state: RunState, id: OperativeId): RunState {
  if (!canCall(state, id)) return state
  const op = OPERATIVES[id]
  const sent = state.sentinel!
  let integrity = sent.integrity
  let guard = sent.guard
  const notes: string[] = []

  if (op.damage !== undefined) {
    const dealt = op.pierce ? op.damage : Math.max(CONFIG.minHit, op.damage - guard)
    integrity -= dealt
    notes.push(`${op.name} hits for ${dealt}.`)
  }
  if (op.strip !== undefined) {
    guard = Math.max(0, guard - op.strip)
    notes.push(`Guard down to ${guard}.`)
  }
  const playerIntegrity = state.integrity + (op.shield ?? 0)
  if (op.shield) notes.push(`${op.name} buys you ${op.shield} integrity.`)
  const heat = op.calm !== undefined
    ? Math.max(0, Math.min(CONFIG.heatMax, state.heat - op.calm))
    : state.heat
  if (op.calm !== undefined) notes.push(`Heat ${op.calm > 0 ? '-' : '+'}${Math.abs(op.calm)}.`)

  const next: RunState = {
    ...state,
    integrity: playerIntegrity,
    heat,
    ram: state.ram - op.cost + (op.refund ?? 0),
    team: state.team.map(t => (t.id === id ? { ...t, spent: true } : t)),
    spentThisNode: [...state.spentThisNode, id],
    callsMade: state.callsMade + 1,
    sentinel: { ...sent, integrity: Math.max(0, integrity), guard },
    log: [notes.join(' '), ...state.log].slice(0, 4),
  }
  return integrity <= 0 ? clearNode(next) : next
}

/**
 * A15: free, spends nobody, once per turn, and deliberately too weak to
 * finish a node on its own. It is what turns time into damage.
 */
export function press(state: RunState): RunState {
  if (state.screen !== 'encounter' || state.pressedThisTurn || !state.sentinel) return state
  const dealt = pressDamage(state)
  const integrity = state.sentinel.integrity - dealt
  const next: RunState = {
    ...state,
    pressedThisTurn: true,
    sentinel: { ...state.sentinel, integrity: Math.max(0, integrity) },
    log: [`You press for ${dealt}.`, ...state.log].slice(0, 4),
  }
  return integrity <= 0 ? clearNode(next) : next
}

export function endTurn(state: RunState): RunState {
  if (state.screen !== 'encounter' || !state.sentinel) return state
  const heat = state.heat + CONFIG.heatPerTurn
  if (heat >= CONFIG.heatMax) {
    return { ...state, heat: CONFIG.heatMax, screen: 'end', won: false,
             log: ['HEAT COMPLETE. They have you.', ...state.log].slice(0, 4) }
  }

  const sent = state.sentinel
  const notes: string[] = []
  let guard = sent.guard
  if (sent.shownIntent.restore) {
    guard += sent.shownIntent.restore
    notes.push(`${sent.name} restores ${sent.shownIntent.restore} guard.`)
  }
  const integrity = state.integrity - sent.shownDamage   // A4: exactly what was shown
  if (sent.shownDamage > 0) {
    notes.push(`${sent.name} resolves ${sent.shownIntent.label} for ${sent.shownDamage}.`)
  }
  if (integrity <= 0) {
    return { ...state, heat, integrity: 0, screen: 'end', won: false,
             log: [notes.join(' '), ...state.log].slice(0, 4) }
  }

  const defs = SENTINELS[sent.id].intents
  const idx = (sent.intentIndex + 1) % defs.length
  const shown = defs[idx]
  return {
    ...state,
    heat,
    integrity,
    turns: state.turns + 1,
    ram: state.ramMax,
    pressedThisTurn: false,
    sentinel: { ...sent, guard, intentIndex: idx, shownIntent: shown, shownDamage: shown.damage },
    log: [notes.join(' '), ...state.log].slice(0, 4),
  }
}

/** Exported for Task 7, which replaces this stub with the spoils screen. */
export function clearNode(state: RunState): RunState {
  return { ...state, screen: 'spoils' }
}
