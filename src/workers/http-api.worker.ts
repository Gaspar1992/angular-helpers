/// <reference lib="webworker" />

import { createWorkerPipeline } from '@angular-helpers/worker-http/interceptors';
import {
  loggingInterceptor,
  retryInterceptor,
  cacheInterceptor,
} from '@angular-helpers/worker-http/interceptors';

createWorkerPipeline([
  loggingInterceptor(),
  retryInterceptor({ maxRetries: 2, initialDelay: 500 }),
  cacheInterceptor({ ttl: 30000, maxEntries: 50 }),
]);
