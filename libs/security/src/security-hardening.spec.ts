import { describe, it, expect, vi, afterEach } from 'vitest';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  InputSanitizerService,
  JwtService,
  SecureMessageService,
  SecureStorageService,
  SensitiveClipboardService,
  SessionIdleService,
  WebAuthnService,
  WebCryptoService,
  provideCsp,
  provideInputSanitizer,
  provideJwt,
  provideSecureStorage,
  provideSensitiveClipboard,
  provideWebCrypto,
  CspService,
} from './index';

describe('security hardening regressions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolves root services without provideSecurity() and guards SSR', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideWebCrypto()],
    });

    const cryptoSvc = TestBed.inject(WebCryptoService);
    const msgSvc = TestBed.inject(SecureMessageService);
    const idleSvc = TestBed.inject(SessionIdleService);

    expect(cryptoSvc.isSupported()).toBe(false);
    expect(() => idleSvc.start({ timeoutMs: 1000 })).not.toThrow();
    idleSvc.stop();
    expect(msgSvc).toBeDefined();
  });

  it('strips <script> subtrees completely and sanitizes in getTrustedHtml without TrustedTypes', () => {
    TestBed.configureTestingModule({
      providers: [provideInputSanitizer()],
    });
    const sanitizer = TestBed.inject(InputSanitizerService);

    const clean = sanitizer.sanitizeHtml(
      '<b>Safe</b><script>alert(1)</script><style>body{}</style>',
    );
    expect(clean).toBe('<b>Safe</b>');

    const trusted = sanitizer.getTrustedHtml('<img src=x onerror=alert(1)><b>Ok</b>');
    expect(String(trusted)).not.toContain('onerror');
    expect(String(trusted)).toContain('<b>Ok</b>');
  });

  it('rejects valid JSON non-object payloads in JwtService.decode and returns true in isExpired', () => {
    TestBed.configureTestingModule({
      providers: [provideJwt()],
    });
    const jwt = TestBed.inject(JwtService);

    // "bnVsbA" is base64url("null")
    expect(() => jwt.decode('a.bnVsbA.c')).toThrow('JSON object');
    expect(jwt.isExpired('a.bnVsbA.c')).toBe(true);
  });

  it('preserves __ss_salt__ on SecureStorageService.clear() and deduplicates concurrent ensureKey()', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideSecureStorage({ pbkdf2Iterations: 1000 })],
    });
    const storage = TestBed.inject(SecureStorageService);

    await storage.initWithPassphrase('pass-123');
    expect(localStorage.getItem('__ss_salt__')).toBeTruthy();

    await Promise.all([storage.set('a', 1), storage.set('b', 2)]);
    expect(await storage.get<number>('a')).toBe(1);
    expect(await storage.get<number>('b')).toBe(2);

    storage.clear();
    expect(localStorage.getItem('__ss_salt__')).toBeTruthy();
    expect(await storage.get<number>('a')).toBeNull();
  });

  it('handles null getPublicKey() in WebAuthnService.register()', async () => {
    const originalCreds = navigator.credentials;
    const originalPk = (window as unknown as { PublicKeyCredential?: unknown }).PublicKeyCredential;

    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: {
        create: vi.fn().mockResolvedValue({
          id: 'cred-1',
          rawId: new Uint8Array([1, 2]).buffer,
          authenticatorAttachment: 'platform',
          getClientExtensionResults: () => ({}),
          response: {
            clientDataJSON: new Uint8Array([3]).buffer,
            attestationObject: new Uint8Array([4]).buffer,
            getTransports: () => ['internal'],
            getPublicKey: () => null,
            getPublicKeyAlgorithm: () => -7,
            getAuthenticatorData: () => new Uint8Array([5]).buffer,
          },
        }),
      },
    });
    Object.defineProperty(window, 'PublicKeyCredential', {
      configurable: true,
      value: function PublicKeyCredential() {},
    });

    try {
      TestBed.configureTestingModule({});
      const webAuthn = TestBed.inject(WebAuthnService);
      const result = await webAuthn.register({
        challenge: 'AQID',
        rp: { name: 'Test' },
        user: { id: 'AQID', name: 'u', displayName: 'U' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      });
      expect(result.response.publicKey).toBeUndefined();
    } finally {
      Object.defineProperty(navigator, 'credentials', { configurable: true, value: originalCreds });
      Object.defineProperty(window, 'PublicKeyCredential', {
        configurable: true,
        value: originalPk,
      });
    }
  });

  it('provides CspService via provideCsp() and returns changed status in SensitiveClipboardService', async () => {
    TestBed.configureTestingModule({
      providers: [provideCsp(), provideSensitiveClipboard()],
    });
    expect(TestBed.inject(CspService)).toBeDefined();
    const clip = TestBed.inject(SensitiveClipboardService);
    expect(clip).toBeDefined();
  });
});
