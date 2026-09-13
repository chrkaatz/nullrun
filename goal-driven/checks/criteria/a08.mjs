import { pathToFileURL } from 'node:url';
import { visitStates } from '../lib/screens.mjs';

export default {
  id: 'A8',
  title: 'No network request is issued at runtime.',
  surface: 'artifact',

  async run(ctx) {
    const { page, artifactPath, oracle, assert, note } = ctx;
    const seen = [];
    const docUrl = pathToFileURL(artifactPath).href;

    page.on('request', r => { if (r.url() !== docUrl) seen.push(`${r.method()} ${r.url()}`); });
    page.on('requestfailed', r => { if (r.url() !== docUrl) seen.push(`FAILED ${r.url()}`); });

    const screens = await visitStates(page, artifactPath, oracle, async () => {
      await page.waitForTimeout(150);
    });

    const offending = seen.filter(u => !/^(GET|POST|HEAD) data:/.test(u));
    note(`visited ${screens.length} screens; ${seen.length} requests observed, ${offending.length} not data: URIs`);
    assert.deepEqual(offending, [],
      `the artifact issued network requests: ${offending.slice(0, 5).join(' · ')}`);

    const preconnects = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel~="preconnect"], link[rel~="dns-prefetch"], link[rel~="prefetch"], link[rel~="preload"]')]
        .map(l => `${l.rel} ${l.href}`));
    assert.deepEqual(preconnects, [],
      `the artifact declares connection-opening links: ${preconnects.join(' · ')}`);
  }
};
