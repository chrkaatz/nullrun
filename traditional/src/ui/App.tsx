import { useState, type ReactElement } from 'react'
import './theme.css'
import type { RunState } from '../engine/types'
import { startRun } from '../engine/run'
import { generateOffers, enterNode } from '../engine/route'
import { call, press, endTurn } from '../engine/encounter'
import { takeOperative, takePatch, release, declineSpoils, advanceLayer, bail } from '../engine/spoils'
import { Loadout } from './Loadout'
import { Route } from './Route'
import { Encounter } from './Encounter'
import { Spoils } from './Spoils'
import { End } from './End'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Seeds are made here, not in the engine: the engine takes a seed and is pure. */
function freshSeed(): string {
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return out
}

/**
 * React holds one RunState and dispatches intent. Every transition below is an
 * engine function; nothing here computes a rule.
 */
export function App() {
  const [state, setState] = useState<RunState>(() => startRun(freshSeed()))

  const screens: Record<RunState['screen'], () => ReactElement> = {
    loadout: () => <Loadout state={state} onStart={() => setState(generateOffers(state))} />,
    route: () => <Route state={state} onChoose={i => setState(enterNode(state, i))} />,
    encounter: () => (
      <Encounter
        state={state}
        onCall={id => setState(call(state, id))}
        onPress={() => setState(press(state))}
        onEndTurn={() => setState(endTurn(state))}
        onBail={() => setState(bail(state))}
      />
    ),
    spoils: () => (
      <Spoils
        state={state}
        onTake={() => setState(takeOperative(state))}
        onPatch={() => setState(takePatch(state))}
        onRelease={id => setState(release(state, id))}
        onDecline={() => setState(advanceLayer(declineSpoils(state)))}
      />
    ),
    end: () => <End state={state} onAgain={() => setState(startRun(freshSeed()))} />,
  }

  return screens[state.screen]()
}
