import { visitStates, INTERACTIVE } from '../lib/screens.mjs';

export default {
  id: 'A10',
  title: 'Every interactive target is at least 44px on its short edge.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const offenders = [];
    let measured = 0;

    await page.setViewportSize({ width: 360, height: 780 });
    await visitStates(page, artifactPath, oracle, async (name) => {
      const boxes = await page.evaluate(sel => {
        const out = [];
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          if (r.width === 0 || r.height === 0) continue;
          out.push({
            tag: el.tagName.toLowerCase(),
            label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24),
            w: Math.round(r.width), h: Math.round(r.height)
          });
        }
        return out;
      }, INTERACTIVE);

      measured += boxes.length;
      for (const b of boxes) {
        if (Math.min(b.w, b.h) < 44) {
          offenders.push(`${name}: <${b.tag}> "${b.label}" ${b.w}×${b.h}`);
        }
      }
    });

    assert.ok(measured > 0, 'no interactive element was found on any screen');
    note(`measured ${measured} interactive elements across the declared screens`);
    assert.deepEqual(offenders, [],
      `targets below 44px on the short edge: ${offenders.slice(0, 8).join(' · ')}`);
  }
};
