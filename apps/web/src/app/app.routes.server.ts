import { RenderMode, type ServerRoute } from '@angular/ssr';
import { DOCS_NAV_LIBRARIES } from './docs/config/docs-nav.data';

function getDocSlugs(libId: string): string[] {
  const lib = DOCS_NAV_LIBRARIES.find((l) => l.id === libId);
  if (!lib) return [];
  const prefix = `${lib.overviewRoute}/`;
  return lib.sections.flatMap((section) =>
    section.items
      .filter((item) => item.route.startsWith(prefix))
      .map((item) => item.route.slice(prefix.length)),
  );
}

export const serverRoutes: ServerRoute[] = [
  {
    path: 'docs/core/:entry',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('core').map((entry) => ({ entry }));
    },
  },
  {
    path: 'docs/browser-web-apis/:service',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('browser-web-apis').map((service) => ({ service }));
    },
  },
  {
    path: 'docs/security/:service',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('security').map((service) => ({ service }));
    },
  },
  {
    path: 'docs/worker-http/:entry',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('worker-http').map((entry) => ({ entry }));
    },
  },
  {
    path: 'docs/storage/:service',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('storage').map((service) => ({ service }));
    },
  },
  {
    path: 'docs/openlayers/:component',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('openlayers').map((component) => ({ component }));
    },
  },
  {
    path: 'docs/yjs/:service',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('yjs').map((service) => ({ service }));
    },
  },
  {
    path: 'docs/testing/:service',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      return getDocSlugs('testing').map((service) => ({ service }));
    },
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
