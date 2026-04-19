import { afterEach, describe, expect, it, vi } from 'vitest';

import { __clearCustomRegistry, registerInterceptor, resolveSpec } from './configurable-pipeline';
import type { WorkerInterceptorSpec } from './interceptor-spec.types';
import type { WorkerInterceptorFn } from './worker-interceptor.types';

describe('resolveSpec', () => {
  afterEach(() => {
    __clearCustomRegistry();
  });

  it('resolves built-in specs to functions', () => {
    const builtins: WorkerInterceptorSpec[] = [
      { kind: 'logging' },
      { kind: 'retry' },
      { kind: 'cache' },
      { kind: 'rate-limit' },
      { kind: 'content-integrity' },
      { kind: 'hmac-signing', config: { keyMaterial: new Uint8Array([1, 2, 3]) } },
    ];

    for (const spec of builtins) {
      const fn = resolveSpec(spec);
      expect(typeof fn).toBe('function');
      expect(fn.length).toBe(2); // (req, next)
    }
  });

  it('resolves custom specs through the registry', async () => {
    const passthrough: WorkerInterceptorFn = async (req, next) => next(req);
    const factory = vi.fn((_config?: unknown) => passthrough);
    registerInterceptor('my-custom', factory);

    const fn = resolveSpec({ kind: 'custom', name: 'my-custom', config: { foo: 1 } });
    expect(typeof fn).toBe('function');
    expect(factory).toHaveBeenCalledWith({ foo: 1 });
  });

  it('throws a clear error when a custom spec name is not registered', () => {
    expect(() => resolveSpec({ kind: 'custom', name: 'unknown', config: undefined })).toThrowError(
      /Custom interceptor "unknown" was not registered/,
    );
  });

  it('throws when the spec kind is unknown', () => {
    expect(() => resolveSpec({ kind: 'bogus' } as unknown as WorkerInterceptorSpec)).toThrowError(
      /Unknown interceptor spec kind/,
    );
  });
});
