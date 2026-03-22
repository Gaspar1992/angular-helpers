import { expect, test } from '@playwright/test';

test.describe('Library services harness', () => {
  test('renders secure context and support flags', async ({ page }) => {
    await page.goto('/demo/library-services');

    await expect(page.getByRole('heading', { level: 1, name: /Library Services Harness/i })).toBeVisible();
    await expect(page.getByTestId('secure-context-value')).toHaveText('yes');
    await expect(page.getByTestId('permissions-supported')).toHaveText('yes');
    await expect(page.getByTestId('geolocation-supported')).toHaveText('yes');
    await expect(page.getByTestId('clipboard-supported')).toHaveText('yes');
    await expect(page.getByTestId('notification-supported')).toHaveText('yes');
    await expect(page.getByTestId('media-devices-supported')).toHaveText('yes');
    await expect(page.getByTestId('camera-supported')).toHaveText('yes');
    await expect(page.getByTestId('web-worker-supported')).toHaveText('yes');
    await expect(page.getByTestId('regex-security-supported')).toHaveText('yes');
    await expect(page.getByTestId('web-storage-supported')).toHaveText('yes');

    const webShareSupported = (await page.getByTestId('web-share-supported').textContent())?.trim() ?? '';
    expect(['yes', 'no']).toContain(webShareSupported);

    const batterySupported = (await page.getByTestId('battery-supported').textContent())?.trim() ?? '';
    expect(['yes', 'no']).toContain(batterySupported);

    await expect(page.getByTestId('web-socket-supported')).toHaveText('yes');
  });

  test('queries camera permission state', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('permissions-query-camera').click();

    const state = (await page.getByTestId('permissions-camera-state').textContent())?.trim() ?? '';
    expect(['granted', 'denied', 'prompt', 'unknown']).toContain(state);
  });
});

