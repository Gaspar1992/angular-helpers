import { makeEnvironmentProviders, type EnvironmentProviders, type Provider } from '@angular/core';
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

export interface SecurityConfig {
  enableRegexSecurity?: boolean;
  enableWebCrypto?: boolean;
  enableSecureStorage?: boolean;
  enableInputSanitizer?: boolean;
  enablePasswordStrength?: boolean;
  enableJwt?: boolean;
  enableSensitiveClipboard?: boolean;
  enableHibp?: boolean;
  enableRateLimiter?: boolean;
  enableCsrf?: boolean;
  enableSessionIdle?: boolean;
  enableSecureMessage?: boolean;
  enableWebAuthn?: boolean;
  defaultTimeout?: number;
  safeMode?: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  enableRegexSecurity: true,
  enableWebCrypto: true,
  enableSecureStorage: false,
  enableInputSanitizer: false,
  enablePasswordStrength: false,
  enableJwt: false,
  enableSensitiveClipboard: false,
  enableHibp: false,
  enableRateLimiter: false,
  enableCsrf: false,
  enableSessionIdle: false,
  enableSecureMessage: false,
  enableWebAuthn: false,
  defaultTimeout: 5000,
  safeMode: false,
};

export function provideSecurity(config: SecurityConfig = {}): EnvironmentProviders {
  const mergedConfig = { ...defaultSecurityConfig, ...config };
  const services = new Set<Provider>();
  const extraProviders: Provider[] = [];

  if (mergedConfig.enableRegexSecurity) {
    services.add(RegexAnalyzerService);
    services.add(RegexWorkerPoolService);
    services.add(RegexSecurityService);
    extraProviders.push({
      provide: REGEX_SECURITY_DEFAULTS,
      useValue: {
        defaultTimeout: mergedConfig.defaultTimeout,
        safeMode: mergedConfig.safeMode,
      },
    });
  }
  if (mergedConfig.enableWebCrypto) services.add(WebCryptoService);
  if (mergedConfig.enableSecureStorage) services.add(SecureStorageService);
  if (mergedConfig.enableInputSanitizer) services.add(InputSanitizerService);
  if (mergedConfig.enablePasswordStrength) services.add(PasswordStrengthService);
  if (mergedConfig.enableJwt) services.add(JwtService);
  if (mergedConfig.enableSensitiveClipboard) services.add(SensitiveClipboardService);
  if (mergedConfig.enableHibp) {
    services.add(WebCryptoService);
    services.add(HibpService);
  }
  if (mergedConfig.enableRateLimiter) services.add(RateLimiterService);
  if (mergedConfig.enableCsrf) {
    services.add(WebCryptoService);
    services.add(CsrfService);
  }
  if (mergedConfig.enableSessionIdle) services.add(SessionIdleService);
  if (mergedConfig.enableSecureMessage) {
    services.add(WebCryptoService);
    services.add(SecureMessageService);
  }
  if (mergedConfig.enableWebAuthn) services.add(WebAuthnService);

  return makeEnvironmentProviders([...services, ...extraProviders]);
}

export function provideRegexSecurity(config?: RegexSecurityDefaults): EnvironmentProviders {
  return makeEnvironmentProviders([
    RegexAnalyzerService,
    RegexWorkerPoolService,
    RegexSecurityService,
    ...(config ? [{ provide: REGEX_SECURITY_DEFAULTS, useValue: config }] : []),
  ]);
}

export function provideWebCrypto(): EnvironmentProviders {
  return makeEnvironmentProviders([WebCryptoService]);
}

export function provideSecureStorage(config?: SecureStorageConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    SecureStorageService,
    ...(config ? [{ provide: SECURE_STORAGE_CONFIG, useValue: config }] : []),
  ]);
}

export function provideInputSanitizer(config?: SanitizerConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    InputSanitizerService,
    ...(config ? [{ provide: SANITIZER_CONFIG, useValue: config }] : []),
  ]);
}

export function providePasswordStrength(): EnvironmentProviders {
  return makeEnvironmentProviders([PasswordStrengthService]);
}

export function provideJwt(): EnvironmentProviders {
  return makeEnvironmentProviders([JwtService]);
}

export function provideSensitiveClipboard(): EnvironmentProviders {
  return makeEnvironmentProviders([SensitiveClipboardService]);
}

export function provideHibp(config?: HibpConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebCryptoService,
    HibpService,
    ...(config ? [{ provide: HIBP_CONFIG, useValue: config }] : []),
  ]);
}

export function provideRateLimiter(config?: RateLimiterConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    RateLimiterService,
    ...(config ? [{ provide: RATE_LIMITER_CONFIG, useValue: config }] : []),
  ]);
}

export function provideCsrf(config?: CsrfConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    WebCryptoService,
    CsrfService,
    ...(config ? [{ provide: CSRF_CONFIG, useValue: config }] : []),
  ]);
}

export function provideSessionIdle(): EnvironmentProviders {
  return makeEnvironmentProviders([SessionIdleService]);
}

export function provideSecureMessage(): EnvironmentProviders {
  return makeEnvironmentProviders([WebCryptoService, SecureMessageService]);
}

export function provideWebAuthn(): EnvironmentProviders {
  return makeEnvironmentProviders([WebAuthnService]);
}
