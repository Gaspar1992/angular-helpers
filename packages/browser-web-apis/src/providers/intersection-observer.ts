import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { IntersectionObserverService } from '../services/intersection-observer.service';

export function provideIntersectionObserver(): EnvironmentProviders {
  return makeEnvironmentProviders([IntersectionObserverService]);
}
