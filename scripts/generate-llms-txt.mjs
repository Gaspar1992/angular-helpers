#!/usr/bin/env node
/* oxlint-disable no-console */
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const PUBLIC_DIR = path.resolve(ROOT_DIR, 'apps/web/public');

const PACKAGES = [
  {
    id: 'core',
    name: '@angular-helpers/core',
    title: 'Core',
    summary:
      'Essential reactive signal primitives, timing operators, SSR-safe platform detection, and reusable Web Worker pools.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/core',
    readmePath: 'libs/core/README.md',
    canonicalCode: `import { Component, signal } from '@angular/core';
import { debouncedSignal, throttledSignal, timerSignal, injectPlatform } from '@angular-helpers/core';

@Component({
  selector: 'app-search-box',
  template: \`
    <input (input)="onInput($event)" placeholder="Search..." />
    <p>Debounced query: {{ debouncedQuery() }}</p>
    <p>Timer count: {{ timer() }}</p>
  \`,
})
export class SearchBoxComponent {
  private readonly platform = injectPlatform();
  readonly query = signal('');
  readonly debouncedQuery = debouncedSignal(this.query, 300);
  readonly timer = timerSignal(1000);

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}`,
  },
  {
    id: 'browser-web-apis',
    name: '@angular-helpers/browser-web-apis',
    title: 'Browser Web APIs',
    summary:
      'Reactive Angular 22 Signals wrapping standard browser APIs (ResizeObserver, IntersectionObserver, MutationObserver, Geolocation, Clipboard, BroadcastChannel, etc.) with native Signal<ElementRef | Element> support and debouncing/throttling.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/browser-web-apis',
    readmePath: 'libs/browser-web-apis/README.md',
    canonicalCode: `import { Component, viewChild, ElementRef } from '@angular/core';
import { injectResizeObserver, injectIntersectionObserver, injectClipboard } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-responsive-box',
  template: \`
    <div #box class="box">
      <p>Width: {{ resize().contentRect?.width }}px</p>
      <p>In View: {{ intersection().isIntersecting }}</p>
      <button (click)="copyText()">Copy Box Stats</button>
    </div>
  \`,
})
export class ResponsiveBoxComponent {
  readonly boxRef = viewChild<ElementRef<HTMLDivElement>>('box');
  readonly resize = injectResizeObserver(this.boxRef, { debounceMs: 100 });
  readonly intersection = injectIntersectionObserver(this.boxRef, { threshold: 0.5 });
  private readonly clipboard = injectClipboard();

  async copyText(): Promise<void> {
    await this.clipboard.writeText(\`Box width: \${this.resize().contentRect?.width}px\`);
  }
}`,
  },
  {
    id: 'storage',
    name: '@angular-helpers/storage',
    title: 'Storage',
    summary:
      'Reactive storage persistence integrating with Angular 22 resource() API (storageResource, persistedResource), supporting IndexedDB, LocalStorage, MemoryStorageDriver, optimistic updates with linkedSignal, and multi-tab synchronization.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/storage',
    readmePath: 'libs/storage/README.md',
    canonicalCode: `import { Component, signal } from '@angular/core';
import { storageResource } from '@angular-helpers/storage';

interface UserSettings {
  theme: 'dark' | 'light';
  fontSize: number;
}

@Component({
  selector: 'app-user-preferences',
  template: \`
    @if (settings.isLoading()) {
      <p>Loading preferences...</p>
    } @else {
      <p>Active Theme: {{ settings.value()?.theme }}</p>
      <button (click)="toggleTheme()">Toggle Theme</button>
    }
  \`,
})
export class UserPreferencesComponent {
  readonly settings = storageResource<UserSettings>({
    key: 'user-settings-key',
    defaultValue: { theme: 'dark', fontSize: 14 },
    storageType: 'indexeddb',
    enableSWR: true,
  });

  toggleTheme(): void {
    const current = this.settings.value();
    if (!current) return;
    this.settings.update((prev) => ({
      ...prev,
      theme: prev?.theme === 'dark' ? 'light' : 'dark',
    }));
  }
}`,
  },
  {
    id: 'security',
    name: '@angular-helpers/security',
    title: 'Security',
    summary:
      'ReDoS prevention offloading regular expression testing to reusable Web Worker pools with timeouts, WebCrypto API helpers (AES encryption, HMAC signing), and reactive security validators.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/security',
    readmePath: 'libs/security/README.md',
    canonicalCode: `import { Component, inject, signal } from '@angular/core';
import { RegexSecurityService, WebCryptoService } from '@angular-helpers/security';

@Component({
  selector: 'app-safe-validator',
  template: \`
    <button (click)="validateInput()">Validate Safely</button>
    <p>Validation result: {{ result() }}</p>
  \`,
})
export class SafeValidatorComponent {
  private readonly regexSec = inject(RegexSecurityService);
  private readonly crypto = inject(WebCryptoService);
  readonly result = signal<string>('');

  async validateInput(): Promise<void> {
    const check = await this.regexSec.testRegex('^(a+)+$', 'aaaaaaaaaaaaaaaaaaaaa!', { timeout: 2000 });
    if (check.timeout) {
      this.result.set('ReDoS attempt blocked by worker timeout');
    } else {
      this.result.set(check.match ? 'Valid match' : 'No match');
    }
  }
}`,
  },
  {
    id: 'worker-http',
    name: '@angular-helpers/worker-http',
    title: 'Worker HTTP',
    summary:
      'Off-main-thread HTTP execution via Web Workers and SharedWorkers with zero-copy Transferable ArrayBuffers, offline sync queue, client-side caching, and cryptographic request signing.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/worker-http',
    readmePath: 'libs/worker-http/README.md',
    canonicalCode: `import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideWorkerHttpClient,
  withWorkerConfigs,
  withWorkerRoutes,
} from '@angular-helpers/worker-http/backend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideWorkerHttpClient(
      withWorkerConfigs([
        {
          id: 'api-worker',
          workerUrl: new URL('../workers/http-api.worker.js', import.meta.url),
          transferDetection: 'auto', // Zero-copy ArrayBuffer / TypedArray IPC
        },
      ]),
      withWorkerRoutes([{ pattern: /\\/api\\/.*/, worker: 'api-worker' }]),
    ),
  ],
};`,
  },
  {
    id: 'openlayers',
    name: '@angular-helpers/openlayers',
    title: 'OpenLayers',
    summary:
      'Zoneless reactive Angular components, directives, and signal bindings for OpenLayers interactive maps, layers, controls, and vector overlays.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/openlayers',
    readmePath: 'libs/openlayers/README.md',
    canonicalCode: `import { Component } from '@angular/core';
import { OlMapComponent, OlViewDirective, OlTileLayerDirective } from '@angular-helpers/openlayers';

@Component({
  selector: 'app-interactive-map',
  imports: [OlMapComponent, OlViewDirective, OlTileLayerDirective],
  template: \`
    <ol-map class="map-container">
      <ol-view [center]="[0, 0]" [zoom]="4" />
      <ol-tile-layer source="osm" />
    </ol-map>
  \`,
})
export class InteractiveMapComponent {}`,
  },
  {
    id: 'testing',
    name: '@angular-helpers/testing',
    title: 'Testing',
    summary:
      'Deterministic headless browser mocks (setupHeadlessBrowserMocks, ResizeObserver, IntersectionObserver, BroadcastChannel, WebCrypto, Canvas2D) and Angular Zoneless/Signal testing utilities.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/testing',
    readmePath: 'libs/testing/README.md',
    canonicalCode: `import { describe, it, expect } from 'vitest';
import { setupHeadlessBrowserMocks } from '@angular-helpers/testing';

describe('MyComponent', () => {
  // Installs safe ResizeObserver, IntersectionObserver, WebCrypto, BroadcastChannel mocks
  setupHeadlessBrowserMocks();

  it('renders and responds to observers deterministically', () => {
    expect(globalThis.ResizeObserver).toBeDefined();
    expect(globalThis.crypto.subtle).toBeDefined();
  });
});`,
  },
  {
    id: 'yjs',
    name: '@angular-helpers/yjs',
    title: 'Yjs',
    summary:
      'Real-time collaborative state management binding Yjs CRDTs directly to Angular Signals with automatic synchronization.',
    docsUrl: 'https://gaspar1992.github.io/angular-helpers/docs/yjs',
    readmePath: 'libs/yjs/README.md',
    canonicalCode: `import { Component, inject } from '@angular/core';
import { YjsService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-collaborative-editor',
  template: \`<p>Connected peers: {{ yjs.connectedPeers() }}</p>\`,
})
export class CollaborativeEditorComponent {
  protected readonly yjs = inject(YjsService);
}`,
  },
];

