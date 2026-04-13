import type { BlogPost } from '../models/blog-post.model';

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: 'browser-web-apis-robustness-improvements',
    title:
      'browser-web-apis: robustness deep-dive — spec compliance, leak prevention, and unified architecture',
    publishedAt: '2026-04-13',
    tags: ['browser-web-apis', 'bugfix', 'mdn', 'architecture', 'angular'],
    excerpt:
      'A deep look at what breaks silently in a Browser API wrapper library — from permission pre-checks that block native prompts to WebSocket connections that outlive their host component — and how we fixed it.',
  },
  {
    slug: 'browser-web-apis-v21-5-improvements',
    title: 'browser-web-apis v21.5: real tree-shaking, bug fixes, and signal consistency',
    publishedAt: '2026-04-13',
    tags: ['browser-web-apis', 'tree-shaking', 'angular', 'architecture', 'signals'],
    excerpt:
      'We fixed a double permission check bug, made filter signals truly readonly, unified logging across all services, and restructured providers so each provideX() only pulls in what it needs.',
  },
  {
    slug: 'worker-http-backend-phase3',
    title: 'worker-http v0.3.0: Angular HttpBackend integration — HTTP off the main thread',
    publishedAt: '2026-04-13',
    tags: ['worker-http', 'performance', 'angular', 'web-workers', 'architecture'],
    excerpt:
      "How we replaced Angular's HttpBackend to route HTTP requests through Web Workers — zero API change for the developer, zero cost for the main thread.",
  },
  {
    slug: 'web-redesign-and-library-vision',
    title: 'Redesigning the web & our vision as a library ecosystem',
    publishedAt: '2026-04-12',
    tags: ['meta', 'design', 'architecture', 'angular'],
    excerpt:
      'Why we rebuilt the Angular Helpers website from scratch, the decisions behind the new design system (Tailwind v4 + DaisyUI v5), and the principles that guide every package we ship.',
  },
];
