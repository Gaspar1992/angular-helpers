import { Observable } from 'rxjs';

export type PerformanceEntryType =
  | 'element'
  | 'event'
  | 'first-input'
  | 'largest-contentful-paint'
  | 'layout-shift'
  | 'longtask'
  | 'mark'
  | 'measure'
  | 'navigation'
  | 'paint'
  | 'resource'
  | 'visibility-state';

export interface PerformanceObserverConfig {
  entryTypes?: PerformanceEntryType[];
  type?: PerformanceEntryType;
  buffered?: boolean;
  durationThreshold?: number;
}

export function isPerformanceObserverSupported(): boolean {
  return typeof PerformanceObserver !== 'undefined';
}

export function performanceObserverStream(
  config: PerformanceObserverConfig,
): Observable<PerformanceEntryList> {
  return new Observable<PerformanceEntryList>((subscriber) => {
    const observer = new PerformanceObserver((list) => {
      subscriber.next(list.getEntries());
    });

    try {
      if (config.type) {
        observer.observe({
          type: config.type,
          buffered: config.buffered ?? true,
          ...(config.durationThreshold !== undefined
            ? { durationThreshold: config.durationThreshold }
            : {}),
        } as PerformanceObserverInit);
      } else if (config.entryTypes) {
        observer.observe({ entryTypes: config.entryTypes });
      }
    } catch {
      // Ignore unsupported entry types in browsers (e.g., Firefox/Safari lacking layout-shift or event)
    }

    return () => observer.disconnect();
  });
}