test.describe('Library services harness battery and websocket services', () => {
  test('handles battery snapshot according to browser support', async ({ page }) => {
    await page.goto('/demo/library-services');

    const batterySupported = (await page.getByTestId('battery-supported').textContent())?.trim() ?? 'no';

    await page.getByTestId('battery-refresh').click();

    await expect(page.getByTestId('last-action')).toHaveText('refresh-battery-snapshot');

    if (batterySupported === 'no') {
      await expect(page.getByTestId('battery-state')).toHaveText('unsupported');
      await expect(page.getByTestId('battery-level')).toHaveText('unknown');
      await expect(page.getByTestId('battery-charging')).toHaveText('unknown');
      await expect(page.getByTestId('error-message')).toHaveText('none');
      return;
    }

    await expect(page.getByTestId('battery-state')).toHaveText('supported');
    await expect(page.getByTestId('battery-level')).toContainText(/\d+/);
    await expect(page.getByTestId('battery-charging')).toContainText(/yes|no/);
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('surfaces websocket failure and disconnected send path', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('web-socket-connect-invalid').click();
    await expect(page.getByTestId('last-action')).toHaveText('connect-invalid-web-socket');
    await expect
      .poll(async () => (await page.getByTestId('web-socket-state').textContent())?.trim() ?? '')
      .toMatch(/connecting|error|disconnected/);

    await page.getByTestId('web-socket-send').click();
    await expect(page.getByTestId('last-action')).toHaveText('send-web-socket-message');
    await expect(page.getByTestId('web-socket-send-state')).toHaveText('failed');

    await page.getByTestId('web-socket-disconnect').click();
    await expect(page.getByTestId('last-action')).toHaveText('disconnect-web-socket');
    await expect(page.getByTestId('web-socket-state')).toHaveText('disconnected');
  });
});

test.describe('Library services harness storage and share services', () => {
  test('persists and reads values through WebStorageService', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('storage-exercise').click();

    await expect(page.getByTestId('last-action')).toHaveText('exercise-web-storage');
    await expect(page.getByTestId('storage-state')).toHaveText('success');
    await expect(page.getByTestId('storage-local-value')).toHaveText('storage-local-value');
    await expect(page.getByTestId('storage-session-value')).toHaveText('storage-session-value');
    await expect
      .poll(async () => Number((await page.getByTestId('storage-key-count').textContent())?.trim() ?? '0'))
      .toBeGreaterThan(0);
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('handles text sharing through WebShareService', async ({ page }) => {
    await page.goto('/demo/library-services');

    const webShareSupported = (await page.getByTestId('web-share-supported').textContent())?.trim() ?? 'no';

    await page.getByTestId('share-text').click();

    await expect(page.getByTestId('last-action')).toHaveText('share-web-text');
    await expect
      .poll(async () => (await page.getByTestId('web-share-state').textContent())?.trim() ?? '')
      .toMatch(/success|error/);

    const shareState = (await page.getByTestId('web-share-state').textContent())?.trim() ?? '';
    const shareResult = (await page.getByTestId('web-share-result').textContent())?.trim() ?? '';

    if (webShareSupported === 'no') {
      await expect(page.getByTestId('web-share-state')).toHaveText('error');
      await expect(page.getByTestId('web-share-result')).toHaveText('not-shared');
      await expect(page.getByTestId('web-share-error')).not.toHaveText('none');
      await expect(page.getByTestId('error-message')).not.toHaveText('none');
      return;
    }

    if (shareState === 'success') {
      expect(shareResult).toBe('shared');
      await expect(page.getByTestId('web-share-error')).toHaveText('none');
      await expect(page.getByTestId('error-message')).toHaveText('none');
      return;
    }

    expect(shareResult).toBe('not-shared');
    await expect(page.getByTestId('web-share-error')).not.toHaveText('none');
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });
});

test.describe('Library services harness worker and regex services', () => {
  test('creates worker, exchanges a message, and terminates it', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('web-worker-create').click();
    await expect(page.getByTestId('web-worker-state')).toHaveText('running');

    await page.getByTestId('web-worker-send').click();
    await expect(page.getByTestId('last-action')).toHaveText('send-web-worker-message');
    await expect
      .poll(async () => Number((await page.getByTestId('web-worker-message-count').textContent())?.trim() ?? '0'))
      .toBeGreaterThan(0);
    await expect(page.getByTestId('web-worker-last-message')).toContainText('harness-task');
    await expect(page.getByTestId('error-message')).toHaveText('none');

    await page.getByTestId('web-worker-terminate').click();
    await expect(page.getByTestId('web-worker-state')).toHaveText('terminated');
  });

  test('analyzes a safe regex pattern', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('regex-analyze-safe').click();

    await expect(page.getByTestId('last-action')).toHaveText('analyze-safe-regex-pattern');
    await expect
      .poll(async () => (await page.getByTestId('regex-analysis-safe').textContent())?.trim() ?? '')
      .toMatch(/yes|no|unknown/);
    await expect
      .poll(async () => (await page.getByTestId('regex-analysis-risk').textContent())?.trim() ?? '')
      .toMatch(/low|medium|high|critical|unknown/);
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('executes a safe regex pattern in worker', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('regex-test-safe').click();

    await expect(page.getByTestId('last-action')).toHaveText('test-safe-regex-pattern');
    await expect
      .poll(async () => (await page.getByTestId('regex-execution-state').textContent())?.trim() ?? '')
      .toMatch(/success|error/);

    const executionState = (await page.getByTestId('regex-execution-state').textContent())?.trim() ?? '';

    if (executionState === 'success') {
      await expect(page.getByTestId('regex-match')).toHaveText('true');
      await expect(page.getByTestId('regex-timeout')).toHaveText('false');
      await expect(page.getByTestId('regex-error')).toHaveText('none');
      await expect(page.getByTestId('error-message')).toHaveText('none');
      return;
    }

    await expect(page.getByTestId('regex-match')).toHaveText('false');
    await expect(page.getByTestId('regex-timeout')).toHaveText('false');
    await expect(page.getByTestId('regex-error')).not.toHaveText('none');
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('rejects an unsafe regex pattern', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('regex-test-unsafe').click();

    await expect(page.getByTestId('last-action')).toHaveText('test-unsafe-regex-pattern');
    await expect(page.getByTestId('regex-execution-state')).toHaveText('error');
    await expect(page.getByTestId('regex-match')).toHaveText('false');
    await expect(page.getByTestId('regex-timeout')).toHaveText('false');
    await expect(page.getByTestId('regex-error')).toContainText('Pattern contains potential ReDoS vulnerabilities');
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });
});

test.describe('Library services harness with media permissions', () => {
  test.use({ permissions: ['camera', 'microphone'] });

  test('refreshes media devices using MediaDevicesService', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('media-devices-refresh').click();

    await expect(page.getByTestId('last-action')).toHaveText('refresh-media-devices');
    await expect
      .poll(async () => Number((await page.getByTestId('media-video-input-count').textContent())?.trim() ?? '0'))
      .toBeGreaterThan(0);
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('starts and stops camera stream using CameraService', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('camera-start').click();

    await expect
      .poll(async () => (await page.getByTestId('camera-state').textContent())?.trim() ?? '')
      .toBe('streaming');
    await expect
      .poll(async () => Number((await page.getByTestId('camera-track-count').textContent())?.trim() ?? '0'))
      .toBeGreaterThan(0);
    await expect(page.getByTestId('error-message')).toHaveText('none');

    await page.getByTestId('camera-stop').click();
    await expect(page.getByTestId('camera-state')).toHaveText('stopped');
    await expect(page.getByTestId('camera-track-count')).toHaveText('0');
  });
});

test.describe('Library services harness with geolocation permission', () => {
  test.use({
    permissions: ['geolocation', 'clipboard-read', 'clipboard-write', 'notifications'],
    geolocation: {
      latitude: 40.4168,
      longitude: -3.7038
    }
  });

  test('returns granted permission and current position', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('permissions-query-geolocation').click();
    await expect(page.getByTestId('permissions-geolocation-state')).toHaveText('granted');

    await page.getByTestId('geolocation-request-current').click();
    await expect(page.getByTestId('geolocation-position')).toHaveText('40.416800,-3.703800');
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('writes and reads clipboard text through service', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('clipboard-write').click();
    await expect(page.getByTestId('clipboard-write-state')).toHaveText('written');

    await page.getByTestId('clipboard-read').click();
    await expect(page.getByTestId('clipboard-read-value')).toHaveText('harness-clipboard-text');
    await expect(page.getByTestId('error-message')).toHaveText('none');
  });

  test('shows notification through service', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('notifications-query-permission').click();
    await expect(page.getByTestId('notifications-permission-state')).toHaveText('granted');

    await page.getByTestId('notifications-show').click();

    await expect
      .poll(async () => (await page.getByTestId('notifications-show-state').textContent())?.trim() ?? '')
      .toMatch(/success|error/);

    const showState = (await page.getByTestId('notifications-show-state').textContent())?.trim() ?? '';

    expect(['success', 'error']).toContain(showState);

    if (showState === 'success') {
      await expect(page.getByTestId('notifications-count')).toHaveText('1');
      await expect(page.getByTestId('error-message')).toHaveText('none');
      return;
    }

    await expect(page.getByTestId('notifications-count')).toHaveText('0');
    await expect(page.getByTestId('error-message')).not.toHaveText('none');
  });

  test('camera flow reaches a terminal state without pre-granted media permission', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('camera-start').click();

    await expect
      .poll(async () => (await page.getByTestId('camera-state').textContent())?.trim() ?? '')
      .toMatch(/streaming|error/);

    const cameraState = (await page.getByTestId('camera-state').textContent())?.trim() ?? '';

    if (cameraState === 'streaming') {
      await expect
        .poll(async () => Number((await page.getByTestId('camera-track-count').textContent())?.trim() ?? '0'))
        .toBeGreaterThan(0);

      await page.getByTestId('camera-stop').click();
      await expect(page.getByTestId('camera-state')).toHaveText('stopped');
      return;
    }

    await expect(page.getByTestId('camera-track-count')).toHaveText('0');
    await expect(page.getByTestId('error-message')).not.toHaveText('none');
  });
});

test.describe('Library services harness without geolocation permission', () => {
  test.use({ permissions: [] });

  test('surfaces geolocation error when permission is not granted', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('geolocation-request-current').click();

    await expect(page.getByTestId('last-action')).toHaveText('request-current-position');
    await expect(page.getByTestId('geolocation-position')).toHaveText('error');
    await expect(page.getByTestId('error-message')).not.toHaveText('none');
  });

  test('fails to show notification when permission is not granted', async ({ page }) => {
    await page.goto('/demo/library-services');

    await page.getByTestId('notifications-show').click();

    await expect(page.getByTestId('last-action')).toHaveText('show-notification');
    await expect(page.getByTestId('notifications-show-state')).toHaveText('error');
    await expect(page.getByTestId('notifications-count')).toHaveText('0');
    await expect(page.getByTestId('error-message')).not.toHaveText('none');
  });
});
