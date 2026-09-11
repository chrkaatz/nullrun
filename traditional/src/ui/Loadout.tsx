import type { RunState } from '../engine/types'
import { OPERATIVES } from '../engine/content'
import { CONFIG } from '../engine/config'
import { ART } from './art'

export function Loadout({ state, onStart }: { state: RunState; onStart: () => void }) {
  return (
    <div className="screen">
      <div className="kicker">NULLRUN · SEED {state.seed}</div>
      <h1>Eight layers.<br />Everyone answers once.</h1>
      <p className="note">
        You descend {CONFIG.layers} layers of a dead arcology toward its core. Each operative
        you call is gone for the rest of that encounter. Heat rises {CONFIG.heatPerTurn} a turn
        and reaches {CONFIG.heatMax}. The press is free and never enough.
      </p>
      <div className="stats">
        <span className="stat"><span>Integrity</span><b className="you">{state.integrity}</b></span>
        <span className="stat"><span>RAM per turn</span><b className="you">{state.ramMax}</b></span>
        <span className="stat"><span>Team</span><b>{state.team.length} of {CONFIG.teamCap}</b></span>
        <span className="stat"><span>Turns per node</span><b className="world">{Math.floor(CONFIG.heatMax / CONFIG.heatPerTurn)}</b></span>
      </div>
      {state.team.map(slot => {
        const op = OPERATIVES[slot.id]
        return (
          <div key={slot.id} className="card">
            <img className="tile" src={ART[slot.id]} alt="" />
            <span className="body">
              <span className="row"><b>{op.name}</b><span className="chip">{op.role} · T{op.tier}</span></span>
              <span className="note">{op.text}</span>
              <span className="mono">COST {op.cost} RAM</span>
            </span>
          </div>
        )
      })}
      <button className="flat" onClick={onStart}><b>DESCEND</b><span className="chip you">LAYER 1</span></button>
    </div>
  )
}
