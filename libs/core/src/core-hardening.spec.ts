import { describe, it, expect, vi } from 'vitest';
import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { hexToBytes, bytesToBase64 } from '@angular-helpers/core/utils';
import { WorkerPool, injectWorkerPool, debouncedSignal, throttledSignal } from './public-api';

describe('core hardening regressions', () => {
  describe('binary utils', () => {
    it('rejects invalid hex nibbles such as 0g', () => {
      expect(() => hexToBytes('0g')).toThrow('Invalid hex string');
      expect(() => hexToBytes('zz')).toThrow('Invalid hex string');
      expect(() => hexToBytes('a')).toThrow('Invalid hex string');
    });

    it('encodes large buffers to base64 via chunked conversion', () => {
      const large = new Uint8Array(70_000).fill(65);
      const b64 = bytesToBase64(large);
      expect(b64.length).toBeGreaterThan(90_000);
    });
  });

  describe('WorkerPool', () => {
    it('cleans up pendingTasks and rejects when postMessage throws synchronously', async () => {
      const originalWorker = globalThis.Worker;
      globalThis.Worker = class {} as unknown as typeof Worker;
      try {
        const mockWorker = {
          onmessage: null as ((e: MessageEvent) => void) | null,
          onerror: null as ((e: ErrorEvent) => void) | null,
          postMessage: vi.fn(() => {
            throw new DOMException('Cannot clone', 'DataCloneError');
          }),
          terminate: vi.fn(),
        } as unknown as Worker;

        const pool = new WorkerPool({
          workerFactory: () => mockWorker,
          defaultTimeout: 50,
        });

        await expect(pool.execute('test', { fn: () => {} })).rejects.toThrow('Cannot clone');
        // Wait past timeout to confirm it does not trigger a spurious restart
        await new Promise((r) => setTimeout(r, 80));
        expect(mockWorker.terminate).not.toHaveBeenCalled();
        pool.terminate();
      } finally {
        globalThis.Worker = originalWorker;
      }
    });

    it('rejects http://localhost.evil.com and allows http://127.0.0.1 in injectWorkerPool', async () => {
      TestBed.configureTestingModule({});

      const originalWorker = globalThis.Worker;
      const constructedUrls: string[] = [];
      globalThis.Worker = class {
        constructor(url: string | URL) {
          constructedUrls.push(String(url));
        }
        terminate() {}
      } as unknown as typeof Worker;

      try {
        await TestBed.runInInjectionContext(async () => {
          const evilPool = injectWorkerPool('http://localhost.evil.com/w.js');
          await expect(evilPool.execute('ping', {})).rejects.toThrow('must use HTTPS');
          evilPool.terminate();

          const loopbackPool = injectWorkerPool('http://127.0.0.1:4200/w.js');
          loopbackPool.terminate();
        });
        expect(constructedUrls).toContain('http://127.0.0.1:4200/w.js');
      } finally {
        globalThis.Worker = originalWorker;
      }
    });
  });

  describe('debouncedSignal & throttledSignal SSR and NaN', () => {
    it('tracks latest source reactively on SSR without freezing initial value', () => {
      TestBed.configureTestingModule({
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });

      const src = signal('initial');
      const debounced = TestBed.runInInjectionContext(() => debouncedSignal(src, 100));
      const throttled = TestBed.runInInjectionContext(() => throttledSignal(src, 100));

      src.set('updated');
      expect(debounced()).toBe('updated');
      expect(throttled()).toBe('updated');
    });

    it('treats consecutive NaN values as equal via Object.is', async () => {
      TestBed.configureTestingModule({});
      const src = signal<number>(NaN);
      const debounced = TestBed.runInInjectionContext(() => debouncedSignal(src, 10));

      TestBed.tick();
      src.set(NaN);
      TestBed.tick();
      await new Promise((r) => setTimeout(r, 30));
      expect(Number.isNaN(debounced())).toBe(true);
    });
  });
});
