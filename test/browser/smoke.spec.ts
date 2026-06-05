import { expect, test } from '@playwright/test';

test.describe('Browser APIs demo smoke', () => {
  test('renders home page at root route', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Master Web APIs');
  });

  test('renders the demo shell and key sections', { timeout: 30_000 }, async ({ page }) => {
    await page.goto('/demo', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('heading', { level: 1, name: /Explore Angular Helpers/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 2, name: /Browser Web APIs/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /^Security$/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /^Security Utilities$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /Security — Signal Forms/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /^Worker HTTP$/i })).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: /Worker HTTP — Benchmarks/i }),
    ).toBeVisible();
  });
});
