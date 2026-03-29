import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'ResizeObserver' in window;
  }

  observe(
    element: Element,
    options: ResizeObserverOptions = {},
  ): Observable<ResizeObserverEntry[]> {
    return new Observable<ResizeObserverEntry[]>((observer) => {
      if (!this.isSupported()) {
        observer.error(new Error('ResizeObserver API not supported'));
        return undefined;
      }

      const ro = new ResizeObserver((entries) => {
        observer.next(entries);
      });

      ro.observe(element, options);

      const cleanup = () => ro.disconnect();
      this.destroyRef.onDestroy(cleanup);

      return () => {
        ro.unobserve(element);
        ro.disconnect();
      };
    });
  }

  observeSize(element: Element, options: ResizeObserverOptions = {}): Observable<ElementSize> {
    return new Observable<ElementSize>((observer) => {
      if (!this.isSupported()) {
        observer.error(new Error('ResizeObserver API not supported'));
        return undefined;
      }

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

      const cleanup = () => ro.disconnect();
      this.destroyRef.onDestroy(cleanup);

      return () => {
        ro.unobserve(element);
        ro.disconnect();
      };
    });
  }
}
