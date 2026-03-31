import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import {
  type PerformanceEntryType,
  type PerformanceObserverConfig,
  isPerformanceObserverSupported,
  performanceObserverStream,
} from '../utils/performance-observer.utils';

export type { PerformanceEntryType, PerformanceObserverConfig };

@Injectable()
export class PerformanceObserverService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && isPerformanceObserverSupported();
  }

  observe(config: PerformanceObserverConfig): Observable<PerformanceEntryList> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('PerformanceObserver API not supported')));
    }
    return performanceObserverStream(config);
  }

  observeByType(type: PerformanceEntryType, buffered = true): Observable<PerformanceEntryList> {
    return this.observe({ type, buffered });
  }

  getSupportedEntryTypes(): PerformanceEntryType[] {
    if (!this.isSupported()) return [];
    return (PerformanceObserver.supportedEntryTypes ?? []) as PerformanceEntryType[];
  }
}
