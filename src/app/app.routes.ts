import { Routes } from '@angular/router';
import { BrowserApisComponent } from './demo/browser-apis/browser-apis';

export const routes: Routes = [
  { path: 'demo', component: BrowserApisComponent },
  { path: '', redirectTo: '/demo', pathMatch: 'full' }
];
