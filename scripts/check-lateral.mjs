// Standalone runner for the structural calc self-checks (lateral restraint, ply
// ceiling diaphragm, and the computations sheet). No test runner is configured,
// so we bundle the lib with esbuild and execute the exported check functions.
//   node scripts/check-lateral.mjs
import { build } from 'esbuild';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const src = resolve(here, '../src');

const result = await build({
  entryPoints: [resolve(src, 'lib/engine.ts'), resolve(src, 'lib/computations.ts'), resolve(src, 'lib/checklist.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outdir: 'out',
  write: false,
  // Resolve the '@/...' path alias the app uses.
  alias: { '@': src },
});

const tmp = mkdtempSync(resolve(tmpdir(), 'calc-check-'));
const byName = {};
for (const f of result.outputFiles) {
  const name = f.path.replace(/\\/g, '/').split('/').pop();
  const p = resolve(tmp, name);
  writeFileSync(p, f.text);
  byName[name] = pathToFileURL(p).href;
}

try {
  const engine = await import(byName['engine.js']);
  const comps = await import(byName['computations.js']);
  const checklist = await import(byName['checklist.js']);
  const checks = [
    ...engine.runLateralRestraintChecks(),
    ...engine.runPlyDiaphragmChecks(),
    ...comps.runComputationsChecks(),
    ...checklist.runChecklistChecks(),
  ];
  let failed = 0;
  for (const c of checks) {
    const tag = c.pass ? 'PASS' : 'FAIL';
    if (!c.pass) failed++;
    console.log(`  [${tag}] ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  }
  console.log(`\n${checks.length - failed}/${checks.length} checks passed.`);
  process.exit(failed ? 1 : 0);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
