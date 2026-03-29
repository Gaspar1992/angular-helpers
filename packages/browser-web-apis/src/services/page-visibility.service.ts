import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

export type VisibilityState = 'visible' | 'hidden' | 'prerender';

@Injectable()
export class PageVisibilityService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'hidden' in document;
  }

  get isHidden(): boolean {
    if (!this.isSupported()) return false;
    return document.hidden;
  }

  get visibilityState(): VisibilityState {
    if (!this.isSupported()) return 'visible';
    return document.visibilityState as VisibilityState;
  }

  watch(): Observable<VisibilityState> {
    return new Observable<VisibilityState>((observer) => {
      if (!this.isSupported()) {
        observer.next('visible');
        observer.complete();
        return undefined;
      }

      const handler = () => observer.next(document.visibilityState as VisibilityState);
      document.addEventListener('visibilitychange', handler);
      observer.next(document.visibilityState as VisibilityState);

      const cleanup = () => document.removeEventListener('visibilitychange', handler);
      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }

  watchVisibility(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      if (!this.isSupported()) {
        observer.next(false);
        observer.complete();
        return undefined;
      }

      const handler = () => observer.next(!document.hidden);
      document.addEventListener('visibilitychange', handler);
      observer.next(!document.hidden);

      const cleanup = () => document.removeEventListener('visibilitychange', handler);
      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }
}
