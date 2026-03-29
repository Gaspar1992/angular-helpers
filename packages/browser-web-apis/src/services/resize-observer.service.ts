import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import { resizeObserverEntriesStream, resizeObserverStream } from '../utils/resize-observer.utils';

export interface ResizeObserverOptions {
  box?: ResizeObserverBoxOptions;
}

export interface ElementSize {
  width: number;
  height: number;
  inlineSize: number;
  blockSize: number;
}

@Injectable()
export class ResizeObserverService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'ResizeObserver' in window;
  }

  observe(
    element: Element,
    options: ResizeObserverOptions = {},
  ): Observable<ResizeObserverEntry[]> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('ResizeObserver API not supported')));
    }
    return resizeObserverEntriesStream(element, options);
  }

  observeSize(element: Element, options: ResizeObserverOptions = {}): Observable<ElementSize> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('ResizeObserver API not supported')));
    }
    return resizeObserverStream(element, options);
  }
}
