import type { RunState } from '../engine/types'
import { OPERATIVES } from '../engine/content'
import { CONFIG } from '../engine/config'
import { canCall } from '../engine/encounter'
import { ceilingAgainst, pressDamage, turnsRemaining } from '../engine/run'
import { ART } from './art'

/**
 * Press damage is fractional, and rounding it prints a number the engine never
 * uses — 13 where it deals 13.2, 5 where it deals 4.7. Over seven presses that
 * is a whole press of drift in what the player was told. One decimal, and only
 * where there is one.
 */
const showDamage = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1))

/**
 * A7: every value the player needs is text. Colour marks whose a thing is —
 * cyan you, amber the world, rust incoming harm — and never carries state by
 * itself; the bars below each repeat their figure in words. Integrity is
 * ceiled here and nowhere else: the engine keeps the fractional value so the
 * stated ceiling stays truthful, and a sentinel on 0.4 is still alive.
 */
export function Encounter({
  state, onCall, onPress, onEndTurn, onBail,
}: {
  state: RunState
  onCall: (id: string) => void
  onPress: () => void
  onEndTurn: () => void
  onBail: () => void
}) {
  const sent = state.sentinel!
  const left = Math.ceil(sent.integrity)
  const start = state.node?.integrity ?? left
  const reach = ceilingAgainst(state, sent.guard)
  const press = pressDamage(state)
  const turnsLeft = turnsRemaining(state)

  return (
    <div className="screen">
      <div className="kicker">LAYER {state.layer} OF {CONFIG.layers} · TURN {state.turns + 1}</div>

      <div className="row">
        <h1>{sent.name}</h1>
        <span className="chip world">{left} LEFT</span>
      </div>
      <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, (left / start) * 100))}%` }} /></div>

      <img className="art" src={ART[sent.id]} alt="" />

      <div className="intent">
        NEXT: {sent.shownIntent.label} FOR {sent.shownDamage}
        {sent.shownIntent.restore ? ` · RESTORES ${sent.shownIntent.restore} GUARD` : ''}
        <div className="mono">Shown now, lands when you end the turn.</div>
      </div>

      {/* One wrapping row rather than a two-column grid: the same six figures,
          all still in words, in a third of the height. Every one of them is
          needed every turn, so none of it can move off-screen. */}
      <div className="stats">
        <span className="stat you">INTEGRITY <b>{Math.round(state.integrity)}</b></span>
        <span className="stat you">RAM <b>{state.ram}/{state.ramMax}</b></span>
        <span className="stat harm">GUARD <b>{sent.guard}</b></span>
        <span className="stat you">CAN BRING <b>{reach}</b></span>
        <span className="stat world">HEAT <b>{state.heat}/{CONFIG.heatMax}</b></span>
        <span className="stat world">TURNS LEFT <b>{turnsLeft}</b></span>
      </div>
      <div className="bar harm"><i style={{ width: `${Math.min(100, (state.heat / CONFIG.heatMax) * 100)}%` }} /></div>

      <div className="team">
        {state.team.map(slot => {
          const op = OPERATIVES[slot.id]
          const ok = canCall(state, slot.id)
          return (
            <button
              key={slot.id}
              className={slot.spent ? 'op spent' : 'op'}
              onClick={() => onCall(slot.id)}
              disabled={!ok}
            >
              <span className="head">
                <span>{slot.spent ? 'ANSWERED' : op.role}</span>
                <span>{slot.spent ? '—' : op.cost}</span>
              </span>
              <img className="face" src={ART[slot.id]} alt="" />
              <span className="nm">{op.name}</span>
              <span className="tx">{op.text}</span>
            </button>
          )
        })}
      </div>

      <button className="primary" onClick={onPress} disabled={state.pressedThisTurn}>
        {state.pressedThisTurn ? 'PRESSED THIS TURN' : `PRESS · FREE · ${showDamage(press)} DAMAGE`}
      </button>

      {state.spentThisNode.length > 0 && (
        <div className="mono">CALLED HERE: {state.spentThisNode.map(id => OPERATIVES[id].name).join(' → ')}</div>
      )}

      <div className="pair">
        <button onClick={onEndTurn}>
          <b>END TURN</b>
          <span className="chip harm">TAKE {sent.shownDamage} · HEAT +{CONFIG.heatPerTurn}</span>
        </button>
        <button className="narrow" onClick={onBail}>
          <b>ABORT</b>
          <span className="chip">GIVE UP</span>
        </button>
      </div>

      {state.log.length > 0 && (
        <div className="log">{state.log.map((line, i) => <p key={i}>{line}</p>)}</div>
      )}
    </div>
  )
}
