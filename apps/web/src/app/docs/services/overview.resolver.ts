import type { ResolveFn, ResourceContext } from '@angular/router';
import { inject, resource } from '@angular/core';
import { DocsVersionService } from '../services/docs-version.service';
import type { OverviewConfig } from '../feature/unified-overview/unified-overview.component';
import { generateServiceGroups } from './overview.utils';

export async function getOverviewConfig(
  section: string,
  version: 'v21' | 'v22',
): Promise<OverviewConfig> {
  const isV21 = version === 'v21';

  switch (section) {
    case 'core': {
      const { CORE_SERVICES: coreServices } = isV21
        ? await import('../data/v21/core.data')
        : await import('../data/v22/core.data');
      return {
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
      };
    }
    case 'browser-web-apis': {
      const { BROWSER_WEB_APIS_SERVICES: browserWebApisServices } = isV21
        ? await import('../data/v21/browser-web-apis.data')
        : await import('../data/v22/browser-web-apis.data');
      return {
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
      };
    }
    case 'security': {
      const { SECURITY_SERVICES: securityServices } = isV21
        ? await import('../data/v21/security.data')
        : await import('../data/v22/security.data');
      return {
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
      };
    }
    case 'worker-http': {
      const { WORKER_HTTP_ENTRIES: workerHttpEntries } = isV21
        ? await import('../data/v21/worker-http.data')
        : await import('../data/v22/worker-http.data');
      return {
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
      };
    }
    case 'storage': {
      const { STORAGE_SERVICES: storageServices } = isV21
        ? await import('../data/v21/storage.data')
        : await import('../data/v22/storage.data');
      return {
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
      };
    }
    case 'openlayers': {
      const { OPENLAYERS_SERVICES: openlayersServices } = isV21
        ? await import('../data/v21/openlayers.data')
        : await import('../data/v22/openlayers.data');
      return {
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
      };
    }
    case 'yjs': {
      const { YJS_SERVICES: yjsServices } = isV21
        ? await import('../data/v21/yjs.data')
        : await import('../data/v22/yjs.data');
      return {
        packageName: 'yjs',
        npmPackage: '@angular-helpers/yjs',
        lead: 'Bidirectional Angular Signal bindings for Yjs CRDT real-time collaborative state.',
        providerExample: `import { yjsSignal, YjsDocService } from '@angular-helpers/yjs';
  
  const yjs = inject(YjsDocService);
  const yMap = yjs.doc.getMap('doc');
  const title = yjsSignal(yMap, { key: 'title' });`,
        serviceGroups: [
          {
            label: 'Signals & State',
            icon: '🔄',
            items: yjsServices,
          },
        ],
      };
    }
    case 'testing': {
      const { TESTING_SERVICES: testingServices } = isV21
        ? await import('../data/v21/testing.data')
        : await import('../data/v22/testing.data');
      return {
        packageName: 'testing',
        npmPackage: '@angular-helpers/testing',
        lead: 'Lightweight testing utilities, headless browser mocks, and spy-backed providers for modern Angular.',
        providerExample: `import { render, provideMockService, setupHeadlessBrowserMocks } from '@angular-helpers/testing';

// Vitest / Jest setup
setupHeadlessBrowserMocks();

const { getByText } = await render(MyComponent, {
  providers: [provideMockService(MyService)],
});`,
        serviceGroups: [
          {
            label: 'Testing Primitives',
            icon: '🧪',
            items: testingServices,
          },
        ],
      };
    }
    default:
      return {
        packageName: section,
        npmPackage: `@angular-helpers/${section}`,
        lead: '',
        providerExample: '',
        serviceGroups: [],
      };
  }
}

export const overviewResolver: ResolveFn<OverviewConfig> = (route) => {
  const versionService = inject(DocsVersionService);
  const version = versionService.version();
  const section = route.url[0]?.path ?? 'browser-web-apis';
  return getOverviewConfig(section, version);
};

export function overviewResource(ctx: ResourceContext, defaultSection = 'browser-web-apis') {
  const versionService = inject(DocsVersionService);
  return resource({
    params: () => ({
      section: defaultSection,
      version: versionService.version(),
    }),
    loader: async ({ params }) => {
      return getOverviewConfig(params.section, params.version);
    },
  });
}
