/* oxlint-disable no-console */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PACKAGES = [
  'core',
  'browser-web-apis',
  'storage',
  'security',
  'worker-http',
  'openlayers',
  'testing',
  'yjs',
];

console.log('🔎 Starting package exports and types validation (publint + attw)...');

const results = [];
let hasError = false;

for (const pkg of PACKAGES) {
  const distDir = path.resolve(`dist/${pkg}`);
  if (!fs.existsSync(distDir)) {
    console.error(
      `❌ Dist folder missing for @angular-helpers/${pkg} at ${distDir}. Run build first.`,
    );
    results.push({ pkg, publint: 'MISSING', attw: 'MISSING' });
    hasError = true;
    continue;
  }

  console.log(`\n📦 Validating @angular-helpers/${pkg}...`);

  // 1. Run publint
  const publintRes = spawnSync('pnpm', ['publint', `dist/${pkg}`], {
    stdio: 'inherit',
    encoding: 'utf8',
  });
  const publintOk = publintRes.status === 0;

  // 2. Run attw (--profile esm-only, ignoring internal-resolution-error for Node10 intra-package imports)
  const attwRes = spawnSync(
    'pnpm',
    [
      'attw',
      '--pack',
      `dist/${pkg}`,
      '--profile',
      'esm-only',
      '--ignore-rules',
      'internal-resolution-error',
    ],
    {
      stdio: 'inherit',
      encoding: 'utf8',
    },
  );
  const attwOk = attwRes.status === 0;

  if (!publintOk || !attwOk) {
    hasError = true;
  }

  results.push({
    pkg,
    publint: publintOk ? 'PASS' : 'FAIL',
    attw: attwOk ? 'PASS' : 'FAIL',
  });
}

console.log('\n========================================');
console.log('📋 Summary of Package Verification:');
console.log('========================================');
for (const r of results) {
  const status = r.publint === 'PASS' && r.attw === 'PASS' ? '✅' : '❌';
  console.log(
    `${status} @angular-helpers/${r.pkg.padEnd(18)} | publint: ${r.publint} | attw: ${r.attw}`,
  );
}
console.log('========================================');

if (hasError) {
  console.error('\n❌ Package validation failed.');
  process.exit(1);
} else {
  console.log('\n✅ All packages passed publint and attw checks successfully.');
}
