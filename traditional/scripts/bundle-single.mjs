import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Folds dist/ into one self-contained HTML file.
 *
 * Vite emits index.html plus a module script and a stylesheet, and a module
 * script cannot load over file:// — the browser blocks it as cross-origin. So
 * the built app needs a server to run, while the ephemeral arm's build is a
 * single file you open by double-clicking. This makes the two artifacts the
 * same shape, which is the only way their sizes mean anything side by side.
 *
 * The art is already embedded as data URIs, so the output has no external
 * reference of any kind.
 */
const DIST = 'dist'
const OUT = 'dist/nullrun.html'

let html = readFileSync(join(DIST, 'index.html'), 'utf8')
const assets = readdirSync(join(DIST, 'assets'))
const css = assets.find(f => f.endsWith('.css'))
const js = assets.find(f => f.endsWith('.js'))
if (!js) throw new Error('no bundled script in dist/assets')

// Every replacement goes through a function, never a string: String.replace
// expands $&, $`, $' and $n in a string replacement, and a minified React
// bundle is full of those — passing one as a string splices the matched tag
// back into the output once per occurrence.
if (css) {
  const text = readFileSync(join(DIST, 'assets', css), 'utf8')
  html = html.replace(
    new RegExp(`\\s*<link[^>]*href="[^"]*${css}"[^>]*>`),
    () => `\n    <style>${text}</style>`,
  )
}

// The script moves to the end of the body rather than staying in the head.
// Two reasons it cannot stay. A module script is blocked over file:// even
// with its code inline, so it has to become a classic script — and a classic
// script is not deferred, so in the head it runs before <div id="app"> exists
// and React fails with "target container is not a DOM element". `defer` does
// nothing on an inline script, so position is the only fix.
const script = readFileSync(join(DIST, 'assets', js), 'utf8')
const before = html
html = html.replace(new RegExp(`\\s*<script[^>]*src="[^"]*${js}"[^>]*></script>`), () => '')
if (html === before) throw new Error('did not find the bundled script tag to remove')
if (!html.includes('</body>')) throw new Error('no </body> to insert before')
html = html.replace('</body>', () => `  <script>${script}</script>\n  </body>`)

// Check the markup only. The inlined bundle holds string literals that look
// like attributes ( href="'+e+'" and the like ); they are code, not links.
const markup = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '<script></script>')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, '<style></style>')
const leftovers = markup.match(/(?:src|href)="(?!data:)[^"]*"/g) ?? []
if (leftovers.length) throw new Error(`external references remain: ${leftovers.join(', ')}`)
if (markup.indexOf('<div id="app">') > markup.lastIndexOf('<script>')) {
  throw new Error('the script would run before the app container exists')
}

writeFileSync(OUT, html)
console.log(`${OUT} — ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, self-contained`)
