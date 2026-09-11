import type { RunState } from '../engine/types'
import { OPERATIVES } from '../engine/content'
import { CONFIG } from '../engine/config'

/** A6: every screen offers a way onward. The patch is always takeable, so a
 *  spoils screen with nothing on offer is still a screen you can leave. */
export function Spoils({
  state, onTake, onPatch, onRelease, onDecline,
}: {
  state: RunState
  onTake: () => void
  onPatch: () => void
  onRelease: (id: string) => void
  onDecline: () => void
}) {
  const offered = state.offer ? OPERATIVES[state.offer] : null

  if (state.releasing && offered) {
    return (
      <div className="screen">
        <div className="kicker">LAYER {state.layer} CLEAR · {state.credits}¤</div>
        <h1>Team is full.<br />Someone has to go.</h1>
        <p className="note">
          The cap is {CONFIG.teamCap}. Release one to make room for {offered.name}, or walk on.
        </p>
        {state.team.map(slot => {
          const op = OPERATIVES[slot.id]
          return (
            <button key={slot.id} onClick={() => onRelease(slot.id)}>
              <span className="row"><b>RELEASE {op.name}</b><span className="chip">{op.role} · T{op.tier}</span></span>
              <span className="note">{op.text}</span>
            </button>
          )
        })}
        <button className="flat" onClick={onDecline}><b>KEEP THE TEAM</b><span className="chip">DECLINE</span></button>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="kicker">LAYER {state.layer} CLEAR · {state.credits}¤</div>
      <h1>The layer is quiet<br />for now.</h1>
      <div className="stats">
        <span className="stat"><span>Integrity</span><b className="you">{Math.round(state.integrity)}</b></span>
        <span className="stat"><span>Team</span><b>{state.team.length} of {CONFIG.teamCap}</b></span>
      </div>

      {offered ? (
        <button onClick={onTake}>
          <span className="row"><b>CALL IN {offered.name}</b><span className="chip you">JOIN · T{offered.tier}</span></span>
          <span className="note">{offered.text}</span>
          <span className="mono">{offered.role} · COST {offered.cost} RAM</span>
        </button>
      ) : (
        <p className="note">Nobody left to call. Everyone who would answer already has.</p>
      )}

      <button className="flat" onClick={onPatch}>
        <b>PATCH UP</b><span className="chip you">+{CONFIG.patch} INTEGRITY</span>
      </button>
    </div>
  )
}
