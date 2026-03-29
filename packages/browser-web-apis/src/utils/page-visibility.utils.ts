import { Observable, of } from 'rxjs';

import { type VisibilityState } from '../services/page-visibility.service';

export function isPageVisibilitySupported(): boolean {
  return typeof document !== 'undefined' && 'hidden' in document;
}

export function pageVisibilityStream(): Observable<VisibilityState> {
  if (!isPageVisibilitySupported()) {
    return of('visible' as VisibilityState);
  }

  return new Observable<VisibilityState>((observer) => {
    const handler = () => observer.next(document.visibilityState as VisibilityState);
    document.addEventListener('visibilitychange', handler);
    observer.next(document.visibilityState as VisibilityState);
    return () => document.removeEventListener('visibilitychange', handler);
  });
}
