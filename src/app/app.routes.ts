import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    title: 'Angular Helpers',
  },
  {
    path: 'demo/library-services',
    loadComponent: () =>
      import('./demo/library-services-harness/library-services-harness').then(
        (m) => m.LibraryServicesHarnessComponent,
      ),
  },
  {
    path: 'demo/worker-http',
    loadComponent: () =>
      import('./demo/worker-http/worker-http-demo.component').then(
        (m) => m.WorkerHttpDemoComponent,
      ),
    title: 'Worker HTTP — POC',
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./demo/browser-apis/browser-apis').then((m) => m.BrowserApisComponent),
  },
  {
    path: 'docs',
    loadChildren: () => import('./docs/docs.routes').then((m) => m.DOCS_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
