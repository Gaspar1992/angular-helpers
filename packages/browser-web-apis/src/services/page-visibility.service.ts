import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { map, Observable } from 'rxjs';

import { pageVisibilityStream } from '../utils/page-visibility.utils';

export type VisibilityState = 'visible' | 'hidden' | 'prerender';

@Injectable({ providedIn: 'root' })
export class PageVisibilityService {
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
    return pageVisibilityStream();
  }

  watchVisibility(): Observable<boolean> {
    return pageVisibilityStream().pipe(map((s) => s === 'visible'));
  }
}
