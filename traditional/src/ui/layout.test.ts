import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * A9 and A10 are layout properties, and jsdom does not lay out: it never even
 * loads the stylesheet, so getComputedStyle returns '' for everything and any
 * assertion built on it passes unconditionally. These are source-level checks
 * instead. They cannot prove the rendered box, but they do detect the change
 * that would break it, which the computed-style assertion cannot.
 *
 * The rendered box was measured in a real browser at 360x780 across every
 * screen: scrollWidth 360, no horizontal scroll, no element past the viewport,
 * no button under 44px on its short edge. That measurement is the evidence;
 * this file is the regression guard.
 */
const css = readFileSync('src/ui/theme.css', 'utf8')

const ruleFor = (selector: string): string => {
  const m = css.match(new RegExp(`(^|\\n)\\s*${selector}\\s*\\{([^}]*)\\}`))
  return m ? m[2] : ''
}

describe('A10 touch targets', () => {
  it('gives every button a min-height of at least 44px', () => {
    const button = ruleFor('button')
    expect(button, 'no bare `button` rule in theme.css').not.toBe('')
    const min = button.match(/min-height:\s*(\d+)px/)
    expect(min, 'the button rule sets no min-height').not.toBeNull()
    expect(Number(min![1])).toBeGreaterThanOrEqual(44)
  })

  it('never shrinks a button below that anywhere else', () => {
    for (const m of css.matchAll(/(^|\n)\s*([^{}\n]*button[^{}\n]*)\{([^}]*)\}/g)) {
      const h = m[3].match(/(?:^|[^-])height:\s*(\d+)px/)
      if (h) expect(Number(h[1]), `${m[2].trim()} fixes height below 44px`).toBeGreaterThanOrEqual(44)
    }
  })
})

describe('A9 no horizontal scroll at 360px', () => {
  it('caps the column and never fixes a width wider than the viewport', () => {
    expect(ruleFor('#app')).toMatch(/max-width:/)
    for (const m of css.matchAll(/(?:^|[^-\w])width:\s*(\d+)px/g)) {
      expect(Number(m[1]), `a fixed width of ${m[1]}px exceeds the 360px target`).toBeLessThanOrEqual(360)
    }
  })

  it('keeps images inside their container', () => {
    expect(css).toMatch(/\.art\s*\{[^}]*width:\s*100%/)
  })

  it('lets long words break rather than push the column wide', () => {
    // The engine builds log lines and operative text from content it owns, so
    // nothing here is user input -- but min-width:0 on a flex child is what
    // stops a long token from widening the row past the viewport.
    expect(ruleFor('.card .body')).toMatch(/min-width:\s*0/)
  })
})

describe('pillar 3: the whole team is always visible', () => {
  it('lays the team out as a multi-column grid, not a vertical list', () => {
    // A full-width row per operative pushed the last one off a 360px screen.
    // The pillar is a layout property, so this guards the rule that produces it.
    const team = ruleFor('\\.team')
    expect(team, 'no .team rule in theme.css').not.toBe('')
    expect(team).toMatch(/display:\s*grid/)
    const cols = team.match(/grid-template-columns:\s*repeat\((\d+)/)
    expect(cols, '.team is not a repeating grid').not.toBeNull()
    expect(Number(cols![1])).toBeGreaterThanOrEqual(2)
    // minmax(0, …) is what stops a long operative name widening the column.
    expect(team).toMatch(/minmax\(0/)
  })
})
