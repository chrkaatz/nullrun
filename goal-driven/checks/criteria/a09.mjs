import { visitStates } from '../lib/screens.mjs';

export default {
  id: 'A9',
  title: 'No horizontal scroll at 360px wide.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const report = [];

    await page.setViewportSize({ width: 360, height: 780 });
    const screens = await visitStates(page, artifactPath, oracle, async () => {
      const m = await page.evaluate(() => {
        const d = document.documentElement;
        let widest = null, widestRight = d.clientWidth;
        let laidOut = 0;
        for (const el of document.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 && r.height === 0) continue;
          laidOut += 1;
          if (r.right > widestRight) { widestRight = r.right; widest = el.tagName + (el.className ? '.' + String(el.className).split(' ')[0] : ''); }
        }
        return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, widest, widestRight, laidOut };
      });
      report.push(m);
    });

    for (let i = 0; i < report.length; i++) {
      const m = report[i];
      assert.ok(m.scrollWidth <= m.clientWidth,
        `screen "${screens[i]}" scrolls horizontally: ${m.scrollWidth}px content in ${m.clientWidth}px` +
        (m.widest ? `, widest element ${m.widest} reaching ${Math.round(m.widestRight)}px` : ''));
      // overflow-x: hidden satisfies the scroll check by clipping rather than fitting — the
      // content is still off the screen, it is merely unreadable instead of reachable. Bounding
      // boxes report true geometry regardless of clipping, so this catches what scrollWidth cannot.
      assert.ok(m.widestRight <= m.clientWidth + 1,
        `screen "${screens[i]}" has content reaching ${Math.round(m.widestRight)}px in a ${m.clientWidth}px viewport` +
        (m.widest ? ` (${m.widest})` : '') + ' — clipped rather than fitted');
      // A screen with nothing laid out never scrolls, so it satisfies this criterion without
      // demonstrating anything. The checks now drive __render with states the oracle actually
      // produced (ORACLE.md, the render hook), but a build could still render one thin sparsely;
      // this is what enforces it.
      assert.ok(m.laidOut >= 5,
        `screen "${screens[i]}" rendered only ${m.laidOut} laid-out elements — too empty to prove anything about layout`);
    }
    note(`measured ${report.length} screens at 360×780; widest content ${Math.max(...report.map(r => r.scrollWidth))}px; laid-out elements per screen: ${report.map(r => r.laidOut).join(', ')}`);
  }
};
