/// <reference lib="webworker" />
import { PACKAGES } from '../app/core/config/packages.data';
import { BLOG_POSTS } from '../app/blog/config/posts.data';
import { PUBLIC_DEMO_SECTIONS } from '../app/demo/config/demo.config';

export interface SearchResult {
  type: 'docs' | 'blog' | 'demo';
  title: string;
  description: string;
  url: string;
  icon: string;
  tags?: string[];
}

const index: SearchResult[] = [
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

self.addEventListener('message', (event: MessageEvent) => {
  const task = event.data;

  if (task && task.type === 'search') {
    const { q } = task.data || {};
    const query = (q || '').toLowerCase().trim();

    if (!query) {
      self.postMessage({
        id: task.id,
        type: 'search-result',
        data: [],
      });
      return;
    }

    const filtered = index
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .slice(0, 8);

    self.postMessage({
      id: task.id,
      type: 'search-result',
      data: filtered,
    });
  }
});
