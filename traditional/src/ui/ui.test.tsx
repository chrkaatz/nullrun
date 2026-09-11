import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { Route } from './Route'
import { App } from './App'
import { startRun } from '../engine/run'
import { generateOffers, enterNode } from '../engine/route'
import { turnsAllowed, turnsRemaining, pressDamage } from '../engine/run'
import { CONFIG } from '../engine/config'
import { Encounter } from './Encounter'

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
    // The stated figure must be the same one ceilingAgainst budgets presses for.
    expect(container.textContent).toContain(`${turnsAllowed(s)}`)
    expect(Math.ceil(CONFIG.heatMax / CONFIG.heatPerTurn)).toBe(turnsAllowed(s))
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
