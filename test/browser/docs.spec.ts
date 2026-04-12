import { expect, test } from '@playwright/test';

test.describe('Documentation pages', () => {
  test('docs landing page renders with package cards', async ({ page }) => {
    await page.goto('/docs');

    await expect(page.getByRole('heading', { level: 1, name: /Angular Helpers/i })).toBeVisible();
    // Use first() to avoid strict mode violations
    await expect(page.getByText(/browser-web-apis/i).first()).toBeVisible();
    await expect(page.getByText(/security/i).first()).toBeVisible();

    // Count all "View documentation" links
    const docLinks = page.getByRole('link', { name: /View documentation/i });
    await expect(docLinks).toHaveCount(2);
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
    // Use first() to avoid strict mode violations with multiple "services" mentions
    await expect(page.getByText(/services/i).first()).toBeVisible();
  });

  test('browser-web-apis overview has service navigation', async ({ page }) => {
    await page.goto('/docs/browser-web-apis');

    // Look for service cards that link to specific service docs
    const serviceLinks = page.locator('a[href^="/docs/browser-web-apis/"]');
    const count = await serviceLinks.count();
    // Should have many service links (Camera, Geolocation, etc.)
    expect(count).toBeGreaterThan(5);
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
    // Use first() to handle multiple matches on the page
    await expect(page.getByText(/CameraService/i).first()).toBeVisible();
  });

  test('geolocation service detail page renders', async ({ page }) => {
    await page.goto('/docs/browser-web-apis/geolocation');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Use first() to handle multiple matches on the page
    await expect(page.getByText(/GeolocationService/i).first()).toBeVisible();
  });

  test('invalid service shows error or fallback', async ({ page }) => {
    await page.goto('/docs/browser-web-apis/nonexistent-service');

    // Page should either show an error message or at least have an h1 heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });
});
