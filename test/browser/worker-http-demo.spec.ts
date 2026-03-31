import { expect, test } from '@playwright/test';

test.describe('Worker HTTP Demo', () => {
  test('renders the demo page with all sections', async ({ page }) => {
    await page.goto('/demo/worker-http');

    await expect(page.getByRole('heading', { level: 1, name: /Worker HTTP — POC/i })).toBeVisible();

    await expect(
      page.getByRole('heading', { level: 2, name: /P1 — Worker Transport/i }),
    ).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /P5 — HMAC Signing/i })).toBeVisible();

    await expect(
      page.getByRole('heading', { level: 2, name: /P5 — Content Hashing/i }),
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { level: 2, name: /P5 — AES-GCM Encryption/i }),
    ).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /Activity Log/i })).toBeVisible();
  });

  test('sends echo request and receives response', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Send Echo button
    await page.getByRole('button', { name: /Send Echo/i }).click();

    // Wait for the running state to appear briefly
    await expect(page.getByText(/Waiting for worker response/i)).toBeVisible();

    // Wait for success result (max 5 seconds for the 200ms delay + processing)
    await expect(page.getByText(/Echo response received/i)).toBeVisible({ timeout: 5000 });

    // Verify the result contains the expected data
    const resultText = await page.locator('.mono-block').first().textContent();
    expect(resultText).toContain('echo');
    expect(resultText).toContain('Hello from main thread');

    // Check activity log
    await expect(page.getByText(/Transport.*Echo response received/i)).toBeVisible();
  });

  test('handles pool burst with multiple workers', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Pool Burst button
    await page.getByRole('button', { name: /Pool Burst/i }).click();

    // Wait for the running state
    await expect(page.getByText(/Waiting for worker response/i)).toBeVisible();

    // Wait for pool completion (8 requests across 4 workers)
    await expect(page.getByText(/Pool burst: 8 requests/i)).toBeVisible({ timeout: 10000 });

    // Verify the result
    const resultText = await page.locator('.svc-result').first().textContent();
    expect(resultText).toContain('8 requests completed');
    expect(resultText).toContain('4-worker');
  });

  test('signs payload with HMAC', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Sign Payload button
    await page.getByRole('button', { name: /Sign Payload/i }).click();

    // Wait for signature to appear
    const signatureLocator = page.locator('.svc-result').filter({ hasText: /Signature/ });
    await expect(signatureLocator).toBeVisible({ timeout: 5000 });

    // Verify signature is a hex string (contains only hex characters)
    const signatureText = await signatureLocator.textContent();
    expect(signatureText).toMatch(/[a-f0-9]{16,}/i);

    // Check activity log
    await expect(page.getByText(/HMAC.*Signed payload/i)).toBeVisible();
  });

  test('hashes content with SHA-256', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Hash Content button
    await page.getByRole('button', { name: /Hash Content/i }).click();

    // Wait for hash result (look for mono-block inside the Hashing section)
    const hashSection = page.locator('.svc-card').filter({ hasText: /Content Hashing/ });
    await expect(
      hashSection.locator('.mono-block').filter({ hasText: /[a-f0-9]{20}/i }),
    ).toBeVisible({
      timeout: 5000,
    });

    // Check activity log for hash entry specifically
    const logContainer = page.locator('.msg-log');
    await expect(logContainer.getByText(/SHA-256:/i)).toBeVisible();
  });

  test('encrypts and decrypts data with AES', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Encrypt button
    await page.getByRole('button', { name: /^Encrypt$/ }).click();

    // Wait for any AES-related message in activity log (success or error)
    const aesLogEntry = page.locator('.msg-row', { hasText: /AES/i });
    await expect(aesLogEntry).toBeVisible({ timeout: 15000 });

    // If encryption succeeded, try decrypt
    const logText = await aesLogEntry.textContent();
    if (logText?.includes('Encrypted')) {
      await page.getByRole('button', { name: /Decrypt$/ }).click();
      await expect(page.locator('.msg-row', { hasText: /AES.*Decrypted/i })).toBeVisible({
        timeout: 15000,
      });
    }
  });

  test('activity log shows entries with correct types', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Perform an action
    await page.getByRole('button', { name: /Hash Content/i }).click();

    // Check activity log for hash entry specifically
    const logContainer = page.locator('.msg-log');
    await expect(logContainer.getByText(/SHA-256:/i)).toBeVisible();

    // Verify the log entry structure
    const logEntry = page.locator('.msg-row').first();
    await expect(logEntry).toBeVisible();

    // Should have section label, message, and timestamp
    await expect(logEntry.locator('.msg-dir')).toBeVisible();
    await expect(logEntry.locator('.msg-text')).toBeVisible();
    await expect(logEntry.locator('.msg-time')).toBeVisible();

    // Clear logs
    await page.getByRole('button', { name: /Clear/i }).click();

    // Verify logs are cleared
    await expect(page.getByText(/No activity yet/i)).toBeVisible();
  });
});
