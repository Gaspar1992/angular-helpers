import { Injectable, signal, computed } from '@angular/core';
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

  readonly results = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return [];

    return this.index
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(q))
        );
      })
      .slice(0, 8); // Limit to top 8 results
  });

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
