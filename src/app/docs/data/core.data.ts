import type { ServiceDoc } from '../models/doc-meta.model';

export const CORE_SERVICES: ServiceDoc[] = [
  {
    id: 'inject-platform',
    name: 'injectPlatform',
    description: `Composable that resolves the current platform environment using Angular's Dependency Injection. Returns a typed object with \`isBrowser\`, \`isServer\`, \`window\`, and \`document\` fields. Gracefully falls back when called outside an injection context (e.g. unit tests).`,
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
    methods: [],
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
    description: `Pure predicate that returns \`true\` if a value is a \`Transferable\` instance that can be moved zero-copy via \`postMessage\`. Guards every Transferable type with a \`typeof\` check so it is safe in Web Workers, Node.js, and SSR contexts where some globals may be absent.`,
    scope: 'provided',
    importPath: '@angular-helpers/core',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers + Web Workers + Node.js',
    category: 'workers',
    notes: [
      'Supported Transferable types: ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, ReadableStream, WritableStream, TransformStream.',
      `Typed-array views (Uint8Array, etc.) are NOT Transferable — pass \`.buffer\` explicitly if needed.`,
      'Used internally by @angular-helpers/storage and @angular-helpers/worker-http to build zero-copy postMessage calls.',
      'Each global is guarded with typeof so the predicate is safe in environments where some globals are missing.',
    ],
    methods: [],
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
    description: `Manages a pool of Web Workers with round-robin job dispatch. \`injectWorkerPool\` is the DI-aware factory that automatically terminates all workers when the injection context is destroyed. Used internally by \`@angular-helpers/security\` to run ReDoS-safe regex operations off the main thread.`,
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
        name: 'execute',
        signature:
          'execute(type: string, data: any, timeoutMsOrOptions?: number | { timeoutMs?: number; transfer?: Transferable[] }): Promise<T>',
        description: 'Executes a task in the worker',
        returns: 'Promise<T>',
      },
      {
        name: 'terminate',
        signature: 'terminate(): void',
        description: 'Public method terminate.',
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
    guides: [
      {
        title: 'Multi-Threaded Computations (Round-Robin WorkerPool)',
        description:
          'This guide details how to build a highly parallel computational service using injectWorkerPool. We create a pool of load-balanced background workers that handle heavy calculations asynchronously, avoiding UI thread freezing. It automatically handles worker lifecycle and terminations on context destruction.',
        code: `import { Injectable, inject } from '@angular/core';
import { injectWorkerPool } from '@angular-helpers/core';

export interface ComputePayload {
  matrixA: number[][];
  matrixB: number[][];
}

@Injectable({ providedIn: 'root' })
export class HighPerformanceComputeService {
  // 1. Instantiate the WorkerPool using direct DI integration.
  // Pool size is automatically adjusted up to navigator.hardwareConcurrency (capped at 4).
  // When this service (or owning context) is destroyed, all workers are automatically terminated via DestroyRef.
  private readonly pool = injectWorkerPool(
    () => new Worker(new URL('./compute.worker', import.meta.url), { type: 'module' }),
    { poolSize: 4 }
  );

  async multiplyMatrices(a: number[][], b: number[][]): Promise<number[][]> {
    const payload: ComputePayload = { matrixA: a, matrixB: b };

    try {
      // 2. Dispatch the computationally heavy task to the next available worker in a round-robin fashion.
      // This runs off-main-thread so that your Angular UI stays completely fluid at 60 FPS.
      const result = await this.pool.run<ComputePayload, number[][]>(payload);
      return result;
    } catch (error) {
      console.error('Off-thread computation failed:', error);
      throw error;
    }
  }

  terminatePool() {
    // 3. Optional manual termination of all active threads.
    this.pool.terminate();
  }
}`,
      },
    ],
  },
];
