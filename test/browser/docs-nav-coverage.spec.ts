import { expect, test } from '@playwright/test';
import { DOCS_NAV_SECTIONS } from '../../src/app/docs/config/docs-nav.data';

/**
 * Walks every entry declared in the docs navigation and verifies that the
 * detail route renders without redirecting back to its section overview.
 *
 * Catches drift between docs-nav.data.ts and the *.data.ts service catalogs
 * (a new nav label pointing to an unknown service id, typos, etc).
 */
test.describe('Docs nav coverage', () => {
  for (const section of DOCS_NAV_SECTIONS) {
    for (const item of section.serviceItems) {
      test(`${section.label}: ${item.label} detail page resolves`, async ({ page }) => {
        await page.goto(item.route);
        await page.waitForLoadState('networkidle');

        // Invalid ids redirect back to the section overview; assert we stayed
        // on the detail route.
        await expect(page).toHaveURL(new RegExp(`${item.route}$`));

        // Detail page always renders an <h1> with the service / entry name.
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // And an API reference table with at least one row.
        const firstCell = page.locator('table.docs-table tbody tr td').first();
        await expect(firstCell).toBeVisible();
      });
    }
  }
});
