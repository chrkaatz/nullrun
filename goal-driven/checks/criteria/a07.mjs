import { createHash } from 'node:crypto';
import { visitStates, INTERACTIVE } from '../lib/screens.mjs';

const hash = buf => createHash('sha1').update(buf).digest('hex');

// Two elements that are distinguishable in colour but identical once desaturated were carrying
// their difference in colour alone. That is the whole criterion, and it is computable.
export default {
  id: 'A7',
  title: 'Every entity, value and state is readable in greyscale. State is never carried by colour alone.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const collisions = [];
    let compared = 0;

    await page.setViewportSize({ width: 360, height: 780 });
    await visitStates(page, artifactPath, oracle, async (name) => {
      const handles = await page.$$(INTERACTIVE);
      const items = [];
      for (const el of handles) {
        // elementHandle.screenshot() auto-scrolls the element into view first, so unlike
        // page.screenshot({clip}) it can reach controls past the fold on a scrolling screen.
        const box = await el.boundingBox();
        if (!box || box.width < 4 || box.height < 4) continue;
        const visible = await el.evaluate(node => {
          const s = getComputedStyle(node);
          return s.display !== 'none' && s.visibility !== 'hidden';
        });
        if (!visible) continue;
        const label = await el.evaluate(node => (node.textContent || '').trim().slice(0, 30));
        items.push({ el, label, w: Math.round(box.width), h: Math.round(box.height) });
      }
      if (items.length < 2) return;

      const shot = async () => {
        const out = [];
        for (const it of items) out.push(hash(await it.el.screenshot()));
        return out;
      };

      const colour = await shot();
      const greyTag = await page.addStyleTag({ content: 'html{filter:grayscale(1)!important}' });
      await page.waitForTimeout(60);
      const grey = await shot();
      await greyTag.evaluate(el => el.remove());

      // The removal above can only fail loudly, never silently: if the filter stayed on, every
      // later screen would be shot desaturated in both passes and A7 would pass for the wrong
      // reason — colour and greyscale hashes matching everywhere, not because nothing differs.
      const restored = hash(await items[0].el.screenshot());
      assert.equal(restored, colour[0],
        `the greyscale filter did not lift after screen "${name}" — every later screen would be compared against itself`);

      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          if (items[i].w !== items[j].w || items[i].h !== items[j].h) continue;
          compared += 1;
          if (colour[i] !== colour[j] && grey[i] === grey[j]) {
            collisions.push(`${name}: "${items[i].label}" and "${items[j].label}" differ only in colour`);
          }
        }
      }
    });

    note(`compared ${compared} same-size element pairs in colour and greyscale`);
    assert.ok(compared > 0,
      'no two same-size interactive elements existed on any screen — the check proved nothing');
    assert.deepEqual(collisions, [],
      `state carried by colour alone: ${collisions.slice(0, 6).join(' · ')}`);
  }
};
