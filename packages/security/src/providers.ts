import { makeEnvironmentProviders, EnvironmentProviders, Provider } from '@angular/core';
import { RegexSecurityService } from './services/regex-security.service';
import { WebCryptoService } from './services/web-crypto.service';
import {
  SecureStorageService,
  SecureStorageConfig,
  SECURE_STORAGE_CONFIG,
} from './services/secure-storage.service';
import {
  InputSanitizerService,
  SanitizerConfig,
  SANITIZER_CONFIG,
} from './services/input-sanitizer.service';
import { PasswordStrengthService } from './services/password-strength.service';
import { JwtService } from './services/jwt.service';
import { SensitiveClipboardService } from './services/sensitive-clipboard.service';
import { HibpService, HibpConfig, HIBP_CONFIG } from './services/hibp.service';
import {
  RateLimiterService,
  RateLimiterConfig,
  RATE_LIMITER_CONFIG,
} from './services/rate-limiter.service';
import { CsrfService, CsrfConfig, CSRF_CONFIG } from './services/csrf.service';

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
  defaultTimeout: 5000,
  safeMode: false,
};

export function provideSecurity(config: SecurityConfig = {}): EnvironmentProviders {
  const mergedConfig = { ...defaultSecurityConfig, ...config };
  const providers: Provider[] = [];

  if (mergedConfig.enableRegexSecurity) providers.push(RegexSecurityService);
  if (mergedConfig.enableWebCrypto) providers.push(WebCryptoService);
  if (mergedConfig.enableSecureStorage) providers.push(SecureStorageService);
  if (mergedConfig.enableInputSanitizer) providers.push(InputSanitizerService);
  if (mergedConfig.enablePasswordStrength) providers.push(PasswordStrengthService);
  if (mergedConfig.enableJwt) providers.push(JwtService);
  if (mergedConfig.enableSensitiveClipboard) providers.push(SensitiveClipboardService);
  if (mergedConfig.enableHibp) {
    providers.push(WebCryptoService, HibpService);
  }
  if (mergedConfig.enableRateLimiter) providers.push(RateLimiterService);
  if (mergedConfig.enableCsrf) {
    providers.push(WebCryptoService, CsrfService);
  }

  return makeEnvironmentProviders(providers);
}

export function provideRegexSecurity(): EnvironmentProviders {
  return makeEnvironmentProviders([RegexSecurityService]);
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
