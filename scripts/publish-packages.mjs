/* oxlint-disable no-console */
import { spawn } from 'node:child_process';
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

let isTerminating = false;
let currentChild = null;

const cleanupAndExit = (signal) => {
  if (isTerminating) return;
  isTerminating = true;
  console.log(`\n🛑 Received ${signal}. Terminating child processes cleanly...`);
  if (currentChild && !currentChild.killed) {
    currentChild.kill(signal);
  }
  process.exit(130);
};

process.on('SIGINT', () => cleanupAndExit('SIGINT'));
process.on('SIGTERM', () => cleanupAndExit('SIGTERM'));

/**
 * Executes a command asynchronously via spawn with graceful shutdown support.
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    if (isTerminating) {
      return reject(new Error('Process is terminating'));
    }

    const child = spawn(command, args, {
      stdio: 'pipe',
      ...options,
    });
    currentChild = child;

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
        if (options.echoStdout) process.stdout.write(chunk);
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
        if (options.echoStderr) process.stderr.write(chunk);
      });
    }

    child.on('error', (err) => {
      currentChild = null;
      reject(err);
    });

    child.on('close', (code) => {
      currentChild = null;
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function main() {
  console.log(`📦 Publish check started. Target: ${targetPkg} | Dry run: ${isDryRun}`);

  const packagesToProcess = targetPkg === 'all' ? PACKAGES : [targetPkg];

  for (const pkg of packagesToProcess) {
    if (isTerminating) break;

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
      const res = await runCommand('npm', ['view', `${name}@${version}`, 'version']);
      if (res.code === 0 && res.stdout === version) {
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
          const pubRes = await runCommand(
            'npm',
            ['publish', '--provenance', '--access', 'public'],
            {
              cwd: distPath,
              echoStdout: true,
              echoStderr: true,
            },
          );

          if (pubRes.code === 0) {
            console.log(`✅ Successfully published ${name}@${version}`);
          } else {
            console.error(
              `❌ Failed to publish ${name}@${version} with exit code ${pubRes.code}:`,
              pubRes.stderr,
            );
            process.exitCode = 1;
          }
        } catch (err) {
          console.error(`❌ Failed to publish ${name}@${version}:`, err.message);
          process.exitCode = 1;
        }
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal error during publish execution:', err);
  process.exit(1);
});
