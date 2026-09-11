import type { RunState } from '../engine/types'
import { CONFIG } from '../engine/config'

export function End({ state, onAgain }: { state: RunState; onAgain: () => void }) {
  const heat = !state.won && state.heat >= CONFIG.heatMax
  return (
    <div className="screen">
      <div className="kicker">RUN OVER · SEED {state.seed}</div>
      <h1>{state.won ? 'The core is dark.' : heat ? 'They found you.' : 'You did not come back.'}</h1>
      <p className="note">
        {state.won
          ? 'Eight layers down, the arcology stops answering.'
          : heat
            ? 'Heat reached ' + CONFIG.heatMax + '. The system stopped guessing where you were.'
            : 'Integrity gone on layer ' + state.layer + '.'}
      </p>
      <div className="stats">
        <span className="stat"><span>Outcome</span><b className={state.won ? 'you' : 'harm'}>{state.won ? 'CORE DOWN' : 'LOST'}</b></span>
        <span className="stat"><span>Layers cleared</span><b>{Math.max(0, state.layer - (state.won ? 0 : 1))} of {CONFIG.layers}</b></span>
        <span className="stat"><span>Credits</span><b className="world">{state.credits}¤</b></span>
        <span className="stat"><span>Calls made</span><b>{state.callsMade}</b></span>
      </div>
      {state.log.length > 0 && (
        <div className="log">{state.log.map((line, i) => <p key={i}>{line}</p>)}</div>
      )}
      <button className="flat" onClick={onAgain}><b>RUN AGAIN</b><span className="chip you">NEW SEED</span></button>
    </div>
  )
}
