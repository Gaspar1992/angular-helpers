import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
    title: 'Angular Helpers',
  },
  {
    path: 'demo',
    loadChildren: () => import('./demo/demo.routes').then((m) => m.DEMO_ROUTES),
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
