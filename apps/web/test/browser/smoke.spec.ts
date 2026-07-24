import { test, expect } from '@playwright/test';

/**
 * Smoke tests — lightweight sanity checks that run on every push
 * and on all supported browsers (chromium, firefox, webkit).
 *
 * Goals:
 * - Verify the app boots without a white screen or JS crash.
 * - Verify top-level navigation resolves and renders content.
 *
 * These tests intentionally avoid testing specific UI details so they
 * remain stable across redesigns. The full browser test suite (CI mode)
 * covers detailed behaviour.
 */

test.describe('Smoke — app boots', () => {
  test('home page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    expect(errors).toHaveLength(0);
  });

  test('docs index loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/docs');

    // The docs layout should render the sidebar nav
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('demo index loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/demo');
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
