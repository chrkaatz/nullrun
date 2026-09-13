import { createHash } from 'node:crypto';
import { visitScreens, INTERACTIVE } from '../lib/screens.mjs';

const hash = buf => createHash('sha1').update(buf).digest('hex');

// Two elements that are distinguishable in colour but identical once desaturated were carrying
// their difference in colour alone. That is the whole criterion, and it is computable.
export default {
  id: 'A7',
  title: 'Every entity, value and state is readable in greyscale. State is never carried by colour alone.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, assert, note } = ctx;
    const collisions = [];
    let compared = 0;

    await page.setViewportSize({ width: 360, height: 780 });
    await visitScreens(page, artifactPath, async (name) => {
      const boxes = await page.evaluate(sel => {
        const out = [];
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          if (s.display === 'none' || s.visibility === 'hidden') continue;
          if (r.width < 4 || r.height < 4) continue;
          // screenshot({clip}) cannot reach past the fold, so compare only what is on screen.
          if (r.y < 0 || r.y + r.height > window.innerHeight) continue;
          out.push({
            label: (el.textContent || '').trim().slice(0, 30),
            x: Math.round(r.x), y: Math.round(r.y),
            w: Math.round(r.width), h: Math.round(r.height)
          });
        }
        return out;
      }, INTERACTIVE);
      if (boxes.length < 2) return;

      const shot = async () => {
        const out = [];
        for (const b of boxes) {
          out.push(hash(await page.screenshot({ clip: { x: b.x, y: b.y, width: b.w, height: b.h } })));
        }
        return out;
      };

      const colour = await shot();
      await page.addStyleTag({ content: 'html{filter:grayscale(1)!important}' });
      await page.waitForTimeout(60);
      const grey = await shot();
      await page.evaluate(() => {
        const tags = [...document.querySelectorAll('style')];
        const last = tags.at(-1);
        if (last && last.textContent.includes('grayscale(1)')) last.remove();
      });

      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          if (boxes[i].w !== boxes[j].w || boxes[i].h !== boxes[j].h) continue;
          compared += 1;
          if (colour[i] !== colour[j] && grey[i] === grey[j]) {
            collisions.push(`${name}: "${boxes[i].label}" and "${boxes[j].label}" differ only in colour`);
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
