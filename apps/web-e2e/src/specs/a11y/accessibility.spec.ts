import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { HomePage } from '../../pages/home.page';
import { DocsPage } from '../../pages/docs.page';

test.describe('Accessibility Audits (Axe Core / WCAG AA)', () => {
  test('home page should have no detectable a11y violations', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectLoaded();

    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(scanResults.violations).toEqual([]);
  });

  test('docs overview should have no detectable a11y violations', async ({ page }) => {
    const docsPage = new DocsPage(page);
    await docsPage.goto();
    await docsPage.expectLoaded();

    const scanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(scanResults.violations).toEqual([]);
  });
});
