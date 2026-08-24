import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  provideSecurity,
  provideRegexSecurity,
  provideWebCrypto,
  provideSecureStorage,
  provideInputSanitizer,
  providePasswordStrength,
  provideJwt,
  provideSensitiveClipboard,
  provideHibp,
  provideRateLimiter,
  provideCsrf,
  provideSessionIdle,
  provideSecureMessage,
  provideWebAuthn,
} from './providers';
import { RegexSecurityService } from './services/regex-security.service';
import { RegexAnalyzerService } from './services/regex-analyzer.service';
import { RegexWorkerPoolService } from './services/regex-worker-pool.service';
import { WebCryptoService } from './services/web-crypto.service';
import { SecureStorageService, SECURE_STORAGE_CONFIG } from './services/secure-storage.service';
import { InputSanitizerService, SANITIZER_CONFIG } from './services/input-sanitizer.service';
import { PasswordStrengthService } from './services/password-strength.service';
import { JwtService } from './services/jwt.service';
import { SensitiveClipboardService } from './services/sensitive-clipboard.service';
import { HibpService, HIBP_CONFIG } from './services/hibp.service';
import { RateLimiterService, RATE_LIMITER_CONFIG } from './services/rate-limiter.service';
import { CsrfService, CSRF_CONFIG } from './services/csrf.service';
import { SessionIdleService } from './services/session-idle.service';
import { SecureMessageService } from './services/secure-message.service';
import { WebAuthnService } from './services/web-authn.service';

