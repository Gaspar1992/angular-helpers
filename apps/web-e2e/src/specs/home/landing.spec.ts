import { test } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('Home Page', () => {
  test('should load landing page correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectLoaded();
  });
});
