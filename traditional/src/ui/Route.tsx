import type { RunState } from '../engine/types'
import { SENTINELS } from '../engine/content'
import { CONFIG } from '../engine/config'

export function Route({ state, onChoose }: { state: RunState; onChoose: (i: number) => void }) {
  return (
    <div className="screen">
      <div className="kicker">LAYER {state.layer} OF {CONFIG.layers} · {state.credits}¤</div>
      <h1>Choose your<br />way down.</h1>
      {state.offers.map((o, i) => {
        const def = SENTINELS[o.sentinelId]
        const within = o.integrity <= o.ceiling
        return (
          <button key={o.sentinelId} className="node" onClick={() => onChoose(i)}>
            <span className="row"><b>{def.name}</b><span className="chip">{def.tag}</span></span>
            <span className="note">Integrity {o.integrity} · guard {o.guard}</span>
            <span className={within ? 'chip you' : 'chip harm'}>
              {within
                ? `WITHIN REACH · you can bring ${o.ceiling}`
                : `BEYOND REACH · you can bring ${o.ceiling} of ${o.integrity}`}
            </span>
            <span className="mono">PAYOUT {o.payout}¤ · press {i + 1}</span>
          </button>
        )
      })}
    </div>
  )
}
