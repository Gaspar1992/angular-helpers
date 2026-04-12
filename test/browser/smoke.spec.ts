import { expect, test } from '@playwright/test';

test.describe('Browser APIs demo smoke', () => {
  test('renders home page at root route', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Every Angular app');
  });

  test('renders the demo shell and key sections', async ({ page }) => {
    await page.goto('/demo');

    await expect(
      page.getByRole('heading', { level: 1, name: /Explore Angular Helpers/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Browser Web APIs/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Security/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Worker HTTP/i })).toBeVisible();
  });
});
