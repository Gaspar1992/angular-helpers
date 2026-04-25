import { test, expect } from '@playwright/test';

test.describe('Streams Polyfill Feature Detection', () => {
  test('detects if ReadableStream is transferable', async ({ page, browserName }) => {
    const result = await page.evaluate(() => {
      if (typeof ReadableStream === 'undefined') {
        return { supported: false, reason: 'ReadableStream not available' };
      }

      try {
        const rs = new ReadableStream({
          start(controller) {
            controller.close();
          },
        });

        const channel = new MessageChannel();
        let transferable = true;

        try {
          channel.port1.postMessage(rs, [rs as unknown as Transferable]);
        } catch {
          transferable = false;
        }

        channel.port1.close();
        channel.port2.close();

        return {
          supported: true,
          transferable,
          needsPolyfill: !transferable,
        };
      } catch (error) {
        return {
          supported: false,
          reason: (error as Error).message,
        };
      }
    });

    // All modern browsers should have ReadableStream
    expect(result.supported).toBe(true);

    // Chrome and Firefox should support transferable streams
    if (browserName === 'chromium' || browserName === 'firefox') {
      expect(result.transferable).toBe(true);
      expect(result.needsPolyfill).toBe(false);
    }

    // WebKit (Safari) may need polyfill depending on version
    if (browserName === 'webkit') {
      // Safari 18+ should support it, older versions may not
      // This test documents the actual behavior
      test.info().annotations.push({
        type: 'note',
        description: `Safari transferable streams: ${result.transferable ? 'supported' : 'needs polyfill'}`,
      });
    }
  });

  test('detects Safari version from user agent', async ({ page, browserName }) => {
    const uaInfo = await page.evaluate(() => {
      const ua = navigator.userAgent;
      const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
      const versionMatch = /Version\/(\d+)/.exec(ua);
      const version = versionMatch ? Number.parseInt(versionMatch[1], 10) : null;

      return {
        userAgent: ua,
        isSafari,
        safariVersion: version,
        isLegacySafari: isSafari && version !== null && version < 18,
      };
    });

    expect(uaInfo.userAgent).toBeTruthy();

    if (browserName === 'webkit') {
      expect(uaInfo.isSafari).toBe(true);
      expect(uaInfo.safariVersion).toBeGreaterThan(0);
    } else {
      expect(uaInfo.isSafari).toBe(false);
    }
  });
});
