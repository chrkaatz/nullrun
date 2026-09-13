import { writeFile, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { loadCriteria, runOracleCriterion, runArtifactCriterion } from './run.mjs';
import { ORACLE_MUTANTS } from './mutants/oracle.mjs';
import { ARTIFACT_MUTANTS } from './mutants/artifact.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const oraclePath = resolve(here, '..', 'oracle.mjs');
const artifactPath = resolve(here, '..', 'nullrun.html');

async function exists(p) { try { await access(p); return true; } catch { return false; } }

async function main() {
  if (!await exists(oraclePath)) { console.error(`no oracle at ${oraclePath}`); process.exit(2); }
  if (!await exists(artifactPath)) { console.error(`no artifact at ${artifactPath}`); process.exit(2); }

  const criteria = await loadCriteria();
  const base = await import(pathToFileURL(oraclePath).href);
  const rows = [];

  for (const m of ORACLE_MUTANTS) {
    const mutated = m.wrap(base);
    for (const c of criteria.filter(c => c.surface === 'oracle')) {
      const r = await runOracleCriterion(c, mutated);
      rows.push({ mutant: m.id, criterion: c.id, killed: r.status === 'fail', expected: m.expect.includes(c.id) });
    }
    console.log(`· ${m.id}`);
  }

  for (const m of ARTIFACT_MUTANTS) {
    for (const c of criteria.filter(c => c.surface === 'artifact')) {
      const wrapped = {
        ...c,
        run: async ctx => { await m.inject(ctx.page); return c.run(ctx); }
      };
      const r = await runArtifactCriterion(wrapped, artifactPath, base);
      rows.push({ mutant: m.id, criterion: c.id, killed: r.status === 'fail', expected: m.expect.includes(c.id) });
    }
    console.log(`· ${m.id}`);
  }

  const mutants = [...ORACLE_MUTANTS, ...ARTIFACT_MUTANTS];
  const survivors = mutants
    .filter(m => !rows.some(r => r.mutant === m.id && r.killed))
    .map(m => m.id);
  const hollow = criteria
    .filter(c => !rows.some(r => r.criterion === c.id && r.killed))
    .map(c => c.id);
  const surprises = rows.filter(r => r.killed !== r.expected && (r.killed || r.expected));

  const lethal = survivors.length === 0 && hollow.length === 0;
  const matrix = {
    ts: new Date().toISOString(),
    mutants: mutants.length, criteria: criteria.length,
    survivors, hollow,
    surprises: surprises.map(s => `${s.mutant} ${s.killed ? 'killed by' : 'survived'} ${s.criterion}`),
    lethal, rows
  };
  await writeFile(join(here, 'matrix.json'), JSON.stringify(matrix, null, 2));

  console.log(`\n${mutants.length} mutants × ${criteria.length} criteria`);
  if (survivors.length) console.log(`SURVIVING MUTANTS: ${survivors.join(', ')}`);
  if (hollow.length) console.log(`HOLLOW CRITERIA (kill nothing): ${hollow.join(', ')}`);
  if (!survivors.length && !hollow.length) console.log('lethal: every mutant killed, every criterion kills');
  for (const s of matrix.surprises) console.log(`  surprise: ${s}`);
  process.exit(lethal ? 0 : 1);
}

await main();
