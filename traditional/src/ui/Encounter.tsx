import type { RunState } from '../engine/types'
import { OPERATIVES } from '../engine/content'
import { CONFIG } from '../engine/config'
import { canCall } from '../engine/encounter'
import { ceilingAgainst, pressDamage } from '../engine/run'

/**
 * A7: every value the player needs is text. Colour marks whose it is — cyan
 * you, amber the world, rust incoming harm — and never carries the state by
 * itself. Integrity is rounded here and nowhere else: the engine keeps the
 * fractional value so the stated ceiling stays truthful.
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
  const left = Math.round(sent.integrity)
  const reach = ceilingAgainst(state, sent.guard)
  const press = pressDamage(state)
  // Turns you can still END and live: heat + n*heatPerTurn must stay under
  // heatMax, so the turn that reaches it is not one of them. At heat 0 this is
  // turnsAllowed, which is what the stated ceiling is computed from.
  const turnsLeft = Math.ceil((CONFIG.heatMax - state.heat) / CONFIG.heatPerTurn) - 1

  return (
    <div className="screen">
      <div className="kicker">LAYER {state.layer} OF {CONFIG.layers} · TURN {state.turns + 1}</div>
      <div className="row">
        <h1>{sent.name}</h1>
        <span className="chip world">{left} LEFT</span>
      </div>

      <div className="intent">
        NEXT: {sent.shownIntent.label} FOR {sent.shownDamage}
        {sent.shownIntent.restore ? ` · RESTORES ${sent.shownIntent.restore} GUARD` : ''}
        <div className="mono">Shown now, lands when you end the turn.</div>
      </div>

      <div className="stats">
        <span className="stat"><span>Your integrity</span><b className="you">{Math.round(state.integrity)}</b></span>
        <span className="stat"><span>RAM</span><b className="you">{state.ram} of {state.ramMax}</b></span>
        <span className="stat"><span>Heat</span><b className="world">{state.heat} of {CONFIG.heatMax}</b></span>
        <span className="stat"><span>Turns left</span><b className="world">{turnsLeft}</b></span>
        <span className="stat"><span>Sentinel guard</span><b className="harm">{sent.guard}</b></span>
        <span className="stat"><span>You can still bring</span><b className="you">{reach}</b></span>
      </div>

      <button className="flat" onClick={onPress} disabled={state.pressedThisTurn}>
        <b>PRESS</b>
        <span className="chip you">
          {state.pressedThisTurn ? 'SPENT THIS TURN' : `FREE · ${Math.round(press)} DAMAGE`}
        </span>
      </button>

      {state.team.map(slot => {
        const op = OPERATIVES[slot.id]
        const ok = canCall(state, slot.id)
        return (
          <button key={slot.id} onClick={() => onCall(slot.id)} disabled={!ok}>
            <span className="row">
              <b>{op.name}</b>
              <span className={slot.spent ? 'chip' : 'chip you'}>
                {slot.spent ? 'ANSWERED' : ok ? 'READY' : 'NO RAM'}
              </span>
            </span>
            <span className="note">{op.text}</span>
            <span className="mono">{op.role} · T{op.tier} · COST {op.cost} RAM</span>
          </button>
        )
      })}

      {state.spentThisNode.length > 0 && (
        <div className="mono">CALLED HERE: {state.spentThisNode.map(id => OPERATIVES[id].name).join(' → ')}</div>
      )}

      <button className="flat" onClick={onEndTurn}>
        <b>END TURN</b>
        <span className="chip harm">TAKE {sent.shownDamage} · HEAT +{CONFIG.heatPerTurn}</span>
      </button>
      <button className="flat" onClick={onBail}><b>ABORT RUN</b><span className="chip">GIVE UP</span></button>

      {state.log.length > 0 && (
        <div className="log">{state.log.map((line, i) => <p key={i}>{line}</p>)}</div>
      )}
    </div>
  )
}
