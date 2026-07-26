import { defineConfig, devices } from '@playwright/test';

const useHttps = process.env['BROWSER_TEST_USE_HTTPS'] !== 'false';
const host = process.env['BROWSER_TEST_HOST'] ?? 'localhost';
const port = Number(process.env['BROWSER_TEST_PORT'] ?? '4200');
const protocol = useHttps ? 'https' : 'http';
const baseUrl = `${protocol}://${host}:${port}`;

const defaultStartCommand = useHttps
  ? `pnpm run start:https --host ${host} --port ${port}`
  : 'pnpm run start:test';
const startCommand = process.env['BROWSER_TEST_SERVER_CMD']
  ? `PORT=${port} HOST=${host} NG_ALLOWED_HOSTS=${host} ${process.env['BROWSER_TEST_SERVER_CMD']}`
  : defaultStartCommand;

export default defineConfig({
  testDir: './src',
  outputDir: './test-results',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: baseUrl,
    headless: true,
    ignoreHTTPSErrors: useHttps,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
        },
      },
    },
    {
      name: 'firefox-smoke',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit-smoke',
      testMatch: '**/*.spec.ts',
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],
  webServer: {
    command: startCommand,
    url: baseUrl,
    ignoreHTTPSErrors: useHttps,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
