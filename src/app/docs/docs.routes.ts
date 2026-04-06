import { Routes } from '@angular/router';

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
          import('./pages/browser-web-apis-overview/browser-web-apis-overview.component').then(
            (m) => m.BrowserWebApisOverviewComponent,
          ),
        title: 'browser-web-apis — Angular Helpers',
      },
      {
        path: 'browser-web-apis/:service',
        loadComponent: () =>
          import('./pages/service-detail/service-detail.component').then(
            (m) => m.ServiceDetailComponent,
          ),
        title: 'Service — Angular Helpers',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./pages/security-overview/security-overview.component').then(
            (m) => m.SecurityOverviewComponent,
          ),
        title: 'security — Angular Helpers',
      },
      {
        path: 'security/:service',
        loadComponent: () =>
          import('./pages/security-service-detail/security-service-detail.component').then(
            (m) => m.SecurityServiceDetailComponent,
          ),
        title: 'Service — Angular Helpers',
      },
      {
        path: 'worker-http',
        loadComponent: () =>
          import('./pages/worker-http-overview/worker-http-overview.component').then(
            (m) => m.WorkerHttpOverviewComponent,
          ),
        title: 'worker-http — Angular Helpers',
      },
      {
        path: 'worker-http/:entry',
        loadComponent: () =>
          import('./pages/worker-http-entry-detail/worker-http-entry-detail.component').then(
            (m) => m.WorkerHttpEntryDetailComponent,
          ),
        title: 'Entry Point — Angular Helpers',
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
