import { Injectable, signal, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { AngularVersion } from '../models/angular-version.model';

export { AngularVersion };

@Injectable({ providedIn: 'root' })
export class DocsVersionService {
  private readonly router = inject(Router);

  private readonly activeVersionSignal = signal<AngularVersion>(AngularVersion.v22);
  readonly version = computed(() => this.activeVersionSignal());

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events
      ?.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        this.syncFromUrl(event.urlAfterRedirects);
      });
  }

  private syncFromUrl(url: string | undefined): void {
    if (!url) return;
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) return;
    const v = new URLSearchParams(url.slice(queryIndex)).get('v');
    if (v === '21') {
      this.activeVersionSignal.set(AngularVersion.v21);
    } else if (v === '22') {
      this.activeVersionSignal.set(AngularVersion.v22);
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
