import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export type AngularVersion = 'v21' | 'v22';

@Injectable({ providedIn: 'root' })
export class DocsVersionService {
  private readonly router = inject(Router);

  private readonly activeVersionSignal = signal<AngularVersion>('v21');
  readonly version = computed(() => this.activeVersionSignal());

  constructor() {
    this.initializeFromUrl();
  }

  private initializeFromUrl() {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const v = searchParams.get('v');
      if (v === '22') {
        this.activeVersionSignal.set('v22');
      } else {
        this.activeVersionSignal.set('v21');
      }
    }
  }

  setVersion(version: AngularVersion) {
    this.activeVersionSignal.set(version);
    const queryVal = version === 'v21' ? '21' : '22';
    this.router.navigate([], {
      queryParams: { v: queryVal },
      queryParamsHandling: 'merge',
    });
  }
}
