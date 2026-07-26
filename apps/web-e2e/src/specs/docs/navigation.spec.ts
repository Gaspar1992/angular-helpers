import { test } from '@playwright/test';
import { DocsPage } from '../../pages/docs.page';

test.describe('Documentation Navigation', () => {
  test('should load docs overview section', async ({ page }) => {
    const docsPage = new DocsPage(page);
    await docsPage.goto();
    await docsPage.expectLoaded();
  });
});
