import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AngularVersion } from '../models/angular-version.model';

export { AngularVersion };

@Injectable({ providedIn: 'root' })
export class DocsVersionService {
  private readonly router = inject(Router);

  private readonly activeVersionSignal = signal<AngularVersion>(AngularVersion.v22);
  readonly version = computed(() => this.activeVersionSignal());

  constructor() {
    this.initializeFromUrl();
  }

  private initializeFromUrl() {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const v = searchParams.get('v');
      if (v === '21') {
        this.activeVersionSignal.set(AngularVersion.v21);
      } else {
        this.activeVersionSignal.set(AngularVersion.v22);
      }
    }
  }

  setVersion(version: AngularVersion) {
    this.activeVersionSignal.set(version);
    const queryVal = version === AngularVersion.v21 ? '21' : '22';
    this.router.navigate([], {
      queryParams: { v: queryVal },
      queryParamsHandling: 'merge',
    });
  }
}
