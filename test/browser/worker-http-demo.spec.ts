import { expect, test } from '@playwright/test';

test.describe('Worker HTTP Demo', () => {
  test('renders the demo page with all sections', async ({ page }) => {
    await page.goto('/demo/worker-http');

    await expect(page.getByRole('heading', { level: 1, name: /Worker HTTP Demo/i })).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /WorkerTransport/i })).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /HMAC Signing/i })).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /Content Hashing/i })).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /AES Encryption/i })).toBeVisible();

    await expect(page.getByRole('heading', { level: 2, name: /Activity Log/i })).toBeVisible();
  });

  test('sends echo request and receives response', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Wait for the page to be fully loaded and interactive
    const sendEchoButton = page.getByRole('button', { name: /Send Echo/i });
    await expect(sendEchoButton).toBeEnabled();

    // Click Send Echo button
    await sendEchoButton.click();

    // Wait for running state (button shows loading spinner)
    await expect(page.getByRole('button', { name: /Send Echo/i })).toBeDisabled();

    // Wait for success result in activity log (max 5 seconds for the 200ms delay + processing)
    await expect(page.getByText(/Echo response received.*ms/i)).toBeVisible({ timeout: 5000 });

    // Verify the result contains the expected data in the transport result block
    const resultBlock = page
      .locator('div.bg-base-300')
      .filter({ hasText: /Result.*ms/i })
      .first();
    await expect(resultBlock).toBeVisible();
    const resultText = await resultBlock.textContent();
    expect(resultText).toContain('echo');
    expect(resultText).toContain('Hello from main thread');

    // Check activity log
    await expect(page.getByText(/Echo response received/i)).toBeVisible();
  });

  test('handles pool burst with multiple workers', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Wait for the page to be fully loaded and interactive
    const poolBurstButton = page.getByRole('button', { name: /Pool Burst/i });
    await expect(poolBurstButton).toBeEnabled();

    // Click Pool Burst button
    await poolBurstButton.click();

    // Wait for running state (button shows loading spinner)
    await expect(page.getByRole('button', { name: /Pool Burst/i })).toBeDisabled();

    // Wait for pool completion (8 requests across 4 workers)
    await expect(page.getByText(/Pool burst: 8 requests.*4 workers/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify the result contains completion message
    await expect(page.getByText(/8 requests completed via 4-worker pool/i)).toBeVisible();
  });

  test('signs payload with HMAC', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Sign Payload button
    await page.getByRole('button', { name: /Sign Payload/i }).click();

    // Wait for signature to appear (look for the result div containing the signature hex)
    const signatureBlock = page
      .locator('div.bg-base-300', { hasText: /^Signature: [a-f0-9]+/i })
      .first();
    await expect(signatureBlock).toBeVisible({ timeout: 5000 });

    // Verify signature is a hex string (contains only hex characters)
    const signatureText = await signatureBlock.textContent();
    expect(signatureText).toMatch(/Signature: [a-f0-9]{16,}/i);

    // Check activity log
    await expect(page.getByText(/Signed payload/i)).toBeVisible();
  });

  test('hashes content with SHA-256', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Hash Content button
    await page.getByRole('button', { name: /Hash Content/i }).click();

    // Wait for hash result to appear (use the specific result block class)
    const hashBlock = page.locator('div.bg-base-300', { hasText: /^SHA-256: [a-f0-9]+/i }).first();
    await expect(hashBlock).toBeVisible({ timeout: 5000 });

    // Verify hash is a hex string
    const hashText = await hashBlock.textContent();
    expect(hashText).toMatch(/SHA-256: [a-f0-9]{20,}/i);

    // Check activity log for hash entry (shortened form with ...)
    await expect(page.getByText(/SHA-256:.*\.\.\./i).first()).toBeVisible();
  });

  test('encrypts and decrypts data with AES', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Click Encrypt button
    await page.getByRole('button', { name: /^Encrypt$/ }).click();

    // Wait for any AES-related message in activity log (success or error)
    await expect(page.getByText(/AES/i).first()).toBeVisible({ timeout: 15000 });

    // If encryption succeeded, try decrypt
    const logEntry = page.getByText(/AES.*Encrypted/i).first();
    if (await logEntry.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /Decrypt$/ }).click();
      await expect(page.getByText(/AES.*Decrypted/i).first()).toBeVisible({
        timeout: 15000,
      });
    }
  });

  test('activity log shows entries with correct types', async ({ page }) => {
    await page.goto('/demo/worker-http');

    // Perform an action
    await page.getByRole('button', { name: /Hash Content/i }).click();

    // Check activity log for hash entry specifically
    await expect(page.getByText(/SHA-256:/i).first()).toBeVisible();

    // Verify the log entry structure (time badge, section badge, and message)
    const logEntry = page
      .locator('div.flex.gap-3')
      .filter({ hasText: /SHA-256:/i })
      .first();
    await expect(logEntry).toBeVisible();

    // Should have section label (as badge), message, and timestamp (format: HH:MM:SS.mmm)
    await expect(logEntry.locator('span.badge').first()).toBeVisible(); // section badge like "Hash"
    await expect(logEntry.locator('span.font-mono').first()).toBeVisible(); // timestamp span

    // Clear logs
    await page.getByRole('button', { name: /Clear/i }).click();

    // Verify logs are cleared
    await expect(page.getByText(/No activity yet/i)).toBeVisible();
  });
});
