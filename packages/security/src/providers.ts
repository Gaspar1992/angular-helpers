import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { RegexSecurityService } from './services/regex-security.service';
import { WebCryptoService } from './services/web-crypto.service';

export interface SecurityConfig {
  enableRegexSecurity?: boolean;
  enableWebCrypto?: boolean;
  defaultTimeout?: number;
  safeMode?: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  enableRegexSecurity: true,
  enableWebCrypto: true,
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

  return makeEnvironmentProviders(providers);
}

export function provideRegexSecurity(): EnvironmentProviders {
  return makeEnvironmentProviders([RegexSecurityService]);
}

export function provideWebCrypto(): EnvironmentProviders {
  return makeEnvironmentProviders([WebCryptoService]);
}
