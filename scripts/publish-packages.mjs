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

  if (targetPkg !== 'all' && !PACKAGES.includes(targetPkg)) {
    throw new Error(
      `Invalid TARGET_PACKAGE "${targetPkg}". Allowed values: all, ${PACKAGES.join(', ')}`,
    );
  }

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
    const tag = `${name}@${version}`;

    let isPublished = false;
    try {
      const res = await runCommand('npm', ['view', tag, 'version']);
      if (res.code === 0 && res.stdout === version) {
        isPublished = true;
      }
    } catch {
      isPublished = false;
    }

    if (isPublished) {
      console.log(`⏭️  [SKIP] ${tag} is already published on npm.`);
    } else {
      console.log(`🚀 [NEW RELEASE DETECTED] ${tag} is NOT yet published on npm.`);
      const distPath = path.resolve(`dist/${pkg}`);
      if (!fs.existsSync(distPath)) {
        console.warn(`⚠️  Warning: ${distPath} does not exist. Ensure build ran first.`);
      }

      if (isDryRun) {
        console.log(`🔍 [DRY-RUN] Would publish ${tag} from ${distPath}`);
      } else {
        console.log(`📤 Publishing ${tag} with Provenance...`);
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
            console.log(`✅ Successfully published ${tag}`);
            isPublished = true;
          } else {
            console.error(
              `❌ Failed to publish ${tag} with exit code ${pubRes.code}:`,
              pubRes.stderr,
            );
            process.exitCode = 1;
          }
        } catch (err) {
          console.error(`❌ Failed to publish ${tag}:`, err.message);
          process.exitCode = 1;
        }
      }
    }

    if (isPublished || isDryRun) {
      let hasGhRelease = false;
      try {
        const ghCheck = await runCommand('gh', ['release', 'view', tag]);
        if (ghCheck.code === 0) {
          hasGhRelease = true;
        }
      } catch {
        hasGhRelease = false;
      }

      if (hasGhRelease) {
        console.log(`⏭️  [SKIP] GitHub Release ${tag} already exists.`);
      } else if (isDryRun) {
        console.log(`🔍 [DRY-RUN] Would create GitHub Release ${tag}`);
      } else {
        console.log(`🏷️  Creating GitHub Release ${tag}...`);
        try {
          const ghRes = await runCommand(
            'gh',
            ['release', 'create', tag, '--title', tag, '--generate-notes'],
            {
              echoStdout: true,
              echoStderr: true,
            },
          );
          if (ghRes.code === 0) {
            console.log(`✅ Successfully created GitHub Release ${tag}`);
          } else {
            console.error(
              `❌ Failed to create GitHub Release ${tag} with exit code ${ghRes.code}:`,
              ghRes.stderr,
            );
            process.exitCode = 1;
          }
        } catch (err) {
          console.error(`❌ Failed to create GitHub Release ${tag}:`, err.message);
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
