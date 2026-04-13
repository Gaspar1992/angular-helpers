import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { ResizeObserverService } from '../services/resize-observer.service';

export function provideResizeObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([ResizeObserverService]);
}
