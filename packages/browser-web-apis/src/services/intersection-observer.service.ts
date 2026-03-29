import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export interface IntersectionObserverOptions {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
}

@Injectable()
export class IntersectionObserverService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'IntersectionObserver' in window;
  }

  observe(
    element: Element,
    options: IntersectionObserverOptions = {},
  ): Observable<IntersectionObserverEntry[]> {
    return new Observable<IntersectionObserverEntry[]>((observer) => {
      if (!this.isSupported()) {
        observer.error(new Error('IntersectionObserver API not supported'));
        return undefined;
      }

      const io = new IntersectionObserver((entries) => {
        observer.next(entries);
      }, options);

      io.observe(element);

      const cleanup = () => io.disconnect();
      this.destroyRef.onDestroy(cleanup);

      return () => {
        io.unobserve(element);
        io.disconnect();
      };
    });
  }

  observeVisibility(
    element: Element,
    options: IntersectionObserverOptions = {},
  ): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      if (!this.isSupported()) {
        observer.error(new Error('IntersectionObserver API not supported'));
        return undefined;
      }

      const io = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1];
        observer.next(entry.isIntersecting);
      }, options);

      io.observe(element);

      const cleanup = () => io.disconnect();
      this.destroyRef.onDestroy(cleanup);

      return () => {
        io.unobserve(element);
        io.disconnect();
      };
    });
  }
}
