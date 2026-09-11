import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/engine'

/**
 * Recursive on purpose. A flat readdirSync let any engine file in a
 * subdirectory escape all three checks below, leaving the purity guarantee
 * resting on the convention that nobody makes one.
 */
function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )
}

const sources = () =>
  walk(DIR).filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))

describe('engine purity', () => {
  it('has at least one source file', () => {
    expect(sources().length).toBeGreaterThan(0)
  })

  it('never imports React or touches the DOM', () => {
    for (const f of sources()) {
      const src = readFileSync(f, 'utf8')
      expect(src, `${f} imports react`).not.toMatch(/from ['"]react/)
      expect(src, `${f} touches window`).not.toMatch(/\bwindow\b/)
      expect(src, `${f} touches document`).not.toMatch(/\bdocument\b/)
    }
  })

  it('never calls Math.random', () => {
    for (const f of sources()) {
      const src = readFileSync(f, 'utf8')
      expect(src, `${f} calls Math.random`).not.toMatch(/Math\.random/)
    }
  })
})
