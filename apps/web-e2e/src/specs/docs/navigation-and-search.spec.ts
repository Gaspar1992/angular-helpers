import { test, expect } from '@playwright/test';

test.describe('Docs navigation, blog, and search modal', () => {
  test('navigates to schematics docs page', async ({ page }) => {
    await page.goto('/docs/schematics/create-package');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('create-package');
  });

  test('renders blog index and navigates to a post', async ({ page }) => {
    await page.goto('/blog');
    const firstArticleLink = page.locator('article h2 a').first();
    await expect(firstArticleLink).toBeVisible();
    await firstArticleLink.click();
    await expect(page.locator('article header h1')).toBeVisible();
  });

  test('opens search modal with keyboard shortcut and closes with Escape', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
});
