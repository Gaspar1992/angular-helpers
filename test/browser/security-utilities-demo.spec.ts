import { expect, test } from '@playwright/test';

test.describe('Security Utilities Demo', () => {
  test('renders all utility sections', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    await expect(
      page.getByRole('heading', { level: 1, name: /Security Utilities Demo/i }),
    ).toBeVisible();

    await expect(page.getByTestId('validators-card')).toBeVisible();
    await expect(page.getByTestId('jwt-card')).toBeVisible();
    await expect(page.getByTestId('hibp-card')).toBeVisible();
    await expect(page.getByTestId('rate-limiter-card')).toBeVisible();
    await expect(page.getByTestId('csrf-card')).toBeVisible();
    await expect(page.getByTestId('clipboard-card')).toBeVisible();
  });

  test('SecurityValidators strongPassword rejects weak passwords', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    const passwordInput = page.getByTestId('validators-password');
    await passwordInput.fill('abc123');

    const weakMessage = page.getByTestId('validators-password-weak');
    await expect(weakMessage).toBeVisible();
    await expect(page.getByTestId('validators-status')).toContainText('form valid: false');
  });

  test('SecurityValidators safeUrl rejects unsafe schemes', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    const homepage = page.getByTestId('validators-homepage');
    await homepage.fill('javascript:alert(1)');

    await expect(page.getByTestId('validators-homepage-unsafe')).toBeVisible();
  });

  test('JwtService decodes a valid JWT payload', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    // JWT payload: { sub: "user-42", exp: 9999999999 } (well into the future)
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTQyIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
    await page.getByTestId('jwt-input').fill(jwt);
    await page.getByTestId('jwt-inspect').click();

    const result = page.getByTestId('jwt-result');
    await expect(result).toBeVisible();
    await expect(result).toContainText('expired: false');
    await expect(result).toContainText('user-42');
  });

  test('JwtService rejects malformed tokens', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    await page.getByTestId('jwt-input').fill('not-a-jwt');
    await page.getByTestId('jwt-inspect').click();

    await expect(page.getByTestId('jwt-error')).toBeVisible();
  });

  test('RateLimiter consumes tokens and blocks when exhausted', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    const consumeButton = page.getByTestId('rate-consume');

    // Capacity is 3 — click four times rapidly
    await consumeButton.click();
    await consumeButton.click();
    await consumeButton.click();
    await consumeButton.click();

    // The log shows entries; at least one should be an error (exhausted capacity)
    const log = page.getByTestId('rate-log');
    await expect(log).toBeVisible();
    await expect(log.locator('li.text-error').first()).toBeVisible({ timeout: 2000 });
  });

  test('RateLimiter reset restores capacity', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    const consumeButton = page.getByTestId('rate-consume');
    for (let i = 0; i < 3; i++) await consumeButton.click();

    await page.getByTestId('rate-reset').click();

    // After reset the log is cleared
    await expect(page.getByTestId('rate-log')).toBeHidden();
  });

  test('CsrfService generates and clears tokens', async ({ page }) => {
    await page.goto('/demo/security-utilities');

    const tokenDisplay = page.getByTestId('csrf-token');
    await expect(tokenDisplay).toBeVisible();

    await page.getByTestId('csrf-generate').click();

    // Waits until the signal propagates and the DOM holds a 64-hex token.
    await expect(tokenDisplay).toHaveText(/[0-9a-f]{64}/);

    await page.getByTestId('csrf-clear').click();
    await expect(tokenDisplay).toContainText('(no token)');
  });

  test('SensitiveClipboard copy flow reaches copying state', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/demo/security-utilities');

    await page.getByTestId('clipboard-input').fill('secret-api-key');
    await page.getByTestId('clipboard-copy-3s').click();

    const status = page.getByTestId('clipboard-status');
    await expect(status).toContainText(/copied/i, { timeout: 2000 });
  });
});
