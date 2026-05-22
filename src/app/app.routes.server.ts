import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'docs/browser-web-apis/:service',
    renderMode: RenderMode.Client,
  },
  {
    path: 'docs/security/:service',
    renderMode: RenderMode.Client,
  },
  {
    path: 'docs/worker-http/:entry',
    renderMode: RenderMode.Client,
  },
  {
    path: 'docs/storage/:service',
    renderMode: RenderMode.Client,
  },
  {
    path: 'docs/openlayers/:component',
    renderMode: RenderMode.Client,
  },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
