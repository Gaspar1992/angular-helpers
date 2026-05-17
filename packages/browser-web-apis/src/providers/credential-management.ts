import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { CredentialManagementService } from '../services/credential-management.service';

export function provideCredentialManagement(): EnvironmentProviders {
  return makeEnvironmentProviders([CredentialManagementService]);
}
