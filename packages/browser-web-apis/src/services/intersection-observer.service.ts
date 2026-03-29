import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

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
export class IntersectionObserverService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'IntersectionObserver' in window;
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
