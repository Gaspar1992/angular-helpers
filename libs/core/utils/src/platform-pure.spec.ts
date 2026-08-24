// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { isPlatformBrowser, isPlatformServer, getGlobalWindow } from './platform-pure';

describe('platform-pure', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('node / server environment (default in node test environment)', () => {
    it('should detect server when window and document are not defined', () => {
      expect(isPlatformBrowser()).toBe(false);
      expect(isPlatformServer()).toBe(true);
      expect(getGlobalWindow()).toBeUndefined();
    });

    it('should detect server when only window is defined but document is undefined', () => {
      vi.stubGlobal('window', {} as any);
      expect(isPlatformBrowser()).toBe(false);
      expect(isPlatformServer()).toBe(true);
      expect(getGlobalWindow()).toBeUndefined();
    });

    it('should detect server when only document is defined but window is undefined', () => {
      vi.stubGlobal('document', {} as any);
      expect(isPlatformBrowser()).toBe(false);
      expect(isPlatformServer()).toBe(true);
      expect(getGlobalWindow()).toBeUndefined();
    });
  });

  describe('browser environment simulation', () => {
    it('should detect browser when both window and document are defined', () => {
      const mockWindow = { name: 'mockWindow' } as any;
      const mockDocument = { title: 'mockDoc' } as any;
      vi.stubGlobal('window', mockWindow);
      vi.stubGlobal('document', mockDocument);

      expect(isPlatformBrowser()).toBe(true);
      expect(isPlatformServer()).toBe(false);
      expect(getGlobalWindow()).toBe(mockWindow);
    });
  });
});
