import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

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
export class ResizeObserverService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'resize-observer';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'ResizeObserver' in window;
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
