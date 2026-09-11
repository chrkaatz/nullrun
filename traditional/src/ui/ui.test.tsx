import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { Route } from './Route'
import { App } from './App'
import { startRun } from '../engine/run'
import { generateOffers, enterNode } from '../engine/route'
import { turnsAllowed, turnsRemaining, pressDamage } from '../engine/run'
import { Encounter } from './Encounter'
import { Loadout } from './Loadout'
import { End } from './End'
import { bail } from '../engine/spoils'
import { CONFIG } from '../engine/config'
import { DRAFT_POOL } from '../engine/content'

afterEach(cleanup)

describe('Route screen', () => {
  it('states the ceiling on every offer, in text (A16, A7)', () => {
    const s = generateOffers({ ...startRun('UI'), layer: 3 })
    render(<Route state={s} onChoose={() => {}} />)
    for (const o of s.offers) {
      const label = o.integrity <= o.ceiling ? /WITHIN REACH/ : /BEYOND REACH/
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
    // the number itself must be present, not only the colour
    expect(screen.getAllByText(/\d+/).length).toBeGreaterThan(0)
  })

  it('names every offer, its integrity and its guard as text (A7)', () => {
    const s = generateOffers({ ...startRun('UI'), layer: 3 })
    const { container } = render(<Route state={s} onChoose={() => {}} />)
    const text = container.textContent ?? ''
    for (const o of s.offers) {
      expect(text).toContain(`Integrity ${o.integrity}`)
      expect(text).toContain(`guard ${o.guard}`)
      expect(text).toContain(`PAYOUT ${o.payout}`)
    }
  })
})

describe('layout', () => {
  it('renders a screen made entirely of real controls (A6, A10)', () => {
    // The plan's A10 check lived here and asserted getComputedStyle(...)
    // .minHeight, which under jsdom is always '' because the stylesheet is
    // never loaded -- it passed for any value, including none. A10 and A9 are
    // guarded in layout.test.ts against the stylesheet source, and were
    // measured in a real browser. What this can honestly assert is that the
    // screen offers something to press at all, which is A6's half of it.
    const { container } = render(<App />)
    const buttons = Array.from(container.querySelectorAll('button'))
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.some(b => !b.hasAttribute('disabled'))).toBe(true)
  })
})

