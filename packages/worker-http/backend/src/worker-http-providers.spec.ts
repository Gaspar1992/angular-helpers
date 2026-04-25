import { describe, expect, it } from 'vitest';

import {
  withWorkerConfigs,
  withWorkerFallback,
  withWorkerInterceptors,
  withWorkerRoutes,
  withWorkerSerialization,
  withWorkerStreamsPolyfill,
} from './worker-http-providers';
import {
  WORKER_HTTP_CONFIGS_TOKEN,
  WORKER_HTTP_FALLBACK_TOKEN,
  WORKER_HTTP_INTERCEPTORS_TOKEN,
  WORKER_HTTP_ROUTES_TOKEN,
  WORKER_HTTP_SERIALIZER_TOKEN,
  WORKER_HTTP_STREAMS_POLYFILL_TOKEN,
} from './worker-http-tokens';
import type { WorkerInterceptorSpecsMap } from './worker-http-tokens';
import type { WorkerSerializer } from '../../serializer/src/worker-serializer.types';
import type { WorkerInterceptorSpec } from '@angular-helpers/worker-http/interceptors';

describe('withWorkerConfigs', () => {
  it('returns kind WorkerConfigs', () => {
    const feature = withWorkerConfigs([]);
    expect(feature.kind).toBe('WorkerConfigs');
  });

  it('provides WORKER_HTTP_CONFIGS_TOKEN with the given configs', () => {
    const configs = [{ id: 'public', workerUrl: new URL('https://example.com/worker.js') }];
    const feature = withWorkerConfigs(configs);

    expect(feature.providers).toHaveLength(1);
    const provider = feature.providers[0] as { provide: unknown; useValue: unknown };
    expect(provider.provide).toBe(WORKER_HTTP_CONFIGS_TOKEN);
    expect(provider.useValue).toStrictEqual(configs);
  });

  it('handles empty config array', () => {
    const feature = withWorkerConfigs([]);
    const provider = feature.providers[0] as { useValue: unknown };
    expect(provider.useValue).toEqual([]);
  });
});

describe('withWorkerRoutes', () => {
  it('returns kind WorkerRoutes', () => {
    const feature = withWorkerRoutes([]);
    expect(feature.kind).toBe('WorkerRoutes');
  });

  it('provides WORKER_HTTP_ROUTES_TOKEN with the given routes', () => {
    const routes = [{ pattern: /\/api\//, worker: 'public', priority: 1 }];
    const feature = withWorkerRoutes(routes);

    const provider = feature.providers[0] as { provide: unknown; useValue: unknown };
    expect(provider.provide).toBe(WORKER_HTTP_ROUTES_TOKEN);
    expect(provider.useValue).toStrictEqual(routes);
  });
});

describe('withWorkerFallback', () => {
  it('returns kind WorkerFallback', () => {
    const feature = withWorkerFallback('main-thread');
    expect(feature.kind).toBe('WorkerFallback');
  });

  it('provides WORKER_HTTP_FALLBACK_TOKEN with strategy main-thread', () => {
    const feature = withWorkerFallback('main-thread');
    const provider = feature.providers[0] as { provide: unknown; useValue: unknown };
    expect(provider.provide).toBe(WORKER_HTTP_FALLBACK_TOKEN);
    expect(provider.useValue).toBe('main-thread');
  });

  it('provides WORKER_HTTP_FALLBACK_TOKEN with strategy error', () => {
    const feature = withWorkerFallback('error');
    const provider = feature.providers[0] as { provide: unknown; useValue: unknown };
    expect(provider.useValue).toBe('error');
  });
});

describe('withWorkerSerialization', () => {
  const mockSerializer: WorkerSerializer = {
    serialize: (value) => ({ data: JSON.stringify(value), transferables: [], format: 'custom' }),
    deserialize: (payload) => JSON.parse(payload.data as string),
  };

  it('returns kind WorkerSerialization', () => {
    const feature = withWorkerSerialization(mockSerializer);
    expect(feature.kind).toBe('WorkerSerialization');
  });

  it('provides WORKER_HTTP_SERIALIZER_TOKEN with the given serializer', () => {
    const feature = withWorkerSerialization(mockSerializer);
    const provider = feature.providers[0] as { provide: unknown; useValue: unknown };
    expect(provider.provide).toBe(WORKER_HTTP_SERIALIZER_TOKEN);
    expect(provider.useValue).toBe(mockSerializer);
  });

  it('has exactly one provider', () => {
    const feature = withWorkerSerialization(mockSerializer);
    expect(feature.providers).toHaveLength(1);
  });
});

describe('withWorkerInterceptors', () => {
  const specs: WorkerInterceptorSpec[] = [
    { kind: 'logging' },
    { kind: 'retry', config: { maxRetries: 3 } },
  ];

  it('returns kind WorkerInterceptors', () => {
    const feature = withWorkerInterceptors(specs);
    expect(feature.kind).toBe('WorkerInterceptors');
  });

  it('wraps an array as a wildcard map', () => {
    const feature = withWorkerInterceptors(specs);
    const provider = feature.providers[0] as {
      provide: unknown;
      useValue: WorkerInterceptorSpecsMap;
    };
    expect(provider.provide).toBe(WORKER_HTTP_INTERCEPTORS_TOKEN);
    expect(provider.useValue).toStrictEqual({ '*': specs });
  });

  it('passes a per-worker map through unchanged', () => {
    const map: WorkerInterceptorSpecsMap = {
      '*': [{ kind: 'logging' }],
      secure: [{ kind: 'retry' }],
    };
    const feature = withWorkerInterceptors(map);
    const provider = feature.providers[0] as { useValue: WorkerInterceptorSpecsMap };
    expect(provider.useValue).toBe(map);
  });

  it('handles empty arrays', () => {
    const feature = withWorkerInterceptors([]);
    const provider = feature.providers[0] as { useValue: WorkerInterceptorSpecsMap };
    expect(provider.useValue).toStrictEqual({ '*': [] });
  });
});

describe('withWorkerStreamsPolyfill', () => {
  it('returns kind StreamsPolyfill', () => {
    const feature = withWorkerStreamsPolyfill();
    expect(feature.kind).toBe('StreamsPolyfill');
  });

  it('provides WORKER_HTTP_STREAMS_POLYFILL_TOKEN with true', () => {
    const feature = withWorkerStreamsPolyfill();
    expect(feature.providers).toHaveLength(1);
    const provider = feature.providers[0] as { provide: unknown; useValue: unknown };
    expect(provider.provide).toBe(WORKER_HTTP_STREAMS_POLYFILL_TOKEN);
    expect(provider.useValue).toBe(true);
  });
});
