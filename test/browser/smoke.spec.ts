import { expect, test } from '@playwright/test';

test.describe('Browser APIs demo smoke', () => {
  test('renders home page at root route', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Browser APIs.');
  });

  test('renders the demo shell and key sections', async ({ page }) => {
    await page.goto('/demo');

    await expect(
      page.getByRole('heading', { level: 1, name: /Browser Web APIs Demo/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Permisos/i })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: /Geolocalización/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Actualizar Permisos/i })).toBeVisible();
  });
});
