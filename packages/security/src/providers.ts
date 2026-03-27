import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { RegexSecurityService } from './services/regex-security.service';

export interface SecurityConfig {
  enableRegexSecurity?: boolean;
  defaultTimeout?: number;
  safeMode?: boolean;
}

export const defaultSecurityConfig: SecurityConfig = {
  enableRegexSecurity: true,
  defaultTimeout: 5000,
  safeMode: false,
};

export function provideSecurity(config: SecurityConfig = {}): EnvironmentProviders {
  const mergedConfig = { ...defaultSecurityConfig, ...config };
  const providers = [];

  if (mergedConfig.enableRegexSecurity) {
    providers.push(RegexSecurityService);
  }

  return makeEnvironmentProviders(providers);
}

export function provideRegexSecurity(): EnvironmentProviders {
  return makeEnvironmentProviders([RegexSecurityService]);
}
