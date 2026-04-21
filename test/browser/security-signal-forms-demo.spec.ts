import { expect, test } from '@playwright/test';

test.describe('Security Signal Forms Demo', () => {
  test('renders the demo page with all fields', async ({ page }) => {
    await page.goto('/demo/security-signal-forms');

    await expect(
      page.getByRole('heading', { level: 1, name: /Signal Forms Validators/i }),
    ).toBeVisible();

    await expect(page.getByTestId('sf-email')).toBeVisible();
    await expect(page.getByTestId('sf-password')).toBeVisible();
    await expect(page.getByTestId('sf-bio')).toBeVisible();
    await expect(page.getByTestId('sf-homepage')).toBeVisible();
    await expect(page.getByTestId('sf-status')).toBeVisible();
  });

  test('strongPassword rule flags weak input', async ({ page }) => {
    await page.goto('/demo/security-signal-forms');

    const password = page.getByTestId('sf-password');
    await password.fill('abc123');
    await password.blur();

    await expect(page.getByTestId('sf-password-error').first()).toBeVisible();
    await expect(page.getByTestId('sf-status')).toContainText('form valid: false');
  });

  test('safeUrl rule flags blocked schemes', async ({ page }) => {
    await page.goto('/demo/security-signal-forms');

    const homepage = page.getByTestId('sf-homepage');
    await homepage.fill('javascript:alert(1)');
    await homepage.blur();

    await expect(page.getByTestId('sf-homepage-error').first()).toBeVisible();
  });

  test('noScriptInjection rule flags <script> tags in bio', async ({ page }) => {
    await page.goto('/demo/security-signal-forms');

    const bio = page.getByTestId('sf-bio');
    await bio.fill('<script>alert(1)</script>');
    await bio.blur();

    await expect(page.getByTestId('sf-bio-error').first()).toBeVisible();
  });

  test('form value updates reactively', async ({ page }) => {
    await page.goto('/demo/security-signal-forms');

    await page.getByTestId('sf-email').fill('alice@example.com');

    const valueBlock = page.getByTestId('sf-value');
    await expect(valueBlock).toContainText('alice@example.com');
  });
});
