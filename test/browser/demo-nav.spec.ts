import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Demo section nav', () => {
  test('public demo sections are present in nav', async ({ page }) => {
    await page.goto('/demo');

    await expect(page.getByRole('link', { name: /browser web apis/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /security/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /worker http/i })).toBeVisible();
  });

  test('library-services harness is NOT in the demo nav', async ({ page }) => {
    await page.goto('/demo');

    const harnessLink = page.getByRole('link', { name: /library.?services/i });
    await expect(harnessLink).toHaveCount(0);
  });

  test('library-services route is accessible by direct URL', async ({ page }) => {
    await page.goto('/demo/library-services');

    await expect(page.getByRole('heading', { name: /library services harness/i })).toBeVisible();
  });

  test('library-services page shows internal notice', async ({ page }) => {
    await page.goto('/demo/library-services');

    await expect(page.getByText(/internal harness.*not part of the public demo/i)).toBeVisible();
  });

  test('no console errors on demo home load (DI health)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    const angularErrors = consoleErrors.filter(
      (e) => e.includes('NullInjector') || e.includes('No provider') || e.includes('NG0'),
    );
    expect(angularErrors).toHaveLength(0);
  });

  test('passes AXE scan on demo home', async ({ page }) => {
    await page.goto('/demo');

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
