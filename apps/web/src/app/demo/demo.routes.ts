import type { Routes } from '@angular/router';

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
        loadChildren: () =>
          import('./browser-apis/browser-apis.routes').then((m) => m.BROWSER_APIS_ROUTES),
        title: 'Browser APIs — Demo',
      },
      {
        path: 'security',
        loadChildren: () =>
          import('./security/security.routes').then((m) => m.SECURITY_DEMO_ROUTES),
        title: 'Security — Demo',
      },
      {
        path: 'security-utilities',
        loadChildren: () =>
          import('./security/security.routes').then((m) => m.SECURITY_UTILITIES_ROUTES),
        title: 'Security Utilities — Demo',
      },
      {
        path: 'security-signal-forms',
        loadChildren: () =>
          import('./security/security.routes').then((m) => m.SECURITY_SIGNAL_FORMS_ROUTES),
        title: 'Security Signal Forms — Demo',
      },
      {
        path: 'worker-http',
        loadComponent: () =>
          import('./worker-http/worker-http-demo.component').then((m) => m.WorkerHttpDemoComponent),
        title: 'Worker HTTP — Demo',
      },
      {
        path: 'worker-http-benchmark',
        loadComponent: () =>
          import('./worker-http-benchmark/worker-http-benchmark.component').then(
            (m) => m.WorkerHttpBenchmarkComponent,
          ),
        title: 'Worker HTTP — Benchmark Suite',
      },
      {
        path: 'openlayers',
        loadChildren: () =>
          import('./openlayers/openlayers.routes').then((m) => m.OPENLAYERS_DEMO_ROUTES),
        title: 'OpenLayers — Demo',
      },
      {
        path: 'library-services',
        loadChildren: () =>
          import('./security/security.routes').then((m) => m.LIBRARY_SERVICES_ROUTES),
        title: 'QA System Harness — Demo',
      },
      {
        path: 'storage',
        loadComponent: () =>
          import('./storage/storage-demo.component').then((m) => m.StorageDemoComponent),
        title: 'Storage & Entity Management — Demo',
      },
      {
        path: 'yjs',
        loadComponent: () => import('./yjs/yjs-demo.component').then((m) => m.YjsDemoComponent),
        title: 'Yjs CRDT & Collaboration — Demo',
      },
      {
        path: 'router-resources',
        loadComponent: () =>
          import('./router-resources/router-resources-demo.component').then(
            (m) => m.RouterResourcesDemoComponent,
          ),
        title: 'Router Resources — Demo',
      },
    ],
  },
];
