import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { MutationObserverService } from '../services/mutation-observer.service';

export function provideMutationObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([MutationObserverService]);
}
