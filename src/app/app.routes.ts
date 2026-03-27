import { Routes } from '@angular/router';
import { BrowserApisComponent } from './demo/browser-apis/browser-apis';
import { LibraryServicesHarnessComponent } from './demo/library-services-harness/library-services-harness';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    title: 'Angular Helpers',
  },
  { path: 'demo/library-services', component: LibraryServicesHarnessComponent },
  { path: 'demo', component: BrowserApisComponent },
  {
    path: 'docs',
    loadChildren: () => import('./docs/docs.routes').then((m) => m.DOCS_ROUTES),
  },
];