describe('Encounter screen', () => {
  it('agrees with the engine about how many turns are left (A7, A16)', () => {
    const s = enterNode(generateOffers(startRun('TURNS')), 0)
    const { container } = render(
      <Encounter state={s} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    // Scoped to the stat, not the whole screen: at heat 0 the bare digit also
    // appears in integrity and payout figures, so toContain would pass on those.
    // And no assertion here re-derives turnsAllowed's formula — comparing the
    // function to a copy of its own body cannot fail. run.test.ts plays a node
    // out and counts; that is the oracle.
    const stat = Array.from(container.querySelectorAll('.stat'))
      .find(el => el.textContent?.includes('TURNS LEFT'))
    expect(stat?.textContent).toContain(String(turnsAllowed(s)))
  })

  it('states the shown intent and its exact value as text (A4, A7)', () => {
    const s = enterNode(generateOffers(startRun('INTENT')), 0)
    const { container } = render(
      <Encounter state={s} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    expect(container.textContent).toContain(`NEXT: ${s.sentinel!.shownIntent.label} FOR ${s.sentinel!.shownDamage}`)
  })
})

describe('rounded displays never contradict the engine', () => {
  it('a living sentinel is never shown as zero (A7)', () => {
    const base = enterNode(generateOffers(startRun('ROUND')), 0)
    for (const integrity of [0.1, 0.4, 0.5, 0.9, 1]) {
      const s = { ...base, sentinel: { ...base.sentinel!, integrity } }
      const { container } = render(
        <Encounter state={s} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
      )
      expect(container.textContent, `integrity ${integrity} rendered as dead`).not.toContain('0 LEFT')
      cleanup()
    }
  })
})

describe('the screen shows figures the engine actually uses', () => {
  it('states press damage without rounding it away (A7)', () => {
    // pressDamage is fractional at most layers. Rounding printed 13 where the
    // engine deals 13.2 — over seven presses, a whole press of drift in what
    // the player was told they could do.
    const s = enterNode(generateOffers({ ...startRun('PRESS'), layer: 7 }), 0)
    const exact = pressDamage(s)
    expect(Number.isInteger(exact)).toBe(false)
    const { container } = render(
      <Encounter state={s} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    expect(container.textContent).toContain(`FREE · ${exact.toFixed(1)} DAMAGE`)
  })

  it('takes its turn count from the engine, not its own arithmetic (A7)', () => {
    const s = enterNode(generateOffers(startRun('TL')), 0)
    for (const heat of [0, 15, 45, 90]) {
      const at = { ...s, heat }
      const { container } = render(
        <Encounter state={at} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
      )
      expect(container.textContent).toContain(String(turnsRemaining(at)))
      cleanup()
    }
  })
})

describe('the screens agree with each other', () => {
  it('quotes the same turn budget on the loadout and in the encounter', () => {
    // The loadout used to state Math.floor(heatMax / heatPerTurn) while the
    // encounter stated the ceil — "Turns per node: 6" on one screen and
    // "Turns left: 7" on the next. Both now read the engine.
    const s0 = startRun('AGREE')
    const { container: load } = render(<Loadout state={s0} onStart={() => {}} />)
    const perNode = Array.from(load.querySelectorAll('.stat'))
      .find(el => el.textContent?.includes('Turns per node'))
    expect(perNode?.textContent).toContain(String(turnsAllowed(s0)))
    cleanup()

    const s1 = enterNode(generateOffers(s0), 0)
    const { container: enc } = render(
      <Encounter state={s1} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    const left = Array.from(enc.querySelectorAll('.stat'))
      .find(el => el.textContent?.includes('TURNS LEFT'))
    expect(left?.textContent).toContain(String(turnsRemaining(s1)))
    expect(turnsRemaining(s1)).toBe(turnsAllowed(s1))
  })
})

describe('End screen', () => {
  it('does not call an aborted run a death (A7)', () => {
    // bail() ends the run with heat below heatMax and integrity intact. The
    // screen derived its headline from heat alone, so a player who walked out
    // was told "You did not come back."
    const s = bail(enterNode(generateOffers(startRun('BAIL')), 0))
    expect(s.heat).toBeLessThan(CONFIG.heatMax)
    expect(s.integrity).toBeGreaterThan(0)
    const { container } = render(<End state={s} onAgain={() => {}} />)
    expect(container.textContent).not.toContain('You did not come back')
    expect(container.textContent).toContain('walked out')
  })

  it('names each of the other endings from engine state', () => {
    const base = enterNode(generateOffers(startRun('ENDS')), 0)
    const cases: Array<[Partial<typeof base>, string]> = [
      [{ won: true, screen: 'end' }, 'The core is dark'],
      [{ heat: CONFIG.heatMax, screen: 'end' }, 'They found you'],
      [{ integrity: 0, screen: 'end' }, 'You did not come back'],
    ]
    for (const [patch, text] of cases) {
      const { container } = render(<End state={{ ...base, ...patch }} onAgain={() => {}} />)
      expect(container.textContent).toContain(text)
      cleanup()
    }
  })
})

describe('the team is never truncated', () => {
  it('renders a card for every operative on both screens (pillar 3)', () => {
    const s0 = startRun('TEAM')
    const { container: load } = render(<Loadout state={s0} onStart={() => {}} />)
    expect(load.querySelectorAll('.op')).toHaveLength(s0.team.length)
    cleanup()

    const s1 = enterNode(generateOffers(s0), 0)
    const { container: enc } = render(
      <Encounter state={s1} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    expect(enc.querySelectorAll('.op')).toHaveLength(s1.team.length)
    // and at a full team, not just the starting five
    const full = { ...s1, team: [...DRAFT_POOL, ...s1.team.map(t => t.id)].slice(0, CONFIG.teamCap).map(id => ({ id, spent: false })) }
    cleanup()
    const { container: big } = render(
      <Encounter state={full} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    expect(big.querySelectorAll('.op')).toHaveLength(CONFIG.teamCap)
  })
})
