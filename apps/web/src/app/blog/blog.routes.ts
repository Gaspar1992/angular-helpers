import type { Routes } from '@angular/router';
import { blogPostResolver, blogPostResource } from './services/blog-post.resolver';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./blog.component').then((m) => m.BlogComponent),
    title: 'Blog — Angular Helpers',
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./feature/blog-post/blog-post.component').then((m) => m.BlogPostComponent),
    resolve: { post: blogPostResolver },
    resources: (ctx) => ({ post: blogPostResource(ctx) }),
    title: 'Article — Angular Helpers',
  },
];
