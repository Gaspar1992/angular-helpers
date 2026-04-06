import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

import {
  type MutationObserverOptions,
  isMutationObserverSupported,
  mutationObserverStream,
} from '../utils/mutation-observer.utils';

export type { MutationObserverOptions };

@Injectable()
export class MutationObserverService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'mutation-observer';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && isMutationObserverSupported();
  }

  observe(target: Node, options?: MutationObserverOptions): Observable<MutationRecord[]> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('MutationObserver API not supported')));
    }
    return mutationObserverStream(target, options);
  }
}
