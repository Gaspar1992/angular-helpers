import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserSupportUtil } from './browser-support.util';

describe('BrowserSupportUtil', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should detect feature support correctly', () => {
    vi.stubGlobal('navigator', {
      permissions: {},
      mediaDevices: { getUserMedia: vi.fn() },
      geolocation: {},
      clipboard: { readText: vi.fn(), writeText: vi.fn() },
      storage: { persist: vi.fn() },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    vi.stubGlobal('Notification', class {});
    vi.stubGlobal('isSecureContext', true);

    expect(BrowserSupportUtil.isSupported('permissions')).toBe(true);
    expect(BrowserSupportUtil.isSupported('camera')).toBe(true);
    expect(BrowserSupportUtil.isSupported('microphone')).toBe(true);
    expect(BrowserSupportUtil.isSupported('geolocation')).toBe(true);
    expect(BrowserSupportUtil.isSupported('notifications')).toBe(true);
    expect(BrowserSupportUtil.isSupported('clipboard')).toBe(true);
    expect(BrowserSupportUtil.isSupported('clipboard-read')).toBe(true);
    expect(BrowserSupportUtil.isSupported('clipboard-write')).toBe(true);
    expect(BrowserSupportUtil.isSupported('persistent-storage')).toBe(true);
    expect(BrowserSupportUtil.isSupported('non-existent-feature')).toBe(false);

    expect(BrowserSupportUtil.isSecureContext()).toBe(true);
    expect(BrowserSupportUtil.isDesktop()).toBe(true);
    expect(BrowserSupportUtil.isMobile()).toBe(false);
  });

  it('should list unsupported features when missing', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1',
    });
    vi.stubGlobal('Notification', undefined);

    const unsupported = BrowserSupportUtil.getUnsupportedFeatures();
    expect(unsupported.length).toBeGreaterThan(0);
    expect(unsupported).toContain('camera');
    expect(unsupported).toContain('permissions');

    expect(BrowserSupportUtil.isMobile()).toBe(true);
    expect(BrowserSupportUtil.isDesktop()).toBe(false);
  });

  it('should parse browser name and version', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
    });

    const info = BrowserSupportUtil.getBrowserInfo();
    expect(info.name).toBe('Firefox');
    expect(info.version).toBe('119');
    expect(info.isFirefox).toBe(true);
    expect(info.isChrome).toBe(false);

    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    });
    const edgeInfo = BrowserSupportUtil.getBrowserInfo();
    expect(edgeInfo.name).toBe('Edge');
    expect(edgeInfo.isEdge).toBe(true);

    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    });
    const safariInfo = BrowserSupportUtil.getBrowserInfo();
    expect(safariInfo.name).toBe('Safari');
    expect(safariInfo.isSafari).toBe(true);
  });
});
