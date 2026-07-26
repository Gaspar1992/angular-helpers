import { Page, Locator, expect } from '@playwright/test';

export class DocsPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly navMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder(/search|buscar/i).first();
    this.navMenu = page.getByRole('navigation').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/docs');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/docs/);
  }
}
