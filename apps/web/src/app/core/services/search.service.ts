import { Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, from } from 'rxjs';
import { switchMap, catchError, tap, finalize } from 'rxjs/operators';
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
      const [{ BLOG_POSTS }, { PUBLIC_DEMO_SECTIONS }] = await Promise.all([
        import('../../blog/config/posts.data'),
        import('../../demo/config/demo.config'),
      ]);
      this.index.push(
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
        const { q } = data;
        const query = (q || '').toLowerCase().trim();
        if (!query) return [];

        void this.loadExtraIndex();
        return this.index
          .filter((item) => {
            return (
              item.title.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query) ||
              item.tags?.some((tag) => tag.toLowerCase().includes(query))
            );
          })
          .slice(0, 8);
      },
    });
  })();

  readonly results = toSignal(
    toObservable(this.query).pipe(
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
