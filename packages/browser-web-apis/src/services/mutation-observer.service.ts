import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

import {
  type MutationObserverOptions,
  isMutationObserverSupported,
  mutationObserverStream,
} from '../utils/mutation-observer.utils';

export type { MutationObserverOptions };

@Injectable()
export class MutationObserverService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && isMutationObserverSupported();
  }

  observe(target: Node, options?: MutationObserverOptions): Observable<MutationRecord[]> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('MutationObserver API not supported')));
    }
    return mutationObserverStream(target, options);
  }
}
