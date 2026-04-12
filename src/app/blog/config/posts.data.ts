import type { BlogPost } from '../models/blog-post.model';

export const BLOG_POSTS: readonly BlogPost[] = [
  {
    slug: 'web-redesign-and-library-vision',
    title: 'Redesigning the web & our vision as a library ecosystem',
    publishedAt: '2026-04-12',
    tags: ['meta', 'design', 'architecture', 'angular'],
    excerpt:
      'Why we rebuilt the Angular Helpers website from scratch, the decisions behind the new design system (Tailwind v4 + DaisyUI v5), and the principles that guide every package we ship.',
  },
];
