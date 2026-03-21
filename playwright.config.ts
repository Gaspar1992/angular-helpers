import { defineConfig, devices } from '@playwright/test';

const useHttps = process.env['BROWSER_TEST_USE_HTTPS'] !== 'false';
const host = process.env['BROWSER_TEST_HOST'] ?? 'localhost';
const port = Number(process.env['BROWSER_TEST_PORT'] ?? '4200');
const protocol = useHttps ? 'https' : 'http';
const baseUrl = `${protocol}://${host}:${port}`;
const startCommand = useHttps
  ? `npm run start:https -- --host ${host} --port ${port}`
  : 'npm run start:test';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: baseUrl,
    headless: true,
    ignoreHTTPSErrors: useHttps,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
        }
      }
    },
    {
      name: 'firefox-smoke',
      testMatch: '**/smoke.spec.ts',
      use: {
        ...devices['Desktop Firefox']
      }
    },
    {
      name: 'webkit-smoke',
      testMatch: '**/smoke.spec.ts',
      use: {
        ...devices['Desktop Safari']
      }
    }
  ],
  webServer: {
    command: startCommand,
    url: baseUrl,
    ignoreHTTPSErrors: useHttps,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000
  }
});
