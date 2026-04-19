import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { WebLocksService } from '../services/web-locks.service';

export function provideWebLocks(): EnvironmentProviders {
  return makeEnvironmentProviders([WebLocksService]);
}