export function generateLlmsTxt() {
  let content = `# @angular-helpers

> Open Source Angular 22+ libraries for Signals, Zoneless reactivity, Web Browser APIs, SSR-safety, Cryptography, Reactive Storage, and Web Workers.

@angular-helpers is a modular suite of lightweight, high-performance libraries built specifically for modern Angular (v22+). Every package is designed around Angular Signals, functional dependency injection (\`inject()\`), \`DestroyRef\` lifecycle teardown, strict SSR graceful degradation, and zero unnecessary RxJS dependencies.

## Packages

`;

  for (const pkg of PACKAGES) {
    content += `- [${pkg.title}](${pkg.docsUrl}): ${pkg.summary}\n`;
  }

  content += `
## Technical Specifications & Documentation

- [Full API Specification & Canonical Code](https://gaspar1992.github.io/angular-helpers/llms-full.txt): Comprehensive API signatures, TypeScript interfaces, and canonical Angular 22 examples for all packages.
- [GitHub Repository](https://github.com/Gaspar1992/angular-helpers): Source code, issues, and contributions.
- [Online Documentation](https://gaspar1992.github.io/angular-helpers): Live interactive documentation and API reference.
`;

  return content;
}

export function generateLlmsFullTxt() {
  let content = `# @angular-helpers — Full Technical Reference for AI Agents

> Complete API reference, function signatures, TypeScript types, and canonical usage examples for all @angular-helpers packages in Angular 22+.

---

## Architectural Rules for Code Generation (Angular 22+)
When generating code with @angular-helpers, adhere to the following standards:
1. **Zoneless & Signal-First**: Local and derived state must use Angular Signals (\`signal\`, \`computed\`, \`linkedSignal\`, \`resource\`). Avoid RxJS except for Angular HTTP interceptor pipelines or external stream bridging.
2. **Functional Dependency Injection**: Use \`inject(Service)\` rather than constructor-based injection.
3. **Standalone Components**: All components are standalone by default in Angular v20+. Do NOT specify \`standalone: true\` in component decorators.
4. **Lifecycle Teardown**: Use \`DestroyRef.onDestroy()\` instead of \`ngOnDestroy()\` when managing cleanups.
5. **SSR Safety**: All browser web APIs must safely degrade in Server-Side Rendering (Node.js) environments using \`PLATFORM_ID\` / \`injectPlatform()\`.
6. **Zero Any**: Strict TypeScript typing with explicit return types on public API exports.

---

`;

  for (const pkg of PACKAGES) {
    content += `## ${pkg.name} (\`${pkg.id}\`)\n\n`;
    content += `**Documentation:** ${pkg.docsUrl}\n\n`;
    content += `**Summary:** ${pkg.summary}\n\n`;

    // Include README excerpt if available
    const readmeFile = path.resolve(ROOT_DIR, pkg.readmePath);
    if (fs.existsSync(readmeFile)) {
      const readmeRaw = fs.readFileSync(readmeFile, 'utf8');
      // Extract brief API overview from README if present
      const featuresMatch = readmeRaw.match(/## Features([\s\S]*?)(## |$)/);
      if (featuresMatch) {
        content += `### Key Features\n${featuresMatch[1].trim()}\n\n`;
      }
    }

    content += `### Canonical Usage Example (Angular 22)\n\n\`\`\`typescript\n${pkg.canonicalCode}\n\`\`\`\n\n---\n\n`;
  }

  return content;
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const llmsTxtPath = path.resolve(PUBLIC_DIR, 'llms.txt');
  const llmsFullTxtPath = path.resolve(PUBLIC_DIR, 'llms-full.txt');

  console.log('📝 Generating llms.txt and llms-full.txt...');

  const llmsTxtContent = generateLlmsTxt();
  fs.writeFileSync(llmsTxtPath, llmsTxtContent, 'utf8');
  console.log(`✅ Generated ${llmsTxtPath} (${Buffer.byteLength(llmsTxtContent)} bytes)`);

  const llmsFullTxtContent = generateLlmsFullTxt();
  fs.writeFileSync(llmsFullTxtPath, llmsFullTxtContent, 'utf8');
  console.log(`✅ Generated ${llmsFullTxtPath} (${Buffer.byteLength(llmsFullTxtContent)} bytes)`);
}

main();
