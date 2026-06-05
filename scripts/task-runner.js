import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { argv, env, exit } from 'node:process';

const task = argv[2];

function runCommand(commandLine, envVars = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(commandLine, {
      stdio: 'inherit',
      shell: true,
      env: { ...env, ...envVars },
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: "${commandLine}" (code ${code})`));
    });
  });
}

const tasks = {
  // SSL certificates generation for local HTTPS serving
  async 'ssl:generate'() {
    if (!existsSync('ssl')) {
      mkdirSync('ssl', { recursive: true });
    }
    const opensslCmd =
      'openssl req -x509 -newkey rsa:2048 -sha256 -nodes -keyout ssl/localhost.key -out ssl/localhost.crt -days 365 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"';
    await runCommand(opensslCmd);
  },

  // Playwright Browser E2E Tests runner
  async 'test:browser'() {
    const mode = argv[3];
    let cmd = 'playwright test';
    const envVars = {};

    if (mode === 'headed') {
      cmd += ' --headed';
    } else if (mode === 'debug') {
      cmd += ' --debug';
    } else if (mode === 'smoke') {
      cmd += ' smoke.spec.ts --project=chromium';
    } else if (mode === 'ci') {
      envVars.CI = '1';
      cmd += ' --project=chromium --workers=1';
    } else if (mode === 'cross') {
      envVars.CI = '1';
      cmd += ' --project=firefox-smoke --project=webkit-smoke --workers=1';
    } else if (mode === 'install') {
      cmd = 'playwright install chromium';
    } else if (mode === 'install:all') {
      cmd = 'playwright install chromium firefox webkit';
    } else {
      // Default / 'all'
      envVars.CI = '1';
      cmd += ' --project=chromium --project=firefox-smoke --project=webkit-smoke --workers=1';
    }

    await runCommand(cmd, envVars);
  },

  // Documentation Generation
  async 'generate:docs'() {
    await runCommand('npx tsx scripts/generate-docs-meta.ts');
    await runCommand('oxfmt src/app/docs/data/*.data.ts');
  },

  // Documentation Consistency verification
  async 'test:docs-consistency'() {
    await this['generate:docs']();
    await runCommand('npx tsx scripts/verify-docs-consistency.ts');
    await runCommand('git diff --exit-code');
  },
};

if (tasks[task]) {
  tasks[task]().catch((err) => {
    console.error(err.message);
    exit(1);
  });
} else {
  console.error(`Unknown task: ${task}\nAvailable tasks: ${Object.keys(tasks).join(', ')}`);
  exit(1);
}
