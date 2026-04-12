import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Blog', () => {
  test('blog list page renders with page heading', async ({ page }) => {
    await page.goto('/blog');

    await expect(page.getByRole('heading', { level: 1, name: /blog/i })).toBeVisible();
    await expect(page.getByText(/Angular development/i)).toBeVisible();
  });

  test('first article link is visible in blog list', async ({ page }) => {
    await page.goto('/blog');

    const articleLink = page.getByRole('link', {
      name: /redesigning the web/i,
    });
    await expect(articleLink).toBeVisible();
  });

  test('first article page renders with correct heading', async ({ page }) => {
    await page.goto('/blog/web-redesign-and-library-vision');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Redesigning the web');
    await expect(page.getByRole('link', { name: /← blog/i })).toBeVisible();
  });

  test('unknown slug shows not found', async ({ page }) => {
    await page.goto('/blog/nonexistent-post');

    await expect(page.getByRole('heading', { name: /not found/i })).toBeVisible();
  });

  test('no console errors on blog load (DI health)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/blog');
    await page.waitForLoadState('networkidle');

    const angularErrors = consoleErrors.filter(
      (e) => e.includes('NullInjector') || e.includes('No provider') || e.includes('NG0'),
    );
    expect(angularErrors).toHaveLength(0);
  });

  test('passes AXE accessibility scan on blog list', async ({ page }) => {
    await page.goto('/blog');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (blocking.length > 0) {
      const summary = blocking.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('\n');
      expect(summary, `AXE violations:\n${summary}`).toBe('');
    }
  });
});
