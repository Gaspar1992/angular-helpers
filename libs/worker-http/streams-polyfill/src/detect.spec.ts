import { describe, expect, it } from 'vitest';
import { isSafari, isLegacySafari, needsPolyfill } from './detect';

describe('isSafari', () => {
  it('returns true for Safari user agents', () => {
    const safariUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    expect(isSafari(safariUA)).toBe(true);
  });

  it('returns false for Chrome user agents', () => {
    const chromeUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
    expect(isSafari(chromeUA)).toBe(false);
  });

  it('returns false for Firefox user agents', () => {
    const firefoxUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0';
    expect(isSafari(firefoxUA)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isSafari('')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isSafari(undefined as unknown as string)).toBe(false);
  });
});

describe('isLegacySafari', () => {
  it('returns true for Safari 16', () => {
    const safari16UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
    expect(isLegacySafari(safari16UA)).toBe(true);
  });

  it('returns true for Safari 17', () => {
    const safari17UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    expect(isLegacySafari(safari17UA)).toBe(true);
  });

  it('returns false for Safari 18+', () => {
    const safari18UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(isLegacySafari(safari18UA)).toBe(false);
  });

  it('returns false for non-Safari browsers', () => {
    const chromeUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
    expect(isLegacySafari(chromeUA)).toBe(false);
  });
});

describe('needsPolyfill', () => {
  it('returns true for Safari 16', () => {
    const safari16UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
    expect(needsPolyfill(safari16UA)).toBe(true);
  });

  it('returns true for Safari 17', () => {
    const safari17UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
    expect(needsPolyfill(safari17UA)).toBe(true);
  });

  it('returns false for Safari 18+', () => {
    const safari18UA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    expect(needsPolyfill(safari18UA)).toBe(false);
  });

  it('returns false for Chrome', () => {
    const chromeUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
    expect(needsPolyfill(chromeUA)).toBe(false);
  });

  it('returns false for Firefox', () => {
    const firefoxUA =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:124.0) Gecko/20100101 Firefox/124.0';
    expect(needsPolyfill(firefoxUA)).toBe(false);
  });

  it('returns false for unknown user agent', () => {
    expect(needsPolyfill('')).toBe(false);
  });

  it('performs feature detection via ReadableStream and MessageChannel when userAgent is omitted', () => {
    const savedRS = globalThis.ReadableStream;
    const savedMC = globalThis.MessageChannel;

    try {
      // 1. When ReadableStream is undefined
      // @ts-expect-error Testing missing ReadableStream
      delete globalThis.ReadableStream;
      expect(needsPolyfill()).toBe(false);

      // 2. When ReadableStream constructor throws
      globalThis.ReadableStream = class {
        constructor() {
          throw new Error('Cannot construct');
        }
      } as unknown as typeof ReadableStream;
      expect(needsPolyfill()).toBe(true);

      // Provide a working ReadableStream mock that invokes start(controller)
      globalThis.ReadableStream = class {
        constructor(underlyingSource?: { start?: (controller: { close: () => void }) => void }) {
          underlyingSource?.start?.({ close: () => {} });
        }
      } as unknown as typeof ReadableStream;

      // 3. When MessageChannel port1.postMessage throws (simulating Safari 16-17)
      globalThis.MessageChannel = class {
        port1 = {
          postMessage: () => {
            throw new DOMException('ReadableStream is not transferable', 'DataCloneError');
          },
          close: () => {},
        };
        port2 = {
          close: () => {},
        };
      } as unknown as typeof MessageChannel;
      expect(needsPolyfill()).toBe(true);

      // 4. When MessageChannel port1.postMessage succeeds (modern browser)
      globalThis.MessageChannel = class {
        port1 = {
          postMessage: () => {},
          close: () => {},
        };
        port2 = {
          close: () => {},
        };
      } as unknown as typeof MessageChannel;
      expect(needsPolyfill()).toBe(false);
    } finally {
      if (savedRS !== undefined) {
        globalThis.ReadableStream = savedRS;
      } else {
        // @ts-expect-error Restore undefined ReadableStream
        delete globalThis.ReadableStream;
      }
      if (savedMC !== undefined) {
        globalThis.MessageChannel = savedMC;
      } else {
        // @ts-expect-error Restore undefined MessageChannel
        delete globalThis.MessageChannel;
      }
    }
  });

  it('handles Safari UA without Version/ match, Chromium UA, and missing or Safari navigator', () => {
    const safariWithoutVersion =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Safari/605.1.15';
    expect(isLegacySafari(safariWithoutVersion)).toBe(false);

    const chromiumUA = 'Mozilla/5.0 Chromium/120.0.0.0 Safari/537.36';
    expect(isSafari(chromiumUA)).toBe(false);

    const savedNav = globalThis.navigator;
    try {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
        },
        configurable: true,
        writable: true,
      });
      expect(isLegacySafari()).toBe(true);

      // @ts-expect-error Testing missing navigator
      delete globalThis.navigator;
      expect(isSafari()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'navigator', {
        value: savedNav,
        configurable: true,
        writable: true,
      });
    }
  });
});
