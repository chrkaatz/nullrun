import { visitScreens } from '../lib/screens.mjs';

export default {
  id: 'A9',
  title: 'No horizontal scroll at 360px wide.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, assert, note } = ctx;
    const report = [];

    await page.setViewportSize({ width: 360, height: 780 });
    const screens = await visitScreens(page, artifactPath, async () => {
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
      // A screen with nothing laid out never scrolls, so it satisfies this criterion without
      // demonstrating anything. The contract requires __goto to produce a state a player could
      // actually reach; this is what enforces it.
      assert.ok(m.laidOut >= 5,
        `screen "${screens[i]}" rendered only ${m.laidOut} laid-out elements — too empty to prove anything about layout`);
    }
    note(`measured ${report.length} screens at 360×780; widest content ${Math.max(...report.map(r => r.scrollWidth))}px; laid-out elements per screen: ${report.map(r => r.laidOut).join(', ')}`);
  }
};
