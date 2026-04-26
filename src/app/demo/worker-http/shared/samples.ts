import type { WorkerRoute } from '@angular-helpers/worker-http/backend';
import type { SerializerSample } from './models';

export const ECHO_WORKER_URL = 'assets/workers/echo.worker.js';
export const HTTP_API_WORKER_URL = 'assets/workers/http-api.worker.js';

export const DEMO_ROUTES: readonly WorkerRoute[] = [
  { pattern: /\/api\/secure\//, worker: 'secure', priority: 10 },
  { pattern: /\/api\//, worker: 'api', priority: 5 },
  { pattern: '/public/', worker: 'cdn', priority: 1 },
];

export const ROUTING_TEST_URLS: readonly string[] = [
  '/api/users',
  '/api/secure/payments',
  '/public/images/logo.png',
  '/other/path',
];

export const SERIALIZER_SAMPLES: readonly SerializerSample[] = [
  {
    id: 'small',
    label: 'Small object',
    description: 'Single user — overhead not justified for TOON',
    build: () => ({ id: 1, name: 'Alice', role: 'admin' }),
  },
  {
    id: 'uniform',
    label: 'Uniform array (50 users)',
    description: "Identical keys, primitive values — TOON's sweet spot",
    build: () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `user-${i + 1}`,
        role: i % 3 === 0 ? 'admin' : 'member',
        active: i % 2 === 0,
      })),
  },
  {
    id: 'mixed',
    label: 'Mixed payload (with Date)',
    description: '`Date` at depth-1 — routed to seroval',
    build: () => ({
      users: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `u${i + 1}` })),
      fetchedAt: new Date('2026-04-26T09:00:00Z'),
    }),
  },
];

export const FETCH_COMPARE_URL = 'https://jsonplaceholder.typicode.com/users';
export const CPU_BURN_DURATION_MS = 1500;
