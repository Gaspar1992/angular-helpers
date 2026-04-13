import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PerformanceObserverService } from '../services/performance-observer.service';

export function providePerformanceObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([PerformanceObserverService]);
}
