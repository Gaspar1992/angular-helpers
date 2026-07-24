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
});
