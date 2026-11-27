import { provideRegexSecurity, provideSecurity } from '@angular-helpers/security';
import type { Routes } from '@angular/router';

export const SECURITY_DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./security-demo.component').then((m) => m.SecurityDemoComponent),
    providers: [
      provideSecurity({
        enableRegexSecurity: true,
        enableWebCrypto: true,
        enableSecureStorage: true,
        enableInputSanitizer: true,
        enablePasswordStrength: true,
        enableRateLimiter: true,
      }),
    ],
  },
];

export const SECURITY_UTILITIES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../security-utilities/security-utilities-demo.component').then(
        (m) => m.SecurityUtilitiesDemoComponent,
      ),
    providers: [
      provideSecurity({
        enableJwt: true,
        enableHibp: true,
        enableRateLimiter: true,
        enableCsrf: true,
        enableSensitiveClipboard: true,
      }),
    ],
  },
];

export const SECURITY_SIGNAL_FORMS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../security-signal-forms/security-signal-forms-demo.component').then(
        (m) => m.SecuritySignalFormsDemoComponent,
      ),
    providers: [
      provideSecurity({
        enableHibp: true,
      }),
    ],
  },
];

export const LIBRARY_SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../library-services-harness/library-services-harness').then(
        (m) => m.LibraryServicesHarnessComponent,
      ),
    providers: [provideRegexSecurity()],
  },
];
