import { Observable } from 'rxjs';

import { type ElementSize, type ResizeObserverOptions } from '../services/resize-observer.service';

export function isResizeObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'ResizeObserver' in window;
}

export function resizeObserverStream(
  element: Element,
  options: ResizeObserverOptions = {},
): Observable<ElementSize> {
  return new Observable<ElementSize>((observer) => {
    const ro = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1];
      const contentRect = entry.contentRect;
      const borderBoxSize = entry.borderBoxSize?.[0];

      observer.next({
        width: contentRect.width,
        height: contentRect.height,
        inlineSize: borderBoxSize?.inlineSize ?? contentRect.width,
        blockSize: borderBoxSize?.blockSize ?? contentRect.height,
      });
    });

    ro.observe(element, options);

    return () => {
      ro.unobserve(element);
      ro.disconnect();
    };
  });
}

export function resizeObserverEntriesStream(
  element: Element,
  options: ResizeObserverOptions = {},
): Observable<ResizeObserverEntry[]> {
  return new Observable<ResizeObserverEntry[]>((observer) => {
    const ro = new ResizeObserver((entries) => observer.next(entries));
    ro.observe(element, options);
    return () => {
      ro.unobserve(element);
      ro.disconnect();
    };
  });
}