describe('Security Providers', () => {
  describe('provideSecurity', () => {
    it('provides default security services (RegexSecurity and WebCrypto)', () => {
      TestBed.configureTestingModule({
        providers: [provideSecurity()],
      });

      expect(TestBed.inject(RegexAnalyzerService)).toBeTruthy();
      expect(TestBed.inject(RegexWorkerPoolService)).toBeTruthy();
      expect(TestBed.inject(RegexSecurityService)).toBeTruthy();
      expect(TestBed.inject(WebCryptoService)).toBeTruthy();
    });

    it('can disable default services via config', () => {
      TestBed.configureTestingModule({
        providers: [
          provideSecurity({
            enableRegexSecurity: false,
            enableWebCrypto: false,
          }),
        ],
      });

      expect(TestBed.inject(RegexSecurityService, null)).toBeNull();
      expect(TestBed.inject(WebCryptoService, null)).toBeNull();
    });

    it('provides all optional services when enabled via config', () => {
      TestBed.configureTestingModule({
        providers: [
          provideSecurity({
            enableSecureStorage: true,
            enableInputSanitizer: true,
            enablePasswordStrength: true,
            enableJwt: true,
            enableSensitiveClipboard: true,
            enableHibp: true,
            enableRateLimiter: true,
            enableCsrf: true,
            enableSessionIdle: true,
            enableSecureMessage: true,
            enableWebAuthn: true,
          }),
        ],
      });

      expect(TestBed.inject(SecureStorageService)).toBeTruthy();
      expect(TestBed.inject(InputSanitizerService)).toBeTruthy();
      expect(TestBed.inject(PasswordStrengthService)).toBeTruthy();
      expect(TestBed.inject(JwtService)).toBeTruthy();
      expect(TestBed.inject(SensitiveClipboardService)).toBeTruthy();
      expect(TestBed.inject(HibpService)).toBeTruthy();
      expect(TestBed.inject(RateLimiterService)).toBeTruthy();
      expect(TestBed.inject(CsrfService)).toBeTruthy();
      expect(TestBed.inject(SessionIdleService)).toBeTruthy();
      expect(TestBed.inject(SecureMessageService)).toBeTruthy();
      expect(TestBed.inject(WebAuthnService)).toBeTruthy();
    });
  });

  describe('individual provider functions', () => {
    it('provideRegexSecurity', () => {
      TestBed.configureTestingModule({ providers: [provideRegexSecurity()] });
      expect(TestBed.inject(RegexSecurityService)).toBeTruthy();
      expect(TestBed.inject(RegexAnalyzerService)).toBeTruthy();
      expect(TestBed.inject(RegexWorkerPoolService)).toBeTruthy();
    });

    it('provideWebCrypto', () => {
      TestBed.configureTestingModule({ providers: [provideWebCrypto()] });
      expect(TestBed.inject(WebCryptoService)).toBeTruthy();
    });

    it('provideSecureStorage with and without config', () => {
      TestBed.configureTestingModule({
        providers: [provideSecureStorage({ storage: 'session' })],
      });
      expect(TestBed.inject(SecureStorageService)).toBeTruthy();
      expect(TestBed.inject(SECURE_STORAGE_CONFIG)).toEqual({ storage: 'session' });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideSecureStorage()],
      });
      expect(TestBed.inject(SecureStorageService)).toBeTruthy();
      expect(TestBed.inject(SECURE_STORAGE_CONFIG, null)).toBeNull();
    });

    it('provideInputSanitizer with and without config', () => {
      TestBed.configureTestingModule({
        providers: [provideInputSanitizer({ allowedTags: ['p', 'div'] })],
      });
      expect(TestBed.inject(InputSanitizerService)).toBeTruthy();
      expect(TestBed.inject(SANITIZER_CONFIG)).toEqual({ allowedTags: ['p', 'div'] });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideInputSanitizer()],
      });
      expect(TestBed.inject(InputSanitizerService)).toBeTruthy();
      expect(TestBed.inject(SANITIZER_CONFIG, null)).toBeNull();
    });

    it('providePasswordStrength', () => {
      TestBed.configureTestingModule({ providers: [providePasswordStrength()] });
      expect(TestBed.inject(PasswordStrengthService)).toBeTruthy();
    });

    it('provideJwt', () => {
      TestBed.configureTestingModule({ providers: [provideJwt()] });
      expect(TestBed.inject(JwtService)).toBeTruthy();
    });

    it('provideSensitiveClipboard', () => {
      TestBed.configureTestingModule({ providers: [provideSensitiveClipboard()] });
      expect(TestBed.inject(SensitiveClipboardService)).toBeTruthy();
    });

    it('provideHibp with and without config', () => {
      TestBed.configureTestingModule({
        providers: [provideHibp({ endpoint: 'https://custom.hibp/' })],
      });
      expect(TestBed.inject(HibpService)).toBeTruthy();
      expect(TestBed.inject(WebCryptoService)).toBeTruthy();
      expect(TestBed.inject(HIBP_CONFIG)).toEqual({ endpoint: 'https://custom.hibp/' });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHibp()],
      });
      expect(TestBed.inject(HibpService)).toBeTruthy();
      expect(TestBed.inject(HIBP_CONFIG, null)).toBeNull();
    });

    it('provideRateLimiter with and without config', () => {
      TestBed.configureTestingModule({
        providers: [provideRateLimiter({ maxRequests: 10, windowMs: 1000 })],
      });
      expect(TestBed.inject(RateLimiterService)).toBeTruthy();
      expect(TestBed.inject(RATE_LIMITER_CONFIG)).toEqual({ maxRequests: 10, windowMs: 1000 });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideRateLimiter()],
      });
      expect(TestBed.inject(RateLimiterService)).toBeTruthy();
      expect(TestBed.inject(RATE_LIMITER_CONFIG, null)).toBeNull();
    });

    it('provideCsrf with and without config', () => {
      TestBed.configureTestingModule({
        providers: [provideCsrf({ storage: 'local' })],
      });
      expect(TestBed.inject(CsrfService)).toBeTruthy();
      expect(TestBed.inject(WebCryptoService)).toBeTruthy();
      expect(TestBed.inject(CSRF_CONFIG)).toEqual({ storage: 'local' });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideCsrf()],
      });
      expect(TestBed.inject(CsrfService)).toBeTruthy();
      expect(TestBed.inject(CSRF_CONFIG, null)).toBeNull();
    });

    it('provideSessionIdle', () => {
      TestBed.configureTestingModule({ providers: [provideSessionIdle()] });
      expect(TestBed.inject(SessionIdleService)).toBeTruthy();
    });

    it('provideSecureMessage', () => {
      TestBed.configureTestingModule({ providers: [provideSecureMessage()] });
      expect(TestBed.inject(SecureMessageService)).toBeTruthy();
      expect(TestBed.inject(WebCryptoService)).toBeTruthy();
    });

    it('provideWebAuthn', () => {
      TestBed.configureTestingModule({ providers: [provideWebAuthn()] });
      expect(TestBed.inject(WebAuthnService)).toBeTruthy();
    });
  });
});
