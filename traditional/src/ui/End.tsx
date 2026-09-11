import type { RunState } from '../engine/types'
import { CONFIG } from '../engine/config'
import { endingOf } from '../engine/run'

const HEADLINE = {
  won: 'The core is dark.',
  heat: 'They found you.',
  dead: 'You did not come back.',
  aborted: 'You walked out.',
} as const

export function End({ state, onAgain }: { state: RunState; onAgain: () => void }) {
  const ending = endingOf(state)
  const detail = {
    won: 'Eight layers down, the arcology stops answering.',
    heat: `Heat reached ${CONFIG.heatMax}. The system stopped guessing where you were.`,
    dead: `Integrity gone on layer ${state.layer}.`,
    aborted: `Pulled the team out on layer ${state.layer}, ${Math.round(state.integrity)} integrity intact.`,
  }[ending]
  return (
    <div className="screen">
      <div className="kicker">RUN OVER · SEED {state.seed}</div>
      <h1>{HEADLINE[ending]}</h1>
      <p className="note">{detail}</p>
      <div className="stats">
        <span className="stat"><span>Outcome</span><b className={state.won ? 'you' : 'harm'}>{ending.toUpperCase()}</b></span>
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
