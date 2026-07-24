import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

import {
  type MutationObserverOptions,
  mutationObserverStream,
} from '../utils/mutation-observer.utils';

export type { MutationObserverOptions };

@Injectable()
export class MutationObserverService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'mutation-observer';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'mutationObserver';
  }

  observe(target: Node, options?: MutationObserverOptions): Observable<MutationRecord[]> {
    if (!this.isSupported()) {
      return new Observable((o) => o.error(new Error('MutationObserver API not supported')));
    }
    return mutationObserverStream(target, options);
  }
}
