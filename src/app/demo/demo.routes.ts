import { Routes } from '@angular/router';
import { provideSecurity } from '@angular-helpers/security';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./demo-layout/demo-layout.component').then((m) => m.DemoLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./demo-home/demo-home.component').then((m) => m.DemoHomeComponent),
        title: 'Demos — Angular Helpers',
      },
      {
        path: 'browser-apis',
        loadComponent: () =>
          import('./browser-apis/browser-apis').then((m) => m.BrowserApisComponent),
        title: 'Browser APIs — Demo',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/security-demo.component').then((m) => m.SecurityDemoComponent),
        providers: [provideSecurity({ enableSecureStorage: true })],
        title: 'Security — Demo',
      },
      {
        path: 'worker-http',
        loadComponent: () =>
          import('./worker-http/worker-http-demo.component').then((m) => m.WorkerHttpDemoComponent),
        title: 'Worker HTTP — Demo',
      },
      {
        path: 'library-services',
        loadComponent: () =>
          import('./library-services-harness/library-services-harness').then(
            (m) => m.LibraryServicesHarnessComponent,
          ),
        title: 'Library Services — Demo',
      },
    ],
  },
];
