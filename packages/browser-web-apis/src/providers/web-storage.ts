import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebStorageService } from '../services/web-storage.service';

export function provideWebStorage(): EnvironmentProviders {
  return makeEnvironmentProviders([WebStorageService]);
}
