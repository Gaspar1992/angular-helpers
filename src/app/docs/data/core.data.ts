import { ServiceDoc } from '../models/doc-meta.model';

export const CORE_SERVICES: ServiceDoc[] = [
  {
    id: 'inject-platform',
    name: 'injectPlatform',
    description:
      "Composable that resolves the current platform environment using Angular's Dependency Injection. Returns a typed object with `isBrowser`, `isServer`, `window`, and `document` fields. Gracefully falls back when called outside an injection context (e.g. unit tests).",
    scope: 'provided',
    importPath: '@angular-helpers/core',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers + SSR (Node)',
    category: 'platform',
    notes: [
      'MUST be called within an injection context (constructor, factory, or inject-phase function).',
      'Falls back to typeof window/document checks when called outside DI (useful in unit tests).',
      'Returns null for window/document when running in SSR — always guard before accessing.',
      'Prefer this over raw PLATFORM_ID + isPlatformBrowser() to avoid import duplication across packages.',
    ],
    methods: [
      {
        name: 'injectPlatform',
        signature: 'injectPlatform(): PlatformInfo',
        description:
          'Returns a <code>PlatformInfo</code> object with <code>isBrowser</code>, <code>isServer</code>, <code>window</code>, and <code>document</code> fields. Must be called within an Angular injection context.',
        returns: 'PlatformInfo',
      },
    ],
    example: `import { Component } from '@angular/core';
import { injectPlatform } from '@angular-helpers/core';

@Component({
  selector: 'app-platform-aware',
  template: \`<p>Running on: {{ platform.isBrowser ? 'Browser' : 'Server' }}</p>\`
})
export class PlatformAwareComponent {
  protected readonly platform = injectPlatform();

  constructor() {
    if (this.platform.isBrowser) {
      // Safe to access browser APIs here
      console.log('Viewport:', this.platform.window?.innerWidth);
    }
  }
}`,
  },
  {
    id: 'is-transferable',
    name: 'isTransferable',
    description:
      'Pure predicate that returns `true` if a value is a `Transferable` instance that can be moved zero-copy via `postMessage`. Guards every Transferable type with a `typeof` check so it is safe in Web Workers, Node.js, and SSR contexts where some globals may be absent.',
    scope: 'provided',
    importPath: '@angular-helpers/core',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers + Web Workers + Node.js',
    category: 'workers',
    notes: [
      'Supported Transferable types: ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, ReadableStream, WritableStream, TransformStream.',
      'Typed-array views (Uint8Array, etc.) are NOT Transferable — pass `.buffer` explicitly if needed.',
      'Used internally by @angular-helpers/storage and @angular-helpers/worker-http to build zero-copy postMessage calls.',
      'Each global is guarded with typeof so the predicate is safe in environments where some globals are missing.',
    ],
    methods: [
      {
        name: 'isTransferable',
        signature: 'isTransferable(value: unknown): value is Transferable',
        description:
          'Returns <code>true</code> if the value is a <code>Transferable</code> (ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, ReadableStream, WritableStream, or TransformStream).',
        returns: 'value is Transferable',
      },
    ],
    example: `import { isTransferable } from '@angular-helpers/core';

function buildTransferList(payload: unknown): Transferable[] {
  if (!payload || typeof payload !== 'object') return [];

  return Object.values(payload as Record<string, unknown>)
    .filter(isTransferable);
}

// Usage
const buffer = new ArrayBuffer(1024);
console.log(isTransferable(buffer));   // true
console.log(isTransferable('hello'));  // false
console.log(isTransferable(42));       // false`,
  },
  {
    id: 'worker-pool',
    name: 'WorkerPool / injectWorkerPool',
    description:
      'Manages a pool of Web Workers with round-robin job dispatch. `injectWorkerPool` is the DI-aware factory that automatically terminates all workers when the injection context is destroyed. Used internally by `@angular-helpers/security` to run ReDoS-safe regex operations off the main thread.',
    scope: 'provided',
    importPath: '@angular-helpers/core',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers with Web Worker support',
    category: 'workers',
    notes: [
      'No-ops on server (SSR): returns a pool that immediately rejects all jobs.',
      'Pool size defaults to navigator.hardwareConcurrency (capped at 4) or falls back to 1.',
      'Workers are terminated automatically via DestroyRef when the component/service is destroyed.',
      'Round-robin dispatch ensures work is spread evenly across all workers.',
    ],
    methods: [
      {
        name: 'run',
        signature: 'run<TInput, TOutput>(input: TInput): Promise<TOutput>',
        description:
          'Dispatches a job to the next available worker in the pool using round-robin. Returns a Promise that resolves with the worker response.',
        returns: 'Promise<TOutput>',
      },
      {
        name: 'terminate',
        signature: 'terminate(): void',
        description: 'Terminates all workers in the pool immediately.',
        returns: 'void',
      },
    ],
    example: `import { Injectable } from '@angular/core';
import { injectWorkerPool } from '@angular-helpers/core';

@Injectable({ providedIn: 'root' })
export class MyWorkerService {
  private readonly pool = injectWorkerPool(
    () => new Worker(new URL('./my.worker', import.meta.url), { type: 'module' }),
    { poolSize: 4 }
  );

  processData(input: string): Promise<string> {
    return this.pool.run<string, string>(input);
  }
}`,
  },
];
