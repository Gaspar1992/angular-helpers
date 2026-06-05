import { Routes } from '@angular/router';
import { serviceDetailResolver } from './services/service-detail.resolver';
import { overviewResolver } from './services/overview.resolver';
import { DOCS_NAV_LIBRARIES, DOCS_NAV_SECTIONS } from './config/docs-nav.data';

export const DOCS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/docs-layout.component').then((m) => m.DocsLayoutComponent),
    data: { navSections: DOCS_NAV_SECTIONS, navLibraries: DOCS_NAV_LIBRARIES },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/docs-landing/docs-landing.component').then((m) => m.DocsLandingComponent),
        title: 'Documentation — Angular Helpers',
      },
      {
        path: 'core',
        loadComponent: () =>
          import('./feature/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'core — Angular Helpers',
      },
      {
        path: 'core/:entry',
        loadComponent: () =>
          import('./feature/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'Utility — Angular Helpers',
      },
      {
        path: 'browser-web-apis',
        loadComponent: () =>
          import('./feature/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'browser-web-apis — Angular Helpers',
      },
      {
        path: 'browser-web-apis/:service',
        loadComponent: () =>
          import('./feature/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'Service — Angular Helpers',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./feature/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'security — Angular Helpers',
      },
      {
        path: 'security/:service',
        loadComponent: () =>
          import('./feature/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'Service — Angular Helpers',
      },
      {
        path: 'worker-http',
        loadComponent: () =>
          import('./feature/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'worker-http — Angular Helpers',
      },
      {
        path: 'worker-http/:entry',
        loadComponent: () =>
          import('./feature/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'Entry Point — Angular Helpers',
      },
      {
        path: 'storage',
        loadComponent: () =>
          import('./feature/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'storage — Angular Helpers',
      },
      {
        path: 'storage/:service',
        loadComponent: () =>
          import('./feature/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'Service — Angular Helpers',
      },
      {
        path: 'openlayers',
        loadComponent: () =>
          import('./feature/unified-overview/unified-overview.component').then(
            (m) => m.UnifiedOverviewComponent,
          ),
        resolve: { config: overviewResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'openlayers — Angular Helpers',
      },
      {
        path: 'openlayers/:component',
        loadComponent: () =>
          import('./feature/unified-service-detail/unified-service-detail.component').then(
            (m) => m.UnifiedServiceDetailComponent,
          ),
        resolve: { config: serviceDetailResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        title: 'Component — Angular Helpers',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
