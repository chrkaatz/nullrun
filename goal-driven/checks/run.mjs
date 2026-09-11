import { readdir, writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { seeds } from './lib/harness.mjs';
import { playRun } from './lib/harness.mjs';
import { deepEqual, clone } from './lib/deep.mjs';

const here = dirname(fileURLToPath(import.meta.url));

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i === -1 ? fallback : process.argv[i + 1];
}
const has = name => process.argv.includes(name);

export async function loadCriteria(only = null) {
  const dir = join(here, 'criteria');
  const files = (await readdir(dir)).filter(f => f.endsWith('.mjs')).sort();
  const mods = [];
  for (const f of files) {
    const mod = (await import(pathToFileURL(join(dir, f)).href)).default;
    if (only && mod.id !== only) continue;
    mods.push(mod);
  }
  return mods;
}

export async function runOracleCriterion(criterion, oracle) {
  const notes = [];
  const ctx = {
    oracle, assert, seeds, playRun, deepEqual, clone,
    note: s => notes.push(String(s))
  };
  const t0 = Date.now();
  try {
    await criterion.run(ctx);
    return { status: 'pass', message: null, notes, ms: Date.now() - t0 };
  } catch (e) {
    return { status: 'fail', message: e.message, notes, ms: Date.now() - t0 };
  }
}

export async function runArtifactCriterion(criterion, artifactPath) {
  const { chromium } = await import('playwright');
  const notes = [];
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 360, height: 780 } });
  const page = await context.newPage();
  const t0 = Date.now();
  try {
    const ctx = { page, context, artifactPath, assert, note: s => notes.push(String(s)) };
    await criterion.run(ctx);
    return { status: 'pass', message: null, notes, ms: Date.now() - t0 };
  } catch (e) {
    return { status: 'fail', message: e.message, notes, ms: Date.now() - t0 };
  } finally {
    await browser.close();
  }
}

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  const only = arg('--only');
  const criteria = await loadCriteria(only);

  if (has('--selftest')) {
    const fixtures = {
      hollow: await import(pathToFileURL(join(here, 'fixtures/hollow.mjs')).href),
      faithful: await import(pathToFileURL(join(here, 'fixtures/faithful.mjs')).href)
    };
    const rows = [];
    let bad = 0;
    for (const c of criteria) {
      if (c.surface !== 'oracle') { rows.push({ id: c.id, skipped: 'artifact surface' }); continue; }
      for (const [name, fx] of Object.entries(fixtures)) {
        const expected = c.selftest?.[name];
        if (!expected) { console.error(`${c.id}: no selftest declaration for ${name}`); bad++; continue; }
        const r = await runOracleCriterion(c, fx);
        const ok = r.status === expected;
        if (!ok) bad++;
        rows.push({ id: c.id, fixture: name, expected, actual: r.status, ok, message: r.message });
        console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.id} vs ${name}: expected ${expected}, got ${r.status}` +
                    (ok ? '' : ` — ${r.message}`));
      }
    }
    await writeFile(join(here, 'report.json'),
      JSON.stringify({ ts: new Date().toISOString(), mode: 'selftest', rows }, null, 2));
    process.exit(bad ? 1 : 0);
  }

  const oraclePath = resolve(here, '..', arg('--oracle', 'oracle.mjs'));
  const artifactPath = resolve(here, '..', arg('--artifact', 'nullrun.html'));
  const results = [];

  const haveOracle = await exists(oraclePath);
  const haveArtifact = await exists(artifactPath);

  for (const c of criteria) {
    let r;
    if (c.surface === 'oracle') {
      r = haveOracle
        ? await runOracleCriterion(c, await import(pathToFileURL(oraclePath).href))
        : { status: 'fail', message: `no oracle at ${oraclePath}`, notes: [], ms: 0 };
    } else {
      r = haveArtifact
        ? await runArtifactCriterion(c, artifactPath)
        : { status: 'fail', message: `no artifact at ${artifactPath}`, notes: [], ms: 0 };
    }
    results.push({ id: c.id, title: c.title, surface: c.surface, ...r });
    console.log(`${r.status === 'pass' ? 'ok  ' : 'FAIL'} ${c.id}  ${c.title}` +
                (r.status === 'pass' ? '' : `\n      ${r.message}`));
    for (const n of r.notes) console.log(`      · ${n}`);
  }

  const failed = results.filter(r => r.status !== 'pass');
  const report = {
    ts: new Date().toISOString(),
    mode: 'check',
    passed: results.length - failed.length,
    total: results.length,
    green: failed.length === 0,
    results
  };
  await writeFile(join(here, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`\n${report.passed}/${report.total} criteria pass`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('run.mjs')) await main();
