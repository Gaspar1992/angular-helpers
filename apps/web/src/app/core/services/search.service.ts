import { Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, from } from 'rxjs';
import {
  switchMap,
  catchError,
  tap,
  finalize,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { injectWorkerPool, injectPlatform } from '@angular-helpers/core';
import { PACKAGES } from '../config/packages.data';

export interface SearchResult {
  type: 'docs' | 'blog' | 'demo';
  title: string;
  description: string;
  url: string;
  icon: string;
  tags?: string[];
}

const packageUrls = new Set(PACKAGES.map((p) => p.docsLink));
const packageIcons = new Map(PACKAGES.map((p) => [p.name, p.icon]));

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly searching = signal(false);

  private readonly index: SearchResult[] = [
    // Packages / Docs available synchronously
    ...PACKAGES.map((p) => ({
      type: 'docs' as const,
      title: p.name,
      description: p.tagline,
      url: p.docsLink,
      icon: p.icon,
      tags: p.highlights,
    })),
  ];

  private loadedExtra = false;

  private async loadExtraIndex(): Promise<void> {
    if (this.loadedExtra) return;
    this.loadedExtra = true;
    try {
      const [{ DOCS_NAV_LIBRARIES }, { BLOG_POSTS }, { PUBLIC_DEMO_SECTIONS }] = await Promise.all([
        import('../../docs/config/docs-nav.data'),
        import('../../blog/config/posts.data'),
        import('../../demo/config/demo.config'),
      ]);
      this.index.push(
        ...DOCS_NAV_LIBRARIES.flatMap((lib) =>
          lib.sections.flatMap((section) =>
            section.items
              .filter((item) => !packageUrls.has(item.route))
              .map((item) => ({
                type: 'docs' as const,
                title: item.label,
                description: `${lib.label} — ${section.title}`,
                url: item.route,
                icon: packageIcons.get(lib.id) ?? '📘',
                tags: [
                  lib.id,
                  lib.label,
                  section.title,
                  ...(item.hasFn ? ['inject', 'function'] : []),
                  ...(item.experimental ? ['experimental'] : []),
                ],
              })),
          ),
        ),
        ...BLOG_POSTS.map((post) => ({
          type: 'blog' as const,
          title: post.title,
          description: post.excerpt,
          url: `/blog/${post.slug}`,
          icon: '📄',
          tags: post.tags,
        })),
        ...PUBLIC_DEMO_SECTIONS.map((demo) => ({
          type: 'demo' as const,
          title: demo.title,
          description: demo.description,
          url: demo.path,
          icon: demo.icon,
          tags: [demo.packageName],
        })),
      );
    } catch {
      // Ignore background load error
    }
  }

  private readonly pool = (() => {
    const { document } = injectPlatform();
    const workerUrl = document
      ? new URL('assets/workers/search.worker.js', document.baseURI)
      : new URL('assets/workers/search.worker.js', 'https://example.com');

    return injectWorkerPool(workerUrl, {
      defaultTimeout: 5000,
      fallbackExecutor: async (type, data) => {
        if (type !== 'search') {
          throw new Error(`Unknown task type: ${type}`);
        }
        const { q } = (data ?? {}) as { q?: string };
        const query = (q || '').toLowerCase().trim();
        if (!query) return [];

        void this.loadExtraIndex();
        return this.index
          .map((item) => {
            const title = item.title.toLowerCase();
            const desc = item.description.toLowerCase();
            const tags = (item.tags ?? []).map((t) => t.toLowerCase());
            let score = 0;

            if (title === query) score += 100;
            else if (title.startsWith(query)) score += 60;
            else if (title.includes(query)) score += 40;

            if (tags.some((t) => t === query)) score += 30;
            else if (tags.some((t) => t.includes(query))) score += 20;

            if (desc.includes(query)) score += 10;

            if (score > 0 && item.type === 'docs') score += 5;

            return { item, score };
          })
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((entry) => entry.item)
          .slice(0, 10);
      },
    });
  })();

  readonly results = toSignal(
    toObservable(this.query).pipe(
      debounceTime(150),
      distinctUntilChanged(),
      switchMap((q) => {
        const query = q.toLowerCase().trim();
        if (!query) {
          return of([]);
        }
        this.searching.set(true);
        return from(this.pool.execute<SearchResult[]>('search', { q })).pipe(
          tap(() => this.searching.set(false)),
          catchError((error) => {
            console.error('Search worker error:', error);
            return of([]);
          }),
          finalize(() => this.searching.set(false)),
        );
      }),
    ),
    { initialValue: [] },
  );

  open(): void {
    void this.loadExtraIndex();
    this.isOpen.set(true);
    this.query.set('');
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }
}
