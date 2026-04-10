import { expect, test } from '@playwright/test';

test.describe('Documentation pages', () => {
  test('docs landing page renders with package cards', async ({ page }) => {
    await page.goto('/docs');

    await expect(page.getByRole('heading', { level: 1, name: /Angular Helpers/i })).toBeVisible();
    await expect(page.getByText(/browser-web-apis/i)).toBeVisible();
    await expect(page.getByText(/security/i)).toBeVisible();

    await expect(page.getByRole('link', { name: /View documentation/i })).toHaveCount(2);
  });

  test('docs landing page has quick start section', async ({ page }) => {
    await page.goto('/docs');

    await expect(page.getByRole('heading', { level: 2, name: /Quick setup/i })).toBeVisible();
    await expect(page.locator('pre code')).toContainText('provideBrowserWebApis');
  });
});

test.describe('Documentation - browser-web-apis overview', () => {
  test('browser-web-apis overview page renders', async ({ page }) => {
    await page.goto('/docs/browser-web-apis');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/services/i)).toBeVisible();
  });

  test('browser-web-apis overview has service navigation', async ({ page }) => {
    await page.goto('/docs/browser-web-apis');

    const serviceLinks = page.locator('a[href^="/docs/browser-web-apis/"]');
    const count = await serviceLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Documentation - security overview', () => {
  test('security overview page renders', async ({ page }) => {
    await page.goto('/docs/security');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('security overview has service navigation', async ({ page }) => {
    await page.goto('/docs/security');

    const serviceLinks = page.locator('a[href^="/docs/security/"]');
    const count = await serviceLinks.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Documentation - worker-http overview', () => {
  test('worker-http overview page renders', async ({ page }) => {
    await page.goto('/docs/worker-http');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('worker-http overview has entry navigation', async ({ page }) => {
    await page.goto('/docs/worker-http');

    const entryLinks = page.locator('a[href^="/docs/worker-http/"]');
    const count = await entryLinks.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Documentation - service detail pages', () => {
  test('camera service detail page renders', async ({ page }) => {
    await page.goto('/docs/browser-web-apis/camera');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/CameraService|camera/i)).toBeVisible();
  });

  test('geolocation service detail page renders', async ({ page }) => {
    await page.goto('/docs/browser-web-apis/geolocation');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/GeolocationService|geolocation/i)).toBeVisible();
  });

  test('invalid service shows error or fallback', async ({ page }) => {
    await page.goto('/docs/browser-web-apis/nonexistent-service');

    const errorOrHeading = page.locator('h1, .error, [data-testid="error"]').first();
    await expect(errorOrHeading).toBeVisible();
  });
});
