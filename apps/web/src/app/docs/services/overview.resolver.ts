import type { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { DocsVersionService } from '../services/docs-version.service';
import type { OverviewConfig } from '../feature/unified-overview/unified-overview.component';
import { generateServiceGroups } from './overview.utils';

// Import v21 data
import * as browserWebApisV21 from '../data/v21/browser-web-apis.data';
import * as coreV21 from '../data/v21/core.data';
import * as securityV21 from '../data/v21/security.data';
import * as workerHttpV21 from '../data/v21/worker-http.data';
import * as openlayersV21 from '../data/v21/openlayers.data';
import * as storageV21 from '../data/v21/storage.data';

// Import v22 data
import * as browserWebApisV22 from '../data/v22/browser-web-apis.data';
import * as coreV22 from '../data/v22/core.data';
import * as securityV22 from '../data/v22/security.data';
import * as workerHttpV22 from '../data/v22/worker-http.data';
import * as openlayersV22 from '../data/v22/openlayers.data';
import * as storageV22 from '../data/v22/storage.data';

function getOverviewConfig(section: string, version: 'v21' | 'v22'): OverviewConfig {
  const isV21 = version === 'v21';

  const coreServices = isV21 ? coreV21.CORE_SERVICES : coreV22.CORE_SERVICES;
  const browserWebApisServices = isV21
    ? browserWebApisV21.BROWSER_WEB_APIS_SERVICES
    : browserWebApisV22.BROWSER_WEB_APIS_SERVICES;
  const securityServices = isV21 ? securityV21.SECURITY_SERVICES : securityV22.SECURITY_SERVICES;
  const workerHttpEntries = isV21
    ? workerHttpV21.WORKER_HTTP_ENTRIES
    : workerHttpV22.WORKER_HTTP_ENTRIES;
  const storageServices = isV21 ? storageV21.STORAGE_SERVICES : storageV22.STORAGE_SERVICES;
  const openlayersServices = isV21
    ? openlayersV21.OPENLAYERS_SERVICES
    : openlayersV22.OPENLAYERS_SERVICES;

  const OVERVIEW_CONFIGS: Record<string, OverviewConfig> = {
    core: {
      packageName: 'core',
      npmPackage: '@angular-helpers/core',
      lead: 'Shared primitives used across all Angular Helpers packages — platform detection, Transferable helpers, and Worker pooling.',
      providerExample: `import { injectPlatform, injectWorkerPool, isTransferable } from '@angular-helpers/core';
  
  // No provider setup required — all utilities are standalone inject() functions.
  // pnpm add @angular-helpers/core`,
      serviceGroups: [
        {
          label: 'Platform',
          icon: '🖥️',
          items: coreServices.filter((s) => s.category === 'platform'),
        },
        {
          label: 'Workers & Transferables',
          icon: '⚙️',
          items: coreServices.filter((s) => s.category === 'workers'),
        },
      ],
    },
    'browser-web-apis': {
      packageName: 'browser-web-apis',
      npmPackage: '@angular-helpers/browser-web-apis',
      lead: 'Angular services for structured, secure, and reactive access to Browser Web APIs.',
      providerExample: `import { provideBrowserWebApis, provideCamera, provideGeolocation } from '@angular-helpers/browser-web-apis';
  
  bootstrapApplication(AppComponent, {
    providers: [
      provideBrowserWebApis({
        services: [provideCamera(), provideGeolocation()],
      }),
    ],
  });`,
      serviceGroups: generateServiceGroups(browserWebApisServices),
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
          items: securityServices,
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
          items: workerHttpEntries,
        },
      ],
    },
    storage: {
      packageName: 'storage',
      npmPackage: '@angular-helpers/storage',
      lead: 'High-performance, client-side, encrypted, and dynamically compressed reactive state and storage utilities.',
      providerExample: `import { STORAGE_TRANSPORT, LocalStorageTransport } from '@angular-helpers/storage';
  
  bootstrapApplication(AppComponent, {
    providers: [
      // Provide the default storage transport
      { provide: STORAGE_TRANSPORT, useClass: LocalStorageTransport }
    ],
  });`,
      serviceGroups: [
        {
          label: 'Core Primitives',
          icon: '💾',
          items: storageServices.filter((s) => s.id.startsWith('inject-')),
        },
        {
          label: 'Transports & Protocols',
          icon: '⚙',
          items: storageServices.filter((s) => !s.id.startsWith('inject-')),
        },
      ],
    },
    openlayers: {
      packageName: 'openlayers',
      npmPackage: '@angular-helpers/openlayers',
      lead: 'Modern Angular wrapper for OpenLayers with modular architecture and standalone components.',
      providerExample: `import { OlMapComponent, OlTileLayerComponent } from '@angular-helpers/openlayers';
  
  @Component({
    imports: [OlMapComponent, OlTileLayerComponent],
    template: \`
      <ol-map [center]="[0, 0]" [zoom]="2">
        <ol-tile-layer source="osm" />
      </ol-map>
    \`,
  })
  export class MapComponent {}`,
      serviceGroups: generateServiceGroups(openlayersServices),
    },
  };

  return (
    OVERVIEW_CONFIGS[section] ?? {
      packageName: section,
      npmPackage: `@angular-helpers/${section}`,
      lead: '',
      providerExample: '',
      serviceGroups: [],
    }
  );
}

export const overviewResolver: ResolveFn<OverviewConfig> = (route) => {
  const versionService = inject(DocsVersionService);
  const version = versionService.version();
  const section = route.url[0]?.path ?? 'browser-web-apis';
  return getOverviewConfig(section, version);
};
