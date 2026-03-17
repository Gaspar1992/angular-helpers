import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrowserSupportUtil } from './browser-support.util';

describe('BrowserSupportUtil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true for camera when mediaDevices API is available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('camera')).toBe(true);
    });

    it('should return false for camera when mediaDevices API is not available', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('camera')).toBe(false);
    });

    it('should return true for notifications when Notification API is available', () => {
      Object.defineProperty(global, 'Notification', {
        value: { requestPermission: vi.fn() },
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('notifications')).toBe(true);
    });

    it('should return false for notifications when Notification API is not available', () => {
      Object.defineProperty(global, 'Notification', {
        value: undefined,
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('notifications')).toBe(false);
    });

    it('should return true for geolocation when geolocation API is available', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('geolocation')).toBe(true);
    });

    it('should return false for geolocation when geolocation API is not available', () => {
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('geolocation')).toBe(false);
    });

    it('should return true for clipboard when clipboard API is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn(), readText: vi.fn() },
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('clipboard')).toBe(true);
    });

    it('should return false for clipboard when clipboard API is not available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('clipboard')).toBe(false);
    });

    it('should return true for permissions when permissions API is available', () => {
      Object.defineProperty(navigator, 'permissions', {
        value: { query: vi.fn() },
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('permissions')).toBe(true);
    });

    it('should return false for permissions when permissions API is not available', () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true
      });

      expect(BrowserSupportUtil.isSupported('permissions')).toBe(false);
    });

    it('should return false for unknown API', () => {
      expect(BrowserSupportUtil.isSupported('unknown-api' as any)).toBe(false);
    });
  });

  describe('getSupportedFeatures', () => {
    it('should return list of supported features', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        writable: true
      });
      
      Object.defineProperty(global, 'Notification', {
        value: { requestPermission: vi.fn() },
        writable: true
      });
      
      Object.defineProperty(navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        writable: true
      });
      
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn(), readText: vi.fn() },
        writable: true
      });
      
      Object.defineProperty(navigator, 'permissions', {
        value: { query: vi.fn() },
        writable: true
      });

      const supported = BrowserSupportUtil.getSupportedFeatures();

      expect(supported).toContain('camera');
      expect(supported).toContain('notifications');
      expect(supported).toContain('geolocation');
      expect(supported).toContain('clipboard');
      expect(supported).toContain('permissions');
    });

    it('should return empty array when no APIs are supported', () => {
      Object.defineProperty(navigator, 'mediaDevices', { value: undefined, writable: true });
      Object.defineProperty(global, 'Notification', { value: undefined, writable: true });
      Object.defineProperty(navigator, 'geolocation', { value: undefined, writable: true });
      Object.defineProperty(navigator, 'clipboard', { value: undefined, writable: true });
      Object.defineProperty(navigator, 'permissions', { value: undefined, writable: true });

      const supported = BrowserSupportUtil.getSupportedFeatures();

      expect(supported).toEqual([]);
    });
  });

  describe('getBrowserInfo', () => {
    it('should return browser information', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
      });

      const info = BrowserSupportUtil.getBrowserInfo();

      expect(info.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      expect(info.platform).toBeDefined();
      expect(info.language).toBeDefined();
      expect(info.languages).toBeDefined();
      expect(info.cookieEnabled).toBeDefined();
      expect(info.onLine).toBeDefined();
    });

    it('should handle missing properties gracefully', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: undefined,
        writable: true
      });

      const info = BrowserSupportUtil.getBrowserInfo();

      expect(info.userAgent).toBe('');
    });
  });

  describe('isSecureContext', () => {
    it('should return true when isSecureContext is available and true', () => {
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        writable: true
      });

      expect(BrowserSupportUtil.isSecureContext()).toBe(true);
    });

    it('should return false when isSecureContext is available and false', () => {
      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        writable: true
      });

      expect(BrowserSupportUtil.isSecureContext()).toBe(false);
    });

    it('should return false when isSecureContext is not available', () => {
      Object.defineProperty(window, 'isSecureContext', {
        value: undefined,
        writable: true
      });

      expect(BrowserSupportUtil.isSecureContext()).toBe(false);
    });
  });

  describe('checkFeatureRequirements', () => {
    it('should return true when all required features are supported', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        writable: true
      });
      
      Object.defineProperty(global, 'Notification', {
        value: { requestPermission: vi.fn() },
        writable: true
      });

      const result = BrowserSupportUtil.checkFeatureRequirements(['camera', 'notifications']);

      expect(result).toBe(true);
    });

    it('should return false when some required features are not supported', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        writable: true
      });
      
      Object.defineProperty(global, 'Notification', {
        value: undefined,
        writable: true
      });

      const result = BrowserSupportUtil.checkFeatureRequirements(['camera', 'notifications']);

      expect(result).toBe(false);
    });

    it('should return true for empty requirements array', () => {
      const result = BrowserSupportUtil.checkFeatureRequirements([]);

      expect(result).toBe(true);
    });
  });
});
