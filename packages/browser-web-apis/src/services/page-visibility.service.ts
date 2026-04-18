import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

import { pageVisibilityStream } from '../utils/page-visibility.utils';

export type VisibilityState = 'visible' | 'hidden' | 'prerender';

@Injectable()
export class PageVisibilityService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'page-visibility';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'pageVisibility';
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
