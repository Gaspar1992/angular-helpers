import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

import {
  type PerformanceEntryType,
  type PerformanceObserverConfig,
  performanceObserverStream,
} from '../utils/performance-observer.utils';

export type { PerformanceEntryType, PerformanceObserverConfig };

@Injectable()
export class PerformanceObserverService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'performance-observer';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'performanceObserver';
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
