import { Injectable, inject, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { injectStorageSignal } from '@angular-helpers/storage';
import { DOCS_NAV_LIBRARIES } from '../config/docs-nav.data';

export interface HistoryItem {
  route: string;
  label: string;
}

export function getLabelForRoute(route: string): string {
  for (const lib of DOCS_NAV_LIBRARIES) {
    if (lib.overviewRoute === route) {
      return lib.label;
    }
    for (const section of lib.sections) {
      for (const item of section.items) {
        if (item.route === route) {
          return item.label;
        }
      }
    }
  }

  const segments = route.split('/');
  const lastSegment = segments[segments.length - 1] || '';
  return lastSegment
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

@Injectable({ providedIn: 'root' })
export class DocsHistoryService {
  private readonly router = inject(Router);

  readonly bookmarks = injectStorageSignal<string[]>('docs_bookmarks', [], {
    storageType: 'local',
    serializer: 'json',
    crossTabSync: true,
  });

  readonly history = injectStorageSignal<string[]>('docs_reading_history', [], {
    storageType: 'local',
    serializer: 'json',
    crossTabSync: true,
  });

  readonly bookmarkedItems = computed<HistoryItem[]>(() =>
    this.bookmarks().map((route) => ({
      route,
      label: getLabelForRoute(route),
    })),
  );

  readonly historyItems = computed<HistoryItem[]>(() =>
    this.history().map((route) => ({
      route,
      label: getLabelForRoute(route),
    })),
  );

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        if (url.startsWith('/docs')) {
          const cleanPath = url.split(/[?#]/)[0];
          this.addToHistory(cleanPath);
        }
      });
  }

  toggleBookmark(path: string): void {
    const cleanPath = path.split(/[?#]/)[0];
    this.bookmarks.update((current) => {
      if (current.includes(cleanPath)) {
        return current.filter((p) => p !== cleanPath);
      } else {
        return [...current, cleanPath];
      }
    });
  }

  isBookmarked(path: string): boolean {
    const cleanPath = path.split(/[?#]/)[0];
    return this.bookmarks().includes(cleanPath);
  }

  addToHistory(path: string): void {
    const cleanPath = path.split(/[?#]/)[0];
    this.history.update((current) => {
      const filtered = current.filter((p) => p !== cleanPath);
      const updated = [cleanPath, ...filtered];
      return updated.slice(0, 10);
    });
  }
}
