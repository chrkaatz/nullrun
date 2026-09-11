import type { RunState } from '../engine/types'
import { OPERATIVES } from '../engine/content'
import { CONFIG } from '../engine/config'
import { turnsAllowed } from '../engine/run'
import { ART } from './art'

export function Loadout({ state, onStart }: { state: RunState; onStart: () => void }) {
  return (
    <div className="screen">
      <div className="kicker">NULLRUN · SEED {state.seed}</div>
      <h1>Eight layers.<br />Everyone answers once.</h1>
      {/* What the game is, before any of its numbers. Someone opening this
          cold could read the whole screen and still not know what they were
          being asked to do. */}
      <p className="brief">
        A turn-based deckbuilder where your deck is people, not software. You run a team
        {' '}{CONFIG.layers} layers down a dead arcology toward its core; everyone you call
        answers once and is gone for the rest of that fight, and the system always tells you
        exactly what it will do to you before it does it.
      </p>
      <p className="note">
        Each turn you may call anyone you can afford, press once for free, then end the turn and
        take the hit you were shown. Heat rises {CONFIG.heatPerTurn} a turn toward
        {' '}{CONFIG.heatMax}; when it fills, they have you. Time is the real enemy.
      </p>
      <div className="stats rows">
        <span className="stat"><span>Integrity</span><b className="you">{state.integrity}</b></span>
        <span className="stat"><span>RAM per turn</span><b className="you">{state.ramMax}</b></span>
        <span className="stat"><span>Team</span><b>{state.team.length} of {CONFIG.teamCap}</b></span>
        <span className="stat"><span>Turns per node</span><b className="world">{turnsAllowed(state)}</b></span>
      </div>
      {/* Same grid as the encounter: pillar 3 says the whole team is always
          visible, and a full-width row each pushes the last one off a phone. */}
      <div className="team">
        {state.team.map(slot => {
          const op = OPERATIVES[slot.id]
          return (
            <div key={slot.id} className="op">
              <span className="head"><span>{op.role}</span><span>{op.cost}</span></span>
              <img className="face" src={ART[slot.id]} alt="" />
              <span className="nm">{op.name}</span>
              <span className="tx">{op.text}</span>
            </div>
          )
        })}
      </div>
      <button className="flat" onClick={onStart}><b>DESCEND</b><span className="chip you">LAYER 1</span></button>
    </div>
  )
}
