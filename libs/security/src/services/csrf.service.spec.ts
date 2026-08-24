import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { HttpRequest, HttpHandlerFn, type HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { CsrfService, CSRF_CONFIG, withCsrfHeader } from './csrf.service';
import { WebCryptoService } from './web-crypto.service';

describe('CsrfService & withCsrfHeader', () => {
  let service: CsrfService;
  let mockWebCrypto: {
    generateRandomBytes: ReturnType<typeof vi.fn>;
    isSupported: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();

    mockWebCrypto = {
      generateRandomBytes: vi.fn().mockReturnValue(new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd])),
      isSupported: vi.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      providers: [
        CsrfService,
        { provide: WebCryptoService, useValue: mockWebCrypto },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(CsrfService);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  describe('isSupported', () => {
    it('returns true in browser environment', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('returns false in server environment (SSR)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CsrfService,
          { provide: WebCryptoService, useValue: mockWebCrypto },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const ssrService = TestBed.inject(CsrfService);
      expect(ssrService.isSupported()).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('generates a hex string from random bytes', () => {
      const token = service.generateToken();
      expect(mockWebCrypto.generateRandomBytes).toHaveBeenCalledWith(32);
      expect(token).toBe('aabbccdd');
    });
  });

  describe('storeToken, getToken, clearToken (default sessionStorage)', () => {
    it('stores token in sessionStorage with default key', () => {
      service.storeToken('secret-csrf-token');
      expect(sessionStorage.getItem('__csrf_token__')).toBe('secret-csrf-token');
      expect(service.getToken()).toBe('secret-csrf-token');
    });

    it('clears token from sessionStorage', () => {
      service.storeToken('token-to-clear');
      service.clearToken();
      expect(sessionStorage.getItem('__csrf_token__')).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('returns null and no-ops when outside browser', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CsrfService,
          { provide: WebCryptoService, useValue: mockWebCrypto },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const ssrService = TestBed.inject(CsrfService);

      expect(ssrService.getToken()).toBeNull();
      ssrService.storeToken('any');
      ssrService.clearToken();
    });
  });

  describe('custom config (localStorage & custom key)', () => {
    it('persists in localStorage when configured', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          CsrfService,
          { provide: WebCryptoService, useValue: mockWebCrypto },
          { provide: PLATFORM_ID, useValue: 'browser' },
          {
            provide: CSRF_CONFIG,
            useValue: { storage: 'local', storageKey: 'custom_csrf_key' },
          },
        ],
      });
      const customService = TestBed.inject(CsrfService);

      customService.storeToken('custom-token');
      expect(localStorage.getItem('custom_csrf_key')).toBe('custom-token');
      expect(sessionStorage.getItem('custom_csrf_key')).toBeNull();
      expect(customService.getToken()).toBe('custom-token');

      customService.clearToken();
      expect(localStorage.getItem('custom_csrf_key')).toBeNull();
    });
  });

  describe('withCsrfHeader interceptor', () => {
    it('injects X-CSRF-Token header on POST/PUT/PATCH/DELETE when token is present', () => {
      service.storeToken('valid-csrf-token');

      const interceptor = withCsrfHeader();
      const nextHandler: HttpHandlerFn = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

      const postReq = new HttpRequest('POST', '/api/data', { item: 1 });
      TestBed.runInInjectionContext(() => {
        interceptor(postReq, nextHandler);
      });

      expect(nextHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            lazyUpdate: expect.arrayContaining([
              expect.objectContaining({ name: 'X-CSRF-Token', value: 'valid-csrf-token' }),
            ]),
          }),
        }),
      );
    });

    it('does NOT inject header on GET/HEAD requests', () => {
      service.storeToken('valid-csrf-token');

      const interceptor = withCsrfHeader();
      const nextHandler: HttpHandlerFn = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

      const getReq = new HttpRequest('GET', '/api/data');
      TestBed.runInInjectionContext(() => {
        interceptor(getReq, nextHandler);
      });

      expect(nextHandler).toHaveBeenCalledWith(getReq);
    });

    it('does NOT inject header when no token is stored', () => {
      const interceptor = withCsrfHeader();
      const nextHandler: HttpHandlerFn = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

      const postReq = new HttpRequest('POST', '/api/data', {});
      TestBed.runInInjectionContext(() => {
        interceptor(postReq, nextHandler);
      });

      expect(nextHandler).toHaveBeenCalledWith(postReq);
    });

    it('supports custom headerName and custom methods', () => {
      service.storeToken('my-token');

      const interceptor = withCsrfHeader({
        headerName: 'X-Custom-CSRF',
        methods: ['POST', 'GET'],
      });
      const nextHandler: HttpHandlerFn = vi.fn().mockReturnValue(of({} as HttpEvent<unknown>));

      const getReq = new HttpRequest('GET', '/api/data');
      TestBed.runInInjectionContext(() => {
        interceptor(getReq, nextHandler);
      });

      expect(nextHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            lazyUpdate: expect.arrayContaining([
              expect.objectContaining({ name: 'X-Custom-CSRF', value: 'my-token' }),
            ]),
          }),
        }),
      );
    });
  });
});
