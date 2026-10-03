/* oxlint-disable no-console */
import { execSync } from 'node:child_process';
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

const targetPkg = process.env.TARGET_PACKAGE || 'all';
const isDryRun = process.env.DRY_RUN === 'true' || process.argv.includes('--dry-run');

console.log(`📦 Publish check started. Target: ${targetPkg} | Dry run: ${isDryRun}`);

const packagesToProcess = targetPkg === 'all' ? PACKAGES : [targetPkg];

for (const pkg of packagesToProcess) {
  const pkgJsonPath = path.resolve(`libs/${pkg}/package.json`);
  if (!fs.existsSync(pkgJsonPath)) {
    console.error(`❌ package.json not found for ${pkg} at ${pkgJsonPath}`);
    continue;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const name = pkgJson.name;
  const version = pkgJson.version;

  let isPublished = false;
  try {
    const output = execSync(`npm view "${name}@${version}" version`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (output === version) {
      isPublished = true;
    }
  } catch {
    isPublished = false;
  }

  if (isPublished) {
    console.log(`⏭️  [SKIP] ${name}@${version} is already published on npm.`);
  } else {
    console.log(`🚀 [NEW RELEASE DETECTED] ${name}@${version} is NOT yet published on npm.`);
    const distPath = path.resolve(`dist/${pkg}`);
    if (!fs.existsSync(distPath)) {
      console.warn(`⚠️  Warning: ${distPath} does not exist. Ensure build ran first.`);
    }

    if (isDryRun) {
      console.log(`🔍 [DRY-RUN] Would publish ${name}@${version} from ${distPath}`);
    } else {
      console.log(`📤 Publishing ${name}@${version} with Provenance...`);
      try {
        execSync(`npm publish --provenance --access public`, {
          cwd: distPath,
          stdio: 'inherit',
        });
        console.log(`✅ Successfully published ${name}@${version}`);
      } catch (err) {
        console.error(`❌ Failed to publish ${name}@${version}:`, err.message);
        process.exitCode = 1;
      }
    }
  }
}
