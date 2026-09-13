import { pathToFileURL } from 'node:url';

export const INTERACTIVE =
  'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

export async function load(page, artifactPath) {
  await page.goto(pathToFileURL(artifactPath).href);
  await page.waitForLoadState('domcontentloaded');
  const screens = await page.evaluate(() => window.__screens ?? null);
  if (!screens || !Array.isArray(screens) || screens.length === 0) {
    throw new Error('the artifact exposes no window.__screens — see ORACLE.md, Surface 2');
  }
  return screens;
}

// Walks every declared screen, calling fn(name) with the page in that state.
export async function visitScreens(page, artifactPath, fn) {
  const screens = await load(page, artifactPath);
  for (const name of screens) {
    const ok = await page.evaluate(n => {
      if (typeof window.__goto !== 'function') return false;
      window.__goto(n); return true;
    }, name);
    if (!ok) throw new Error('the artifact exposes no window.__goto — see ORACLE.md, Surface 2');
    await page.waitForTimeout(50);
    await fn(name);
  }
  return screens;
}
