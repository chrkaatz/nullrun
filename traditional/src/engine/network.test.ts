import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  )
}

describe('A8 no network at runtime', () => {
  it('no source file fetches anything', () => {
    // Test files are excluded: they never reach the runtime bundle, and this
    // file's own regex literals contain every token it bans.
    const shipped = walk('src')
      .filter(f => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f))
    expect(shipped.length).toBeGreaterThan(8)
    for (const f of shipped) {
      const src = readFileSync(f, 'utf8')
      expect(src, `${f} calls fetch`).not.toMatch(/\bfetch\s*\(/)
      expect(src, `${f} uses XMLHttpRequest`).not.toMatch(/XMLHttpRequest/)
      expect(src, `${f} opens a WebSocket`).not.toMatch(/new WebSocket/)
      expect(src, `${f} references an http url`).not.toMatch(/["']https?:\/\//)
    }
  })

  it('the markup pulls nothing over the wire either', () => {
    // The source scan above cannot see index.html, which is where a font link,
    // an analytics tag or a favicon request would live — the last of which was
    // a real finding: a missing favicon makes every load request one.
    const html = readFileSync('index.html', 'utf8')
    expect(html).not.toMatch(/["'](https?:)?\/\//)
    expect(html, 'no favicon means the browser requests /favicon.ico').toMatch(/rel="icon"/)
  })

  it('every art tile is embedded, not linked', () => {
    const art = readFileSync('src/ui/art.ts', 'utf8')
    const tiles = art.match(/data:image\/webp;base64,/g) ?? []
    expect(tiles.length).toBeGreaterThanOrEqual(19)
    expect(art).not.toMatch(/["']https?:\/\//)
  })
})
