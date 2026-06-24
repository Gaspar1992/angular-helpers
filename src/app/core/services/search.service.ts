import { Injectable, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { injectWorkerPool, injectPlatform } from '@angular-helpers/core';
import { PACKAGES } from '../config/packages.data';
import { BLOG_POSTS } from '../../blog/config/posts.data';
import { PUBLIC_DEMO_SECTIONS } from '../../demo/config/demo.config';

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

  private readonly index: SearchResult[] = [
    // Packages / Docs
    ...PACKAGES.map((p) => ({
      type: 'docs' as const,
      title: p.name,
      description: p.tagline,
      url: p.docsLink,
      icon: p.icon,
      tags: p.highlights,
    })),
    // Blog Posts
    ...BLOG_POSTS.map((post) => ({
      type: 'blog' as const,
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      icon: '📄',
      tags: post.tags,
    })),
    // Demos
    ...PUBLIC_DEMO_SECTIONS.map((demo) => ({
      type: 'demo' as const,
      title: demo.title,
      description: demo.description,
      url: demo.path,
      icon: demo.icon,
      tags: [demo.packageName],
    })),
  ];

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
        return from(this.pool.execute<SearchResult[]>('search', { q })).pipe(
          catchError((error) => {
            console.error('Search worker error:', error);
            return of([]);
          }),
        );
      }),
    ),
    { initialValue: [] },
  );

  open(): void {
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
