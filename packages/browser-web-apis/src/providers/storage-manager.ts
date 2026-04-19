import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { StorageManagerService } from '../services/storage-manager.service';

export function provideStorageManager(): EnvironmentProviders {
  return makeEnvironmentProviders([StorageManagerService]);
}
