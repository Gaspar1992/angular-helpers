import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HibpService, HIBP_CONFIG } from './hibp.service';
import { WebCryptoService } from './web-crypto.service';

describe('HibpService', () => {
  let service: HibpService;
  let mockWebCrypto: {
    hash: ReturnType<typeof vi.fn>;
    isSupported: ReturnType<typeof vi.fn>;
  };
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();

    mockWebCrypto = {
      hash: vi.fn().mockResolvedValue('5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8'), // SHA-1 of 'password'
      isSupported: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        HibpService,
        { provide: WebCryptoService, useValue: mockWebCrypto },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(HibpService);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    TestBed.resetTestingModule();
  });

  describe('isSupported', () => {
    it('returns true when in browser, fetch is available, and webCrypto is supported', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('returns false when in SSR', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HibpService,
          { provide: WebCryptoService, useValue: mockWebCrypto },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const ssrService = TestBed.inject(HibpService);
      expect(ssrService.isSupported()).toBe(false);
    });

    it('returns false when webCrypto is not supported', () => {
      mockWebCrypto.isSupported.mockReturnValue(false);
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('isPasswordLeaked', () => {
    it('returns unsupported error when environment is not supported', async () => {
      mockWebCrypto.isSupported.mockReturnValue(false);
      const res = await service.isPasswordLeaked('password');
      expect(res).toEqual({ leaked: false, count: 0, error: 'unsupported' });
    });

    it('returns leaked: false when password is empty', async () => {
      const res = await service.isPasswordLeaked('');
      expect(res).toEqual({ leaked: false, count: 0 });
    });

    it('returns unsupported error when hashing throws', async () => {
      mockWebCrypto.hash.mockRejectedValue(new Error('Crypto failure'));
      const res = await service.isPasswordLeaked('mypassword');
      expect(res).toEqual({ leaked: false, count: 0, error: 'unsupported' });
    });

    it('calls HIBP range endpoint with 5-character prefix and Add-Padding header', async () => {
      // Hash: 5BAA6 1E4C9B93F3F0682250B6CF8331B7EE68FD8
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493\r\n0018A45C4D63AE5D13F7154DE63D06151E9:2',
          ),
      });

      const res = await service.isPasswordLeaked('password');

      expect(globalThis.fetch).toHaveBeenCalledWith('https://api.pwnedpasswords.com/range/5BAA6', {
        method: 'GET',
        headers: { 'Add-Padding': 'true' },
      });
      expect(res).toEqual({ leaked: true, count: 3861493 });
    });

    it('returns leaked: false when suffix is not found in response', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OTHER_SUFFIX:100\r\nANOTHER_SUFFIX:5'),
      });

      const res = await service.isPasswordLeaked('password');
      expect(res).toEqual({ leaked: false, count: 0 });
    });

    it('handles padding rows (count: 0) as not leaked', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve('1E4C9B93F3F0682250B6CF8331B7EE68FD8:0\r\nINVALID_LINE_WITHOUT_COLON'),
      });

      const res = await service.isPasswordLeaked('password');
      expect(res).toEqual({ leaked: false, count: 0 });
    });

    it('returns leaked: false on 404 response', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const res = await service.isPasswordLeaked('password');
      expect(res).toEqual({ leaked: false, count: 0 });
    });

    it('returns network error fail-open on non-200 and fetch rejection', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      let res = await service.isPasswordLeaked('password');
      expect(res).toEqual({ leaked: false, count: 0, error: 'network' });

      (globalThis.fetch as any).mockRejectedValue(new Error('Network error'));
      res = await service.isPasswordLeaked('password');
      expect(res).toEqual({ leaked: false, count: 0, error: 'network' });
    });

    it('supports custom endpoint via HIBP_CONFIG', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          HibpService,
          { provide: WebCryptoService, useValue: mockWebCrypto },
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: HIBP_CONFIG,
            useValue: { endpoint: 'https://proxy.internal.com/hibp/' },
          },
        ],
      });
      const customService = TestBed.inject(HibpService);

      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(''),
      });

      await customService.isPasswordLeaked('password');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://proxy.internal.com/hibp/5BAA6',
        expect.any(Object),
      );
    });
  });
});
