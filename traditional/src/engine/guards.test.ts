import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/engine'
const sources = () =>
  readdirSync(DIR).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))

describe('engine purity', () => {
  it('has at least one source file', () => {
    expect(sources().length).toBeGreaterThan(0)
  })

  it('never imports React or touches the DOM', () => {
    for (const f of sources()) {
      const src = readFileSync(join(DIR, f), 'utf8')
      expect(src, `${f} imports react`).not.toMatch(/from ['"]react/)
      expect(src, `${f} touches window`).not.toMatch(/\bwindow\b/)
      expect(src, `${f} touches document`).not.toMatch(/\bdocument\b/)
    }
  })

  it('never calls Math.random', () => {
    for (const f of sources()) {
      const src = readFileSync(join(DIR, f), 'utf8')
      expect(src, `${f} calls Math.random`).not.toMatch(/Math\.random/)
    }
  })
})
