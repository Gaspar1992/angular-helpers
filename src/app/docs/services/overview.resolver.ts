import { ResolveFn } from '@angular/router';
import { OverviewConfig } from '../feature/unified-overview/unified-overview.component';
import { BROWSER_WEB_APIS_SERVICES } from '../data/browser-web-apis.data';
import { SECURITY_SERVICES } from '../data/security.data';
import { WORKER_HTTP_ENTRIES } from '../data/worker-http.data';
import { generateServiceGroups } from './overview.utils';

const OVERVIEW_CONFIGS: Record<string, OverviewConfig> = {
  'browser-web-apis': {
    packageName: 'browser-web-apis',
    npmPackage: '@angular-helpers/browser-web-apis',
    lead: 'Angular services for structured, secure, and reactive access to Browser Web APIs.',
    providerExample: `import { provideBrowserWebApis, CameraService, GeolocationService } from '@angular-helpers/browser-web-apis';

bootstrapApplication(AppComponent, {
  providers: [
    provideBrowserWebApis({
      services: [CameraService, GeolocationService],
    }),
  ],
});`,
    serviceGroups: generateServiceGroups(BROWSER_WEB_APIS_SERVICES),
  },
  security: {
    packageName: 'security',
    npmPackage: '@angular-helpers/security',
    lead: 'Security-focused Angular services for validation, crypto, and safe storage.',
    providerExample: `import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      enableRegexSecurity: true,
      enableWebCrypto: true,
    }),
  ],
});`,
    serviceGroups: [
      {
        label: 'Security Services',
        icon: '🔐',
        items: SECURITY_SERVICES,
      },
    ],
  },
  'worker-http': {
    packageName: 'worker-http',
    npmPackage: '@angular-helpers/worker-http',
    lead: 'HTTP client for Web Workers with interceptors, retry logic, and caching.',
    providerExample: `import { provideWorkerHttpClient } from '@angular-helpers/worker-http/backend';

bootstrapApplication(AppComponent, {
  providers: [
    provideWorkerHttpClient({
      workerUrl: new URL('./workers/http-api.worker', import.meta.url),
    }),
  ],
});`,
    serviceGroups: [
      {
        label: 'Entry Points',
        icon: '⚙',
        items: WORKER_HTTP_ENTRIES,
      },
    ],
  },
};

export const overviewResolver: ResolveFn<OverviewConfig> = (route) => {
  const section = route.url[0]?.path ?? 'browser-web-apis';
  return (
    OVERVIEW_CONFIGS[section] ?? {
      packageName: section,
      npmPackage: `@angular-helpers/${section}`,
      lead: '',
      providerExample: '',
      serviceGroups: [],
    }
  );
};
