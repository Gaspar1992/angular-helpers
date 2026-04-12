import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero heading with new copy', async ({ page }) => {
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Every Angular app');
    await expect(h1).toContainText('We solved them once');
  });

  test('hero CTA buttons are present and focusable', async ({ page }) => {
    const getStarted = page.getByRole('link', { name: /get started/i });
    const liveDemo = page.getByRole('link', { name: /live demo/i });
    // Use first() since GitHub link appears in hero and footer
    const github = page.getByRole('link', { name: /github/i }).first();

    await expect(getStarted).toBeVisible();
    await expect(liveDemo).toBeVisible();
    await expect(github).toBeVisible();

    await expect(getStarted).toHaveAttribute('href', /\/docs/);
    await expect(liveDemo).toHaveAttribute('href', /\/demo/);
    await expect(github).toHaveAttribute('href', /github\.com/);
    await expect(github).toHaveAttribute('rel', /noopener/);
  });

  test('stats bar renders with 4 stats', async ({ page }) => {
    const statsBar = page.getByRole('list').filter({ hasText: /services|packages|source/i });
    await expect(statsBar).toBeVisible();

    const stats = statsBar.getByRole('listitem');
    await expect(stats).toHaveCount(4);
  });

  test('features section renders 6 cards', async ({ page }) => {
    // The section has aria-labelledby="features-title" pointing to h2 with "Everything you need. Nothing you don't."
    const featuresSection = page.locator('section[aria-labelledby="features-title"]');
    await expect(featuresSection).toBeVisible();

    const featureCards = featuresSection.getByRole('heading', { level: 3 });
    await expect(featureCards).toHaveCount(6);
  });

  test('packages section renders 3 package cards', async ({ page }) => {
    // The section has aria-labelledby="packages-title" pointing to h2 "Pick what you need."
    const packagesSection = page.locator('section[aria-labelledby="packages-title"]');
    await expect(packagesSection).toBeVisible();

    // Use exact match to avoid matching npm install commands
    await expect(
      packagesSection.getByText('@angular-helpers/browser-web-apis', { exact: true }),
    ).toBeVisible();
    await expect(
      packagesSection.getByText('@angular-helpers/security', { exact: true }),
    ).toBeVisible();
    await expect(
      packagesSection.getByText('@angular-helpers/worker-http', { exact: true }),
    ).toBeVisible();
  });

  test('package cards have docs links', async ({ page }) => {
    const docLinks = page.getByRole('link', { name: /documentation/i });
    const count = await docLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CTA section is visible with action buttons', async ({ page }) => {
    // The section has aria-labelledby="cta-title" pointing to h2 "Ready to start?"
    const ctaSection = page.locator('section[aria-labelledby="cta-title"]');
    await expect(ctaSection).toBeVisible();
    await expect(ctaSection.getByRole('link', { name: /read the docs/i })).toBeVisible();
    await expect(ctaSection.getByRole('link', { name: /open demo/i })).toBeVisible();
  });

  test('navigation links are present', async ({ page }) => {
    // Main nav has aria-label="Main navigation"
    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link', { name: /docs/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /demo/i })).toBeVisible();
  });

  test('no console errors on page load (DI health)', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const angularErrors = consoleErrors.filter(
      (e) => e.includes('NullInjector') || e.includes('No provider') || e.includes('NG0'),
    );
    expect(angularErrors, `Angular DI errors: ${angularErrors.join('\n')}`).toHaveLength(0);
  });

  test('passes AXE accessibility scan (no critical/serious violations)', async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');

    if (critical.length > 0 || serious.length > 0) {
      const summary = [...critical, ...serious]
        .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
        .join('\n');
      expect(summary, `AXE violations:\n${summary}`).toBe('');
    }
  });
});
