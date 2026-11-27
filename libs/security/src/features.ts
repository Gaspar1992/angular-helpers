import type { Provider } from '@angular/core';
import {
  RegexSecurityService,
  REGEX_SECURITY_DEFAULTS,
  type RegexSecurityDefaults,
} from './services/regex-security.service';
import { RegexAnalyzerService } from './services/regex-analyzer.service';
import { RegexWorkerPoolService } from './services/regex-worker-pool.service';
import { WebCryptoService } from './services/web-crypto.service';
import {
  SecureStorageService,
  SECURE_STORAGE_CONFIG,
  type SecureStorageConfig,
} from './services/secure-storage.service';
import {
  InputSanitizerService,
  SANITIZER_CONFIG,
  type SanitizerConfig,
} from './services/input-sanitizer.service';
import { PasswordStrengthService } from './services/password-strength.service';
import { JwtService } from './services/jwt.service';
import { SensitiveClipboardService } from './services/sensitive-clipboard.service';
import { HibpService, HIBP_CONFIG, type HibpConfig } from './services/hibp.service';
import {
  RateLimiterService,
  RATE_LIMITER_CONFIG,
  type RateLimiterConfig,
} from './services/rate-limiter.service';
import { CsrfService, CSRF_CONFIG, type CsrfConfig } from './services/csrf.service';
import { SessionIdleService } from './services/session-idle.service';
import { SecureMessageService } from './services/secure-message.service';
import { WebAuthnService } from './services/web-authn.service';
import { CspService } from './services/csp.service';

export type SecurityFeatureKind =
  | 'regex-security'
  | 'web-crypto'
  | 'secure-storage'
  | 'input-sanitizer'
  | 'password-strength'
  | 'jwt'
  | 'sensitive-clipboard'
  | 'hibp'
  | 'rate-limiter'
  | 'csrf'
  | 'session-idle'
  | 'secure-message'
  | 'web-authn'
  | 'csp';

export interface SecurityFeature<Kind extends SecurityFeatureKind = SecurityFeatureKind> {
  readonly kind: Kind;
  readonly providers: Provider[];
}

export function withRegexSecurity(
  config?: RegexSecurityDefaults,
): SecurityFeature<'regex-security'> {
  return {
    kind: 'regex-security',
    providers: [
      RegexAnalyzerService,
      RegexWorkerPoolService,
      RegexSecurityService,
      ...(config ? [{ provide: REGEX_SECURITY_DEFAULTS, useValue: config }] : []),
    ],
  };
}

export function withWebCrypto(): SecurityFeature<'web-crypto'> {
  return { kind: 'web-crypto', providers: [WebCryptoService] };
}

export function withSecureStorage(config?: SecureStorageConfig): SecurityFeature<'secure-storage'> {
  return {
    kind: 'secure-storage',
    providers: [
      SecureStorageService,
      ...(config ? [{ provide: SECURE_STORAGE_CONFIG, useValue: config }] : []),
    ],
  };
}

export function withInputSanitizer(config?: SanitizerConfig): SecurityFeature<'input-sanitizer'> {
  return {
    kind: 'input-sanitizer',
    providers: [
      InputSanitizerService,
      ...(config ? [{ provide: SANITIZER_CONFIG, useValue: config }] : []),
    ],
  };
}

export function withPasswordStrength(): SecurityFeature<'password-strength'> {
  return { kind: 'password-strength', providers: [PasswordStrengthService] };
}

export function withJwt(): SecurityFeature<'jwt'> {
  return { kind: 'jwt', providers: [JwtService] };
}

export function withSensitiveClipboard(): SecurityFeature<'sensitive-clipboard'> {
  return { kind: 'sensitive-clipboard', providers: [SensitiveClipboardService] };
}

export function withHibp(config?: HibpConfig): SecurityFeature<'hibp'> {
  return {
    kind: 'hibp',
    providers: [
      WebCryptoService,
      HibpService,
      ...(config ? [{ provide: HIBP_CONFIG, useValue: config }] : []),
    ],
  };
}

export function withRateLimiter(config?: RateLimiterConfig): SecurityFeature<'rate-limiter'> {
  return {
    kind: 'rate-limiter',
    providers: [
      RateLimiterService,
      ...(config ? [{ provide: RATE_LIMITER_CONFIG, useValue: config }] : []),
    ],
  };
}

export function withCsrf(config?: CsrfConfig): SecurityFeature<'csrf'> {
  return {
    kind: 'csrf',
    providers: [
      WebCryptoService,
      CsrfService,
      ...(config ? [{ provide: CSRF_CONFIG, useValue: config }] : []),
    ],
  };
}

export function withSessionIdle(): SecurityFeature<'session-idle'> {
  return { kind: 'session-idle', providers: [SessionIdleService] };
}

export function withSecureMessage(): SecurityFeature<'secure-message'> {
  return { kind: 'secure-message', providers: [WebCryptoService, SecureMessageService] };
}

export function withWebAuthn(): SecurityFeature<'web-authn'> {
  return { kind: 'web-authn', providers: [WebAuthnService] };
}

export function withCsp(): SecurityFeature<'csp'> {
  return { kind: 'csp', providers: [CspService] };
}
