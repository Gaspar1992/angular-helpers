import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

export type AngularVersion = 'v21' | 'v22';

@Injectable({ providedIn: 'root' })
export class DocsVersionService {
  private readonly router = inject(Router);

  readonly activeVersionSignal = signal<AngularVersion>('v22');
  readonly version = this.activeVersionSignal.asReadonly();

  constructor() {
    this.initializeFromUrl();
  }

  private initializeFromUrl() {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const v = searchParams.get('v');
      if (v === '21') {
        this.activeVersionSignal.set('v21');
      } else {
        this.activeVersionSignal.set('v22');
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
