import { Routes } from '@angular/router';
import { serviceDetailResolver } from './resolvers/service-detail.resolver';
import { overviewResolver } from './resolvers/overview.resolver';

export const DOCS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/docs-layout.component').then((m) => m.DocsLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/docs-landing/docs-landing.component').then((m) => m.DocsLandingComponent),
        title: 'Documentation — Angular Helpers',
      },
      {
        path: 'browser-web-apis',
        loadComponent: () =>
          import('../features/docs/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        title: 'browser-web-apis — Angular Helpers',
      },
      {
        path: 'browser-web-apis/:service',
        loadComponent: () =>
          import('../features/docs/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        title: 'Service — Angular Helpers',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('../features/docs/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        title: 'security — Angular Helpers',
      },
      {
        path: 'security/:service',
        loadComponent: () =>
          import('../features/docs/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        title: 'Service — Angular Helpers',
      },
      {
        path: 'worker-http',
        loadComponent: () =>
          import('../features/docs/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        title: 'worker-http — Angular Helpers',
      },
      {
        path: 'worker-http/:entry',
        loadComponent: () =>
          import('../features/docs/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        title: 'Entry Point — Angular Helpers',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
