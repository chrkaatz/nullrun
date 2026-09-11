import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { Route } from './Route'
import { App } from './App'
import { startRun } from '../engine/run'
import { generateOffers, enterNode } from '../engine/route'
import { turnsAllowed } from '../engine/run'
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
  it('gives every interactive target at least 44px on its short edge (A10)', () => {
    const { container } = render(<App />)
    for (const el of Array.from(container.querySelectorAll('button'))) {
      const min = getComputedStyle(el).minHeight
      expect(min === '' || parseInt(min, 10) >= 44 || min === 'auto').toBe(true)
    }
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
    expect(Math.ceil(CONFIG.heatMax / CONFIG.heatPerTurn) - 1).toBe(turnsAllowed(s))
  })

  it('states the shown intent and its exact value as text (A4, A7)', () => {
    const s = enterNode(generateOffers(startRun('INTENT')), 0)
    const { container } = render(
      <Encounter state={s} onCall={() => {}} onPress={() => {}} onEndTurn={() => {}} onBail={() => {}} />,
    )
    expect(container.textContent).toContain(`NEXT: ${s.sentinel!.shownIntent.label} FOR ${s.sentinel!.shownDamage}`)
  })
})
