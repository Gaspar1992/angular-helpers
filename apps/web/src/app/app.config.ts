import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideSecurity } from '@angular-helpers/security';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),

    provideSecurity({
      enableRegexSecurity: true,
      enableWebCrypto: true,
      enableSecureStorage: true,
      enableInputSanitizer: true,
      enablePasswordStrength: true,
      enableJwt: true,
      enableSensitiveClipboard: true,
      enableHibp: true,
      enableRateLimiter: true,
      enableCsrf: true,
      enableSessionIdle: true,
      enableSecureMessage: true,
    }),
    provideClientHydration(withEventReplay()),
  ],
};
