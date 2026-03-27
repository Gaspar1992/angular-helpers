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
          import('./pages/docs-landing/docs-landing.component').then(
            (m) => m.DocsLandingComponent,
          ),
        title: 'Documentation — Angular Helpers',
      },
      {
        path: 'browser-web-apis',
        loadComponent: () =>
          import(
            './pages/browser-web-apis-overview/browser-web-apis-overview.component'
          ).then((m) => m.BrowserWebApisOverviewComponent),
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
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
