import { Routes } from '@angular/router';

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
    title: 'Article — Angular Helpers',
  },
];
