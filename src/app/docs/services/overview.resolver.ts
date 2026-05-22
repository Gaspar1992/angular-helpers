import { ResolveFn } from '@angular/router';
import { OverviewConfig } from '../feature/unified-overview/unified-overview.component';
import { BROWSER_WEB_APIS_SERVICES } from '../data/browser-web-apis.data';
import { CORE_SERVICES } from '../data/core.data';
import { SECURITY_SERVICES } from '../data/security.data';
import { WORKER_HTTP_ENTRIES } from '../data/worker-http.data';
import { OPENLAYERS_SERVICES } from '../data/openlayers.data';
import { STORAGE_SERVICES } from '../data/storage.data';
import { generateServiceGroups } from './overview.utils';

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
        items: CORE_SERVICES.filter((s) => s.category === 'platform'),
      },
      {
        label: 'Workers & Transferables',
        icon: '⚙️',
        items: CORE_SERVICES.filter((s) => s.category === 'workers'),
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
  storage: {
    packageName: 'storage',
    npmPackage: '@angular-helpers/storage',
    lead: 'High-performance, client-side, encrypted, and dynamically compressed reactive state and storage utilities.',
    providerExample: `import { STORAGE_TRANSPORT, LocalStorageTransport } from '@angular-helpers/storage';

bootstrapApplication(AppComponent, {
  providers: [
    // Proveemos el transporte de almacenamiento por defecto
    { provide: STORAGE_TRANSPORT, useClass: LocalStorageTransport }
  ],
});`,
    serviceGroups: [
      {
        label: 'Core Primitives',
        icon: '💾',
        items: STORAGE_SERVICES.filter((s) => s.id.startsWith('inject-')),
      },
      {
        label: 'Transports & Protocols',
        icon: '⚙',
        items: STORAGE_SERVICES.filter((s) => !s.id.startsWith('inject-')),
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
    serviceGroups: generateServiceGroups(OPENLAYERS_SERVICES),
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
