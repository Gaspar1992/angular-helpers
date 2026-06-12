import { expect, test } from '@playwright/test';

/**
 * Verifies that switching between Angular v21 and v22 in the docs
 * correctly shows/hides version-specific content:
 *
 * - Items with `since: v22` should NOT appear in v21.
 * - Items with `experimental: true` should NOT appear in v21.
 * - All items should appear in v22.
 * - The ?v= query param should persist across navigation.
 */

// Items that should only appear in v22 per section (since: AngularVersion.v22)
const V22_ONLY_BROWSER_WEB_APIS = ['injectBatteryResource', 'injectNetworkInformationResource'];

const V22_ONLY_STORAGE = ['injectStorageResource'];

const V22_ONLY_WORKER_HTTP = ['Realtime Clients'];

// Items that are experimental (hidden in v21)
const EXPERIMENTAL_ITEMS = [
  'Idle Detector',
  'EyeDropper',
  'Barcode Detector',
  'Web Bluetooth',
  'Web USB',
  'Web NFC',
  'Payment Request',
  'Credential Management',
];

test.describe('Docs version switching — browser-web-apis', () => {
  test('v22 shows v22-only items in sidebar', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=22');
    await page.waitForLoadState('networkidle');

    for (const item of V22_ONLY_BROWSER_WEB_APIS) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('v21 hides v22-only items from sidebar', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=21');
    await page.waitForLoadState('networkidle');

    for (const item of V22_ONLY_BROWSER_WEB_APIS) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toHaveCount(0);
    }
  });

  test('v21 hides experimental items from sidebar', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=21');
    await page.waitForLoadState('networkidle');

    for (const item of EXPERIMENTAL_ITEMS) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toHaveCount(0);
    }
  });

  test('v22 shows experimental items in sidebar', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=22');
    await page.waitForLoadState('networkidle');

    for (const item of EXPERIMENTAL_ITEMS) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('v21 overview hides v22-only services', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=21');
    await page.waitForLoadState('networkidle');

    const mainContent = page.locator('main');
    await expect(mainContent.getByText('injectBatteryResource', { exact: true })).toHaveCount(0);
  });

  test('direct access to v22-only service on v21 redirects', async ({ page }) => {
    await page.goto('/docs/browser-web-apis/inject-battery-resource?v=21');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/docs\/browser-web-apis/);
  });
});

test.describe('Docs version switching — storage', () => {
  test('v22 shows injectStorageResource in sidebar', async ({ page }) => {
    await page.goto('/docs/storage?v=22');
    await page.waitForLoadState('networkidle');

    for (const item of V22_ONLY_STORAGE) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('v21 hides injectStorageResource from sidebar', async ({ page }) => {
    await page.goto('/docs/storage?v=21');
    await page.waitForLoadState('networkidle');

    for (const item of V22_ONLY_STORAGE) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toHaveCount(0);
    }
  });
});

test.describe('Docs version switching — worker-http', () => {
  test('v22 shows realtime in sidebar', async ({ page }) => {
    await page.goto('/docs/worker-http?v=22');
    await page.waitForLoadState('networkidle');

    for (const item of V22_ONLY_WORKER_HTTP) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toBeVisible({
        timeout: 5_000,
      });
    }
  });

  test('v21 hides realtime from sidebar', async ({ page }) => {
    await page.goto('/docs/worker-http?v=21');
    await page.waitForLoadState('networkidle');

    for (const item of V22_ONLY_WORKER_HTTP) {
      await expect(page.locator('aside').getByText(item, { exact: true })).toHaveCount(0);
    }
  });
});

test.describe('Docs version switching — interaction', () => {
  test('switching from v22 to v21 updates sidebar content', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=22');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('aside').getByText('injectBatteryResource', { exact: true }),
    ).toBeVisible();

    // Open version dropdown and switch to v21
    const dropdownButton = page.locator('button').filter({ hasText: /Angular v22/i });
    await dropdownButton.click();
    await page.getByText('Angular v21', { exact: false }).click();
    await page.waitForURL(/v=21/);

    await expect(
      page.locator('aside').getByText('injectBatteryResource', { exact: true }),
    ).toHaveCount(0);
  });

  test('version query param persists when navigating to sub-pages', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=21');
    await page.waitForLoadState('networkidle');

    const cameraLink = page.locator('aside').getByRole('link', { name: 'Camera' });
    await cameraLink.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('v=21');
    await expect(page).toHaveURL(/\/docs\/browser-web-apis\/camera/);
  });

  test('version query param persists when navigating between libraries', async ({ page }) => {
    await page.goto('/docs/browser-web-apis?v=21');
    await page.waitForLoadState('networkidle');

    const securityLink = page
      .locator('aside')
      .first()
      .getByRole('link', { name: /Security/i });
    await securityLink.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('v=21');
    await expect(page).toHaveURL(/\/docs\/security/);
  });
});
