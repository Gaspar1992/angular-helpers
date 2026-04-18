import { describe, expect, it } from 'vitest';

import {
  workerCache,
  workerContentIntegrity,
  workerCustom,
  workerHmacSigning,
  workerLogging,
  workerRateLimit,
  workerRetry,
} from './interceptor-specs';

describe('interceptor spec builders', () => {
  it('workerLogging produces a spec with kind logging and the given config', () => {
    expect(workerLogging()).toStrictEqual({ kind: 'logging', config: undefined });
    expect(workerLogging({ includeHeaders: true })).toStrictEqual({
      kind: 'logging',
      config: { includeHeaders: true },
    });
  });

  it('workerRetry produces a spec with kind retry', () => {
    expect(workerRetry({ maxRetries: 5 })).toStrictEqual({
      kind: 'retry',
      config: { maxRetries: 5 },
    });
  });

  it('workerCache produces a spec with kind cache', () => {
    expect(workerCache({ ttl: 1000 })).toStrictEqual({
      kind: 'cache',
      config: { ttl: 1000 },
    });
  });

  it('workerHmacSigning requires a key material and produces kind hmac-signing', () => {
    const keyMaterial = new Uint8Array([1, 2, 3]);
    expect(workerHmacSigning({ keyMaterial })).toStrictEqual({
      kind: 'hmac-signing',
      config: { keyMaterial },
    });
  });

  it('workerRateLimit produces a spec with kind rate-limit', () => {
    expect(workerRateLimit({ maxRequests: 10, windowMs: 1000 })).toStrictEqual({
      kind: 'rate-limit',
      config: { maxRequests: 10, windowMs: 1000 },
    });
  });

  it('workerContentIntegrity produces a spec with kind content-integrity', () => {
    expect(workerContentIntegrity({ algorithm: 'SHA-512' })).toStrictEqual({
      kind: 'content-integrity',
      config: { algorithm: 'SHA-512' },
    });
  });

  it('workerCustom produces a spec with kind custom and the given name', () => {
    expect(workerCustom('auth-token', { token: 'xyz' })).toStrictEqual({
      kind: 'custom',
      name: 'auth-token',
      config: { token: 'xyz' },
    });
  });
});
