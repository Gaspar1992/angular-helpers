import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
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

export interface SecurityConfig {
  enableRegexSecurity?: boolean;
  enableWebCrypto?: boolean;
  enableSecureStorage?: boolean;
  enableInputSanitizer?: boolean;
  enablePasswordStrength?: boolean;
  defaultTimeout?: number;
  safeMode?: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  enableRegexSecurity: true,
  enableWebCrypto: true,
  enableSecureStorage: false,
  enableInputSanitizer: false,
  enablePasswordStrength: false,
  defaultTimeout: 5000,
  safeMode: false,
};

export function provideSecurity(config: SecurityConfig = {}): EnvironmentProviders {
  const mergedConfig = { ...defaultSecurityConfig, ...config };
  const providers = [];

  if (mergedConfig.enableRegexSecurity) {
    providers.push(RegexSecurityService);
  }

  if (mergedConfig.enableWebCrypto) {
    providers.push(WebCryptoService);
  }

  if (mergedConfig.enableSecureStorage) {
    providers.push(SecureStorageService);
  }

  if (mergedConfig.enableInputSanitizer) {
    providers.push(InputSanitizerService);
  }

  if (mergedConfig.enablePasswordStrength) {
    providers.push(PasswordStrengthService);
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
