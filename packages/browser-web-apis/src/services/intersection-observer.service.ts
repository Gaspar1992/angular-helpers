import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

import {
  intersectionObserverEntriesStream,
  intersectionObserverStream,
} from '../utils/intersection-observer.utils';

export interface IntersectionObserverOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
}

@Injectable()
export class IntersectionObserverService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'intersection-observer';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'intersectionObserver';
  }

  observe(
    element: Element,
    options: IntersectionObserverOptions = {},
  ): Observable<IntersectionObserverEntry[]> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('IntersectionObserver API not supported')));
    }
    return intersectionObserverEntriesStream(element, options);
  }

  observeVisibility(
    element: Element,
    options: IntersectionObserverOptions = {},
  ): Observable<boolean> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('IntersectionObserver API not supported')));
    }
    return intersectionObserverStream(element, options);
  }
}
