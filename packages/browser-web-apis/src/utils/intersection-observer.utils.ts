import { Observable } from 'rxjs';

import { type IntersectionObserverOptions } from '../services/intersection-observer.service';

export function isIntersectionObserverSupported(): boolean {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window;
}

export function intersectionObserverStream(
  element: Element,
  options: IntersectionObserverOptions = {},
): Observable<boolean> {
  return new Observable<boolean>((observer) => {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      observer.next(entry.isIntersecting);
    }, options);

    io.observe(element);

    return () => {
      io.unobserve(element);
      io.disconnect();
    };
  });
}

export function intersectionObserverEntriesStream(
  element: Element,
  options: IntersectionObserverOptions = {},
): Observable<IntersectionObserverEntry[]> {
  return new Observable<IntersectionObserverEntry[]>((observer) => {
    const io = new IntersectionObserver((entries) => observer.next(entries), options);
    io.observe(element);
    return () => {
      io.unobserve(element);
      io.disconnect();
    };
  });
}
