import type {
  RetryConfig,
  SerializableRequest,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

function parseRetryAfterMs(headerValue: string): number {
  const seconds = parseFloat(headerValue);
  if (!isNaN(seconds)) {
    return Math.max(0, seconds * 1000);
  }
  const date = new Date(headerValue).getTime();
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  return 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a retry interceptor with exponential backoff.
 *
 * Retries requests that fail with specific HTTP status codes.
 * Respects the `Retry-After` response header when present.
 *
 * @example
 * ```typescript
 * createWorkerPipeline([
 *   retryInterceptor({ maxRetries: 3, initialDelay: 500 }),
 * ]);
 * ```
 */
export function retryInterceptor(config?: RetryConfig): WorkerInterceptorFn {
  const maxRetries = config?.maxRetries ?? 3;
  const initialDelay = config?.initialDelay ?? 1000;
  const backoffMultiplier = config?.backoffMultiplier ?? 2;
  const retryStatusCodes = config?.retryStatusCodes ?? [408, 429, 500, 502, 503, 504];
  const retryOnNetworkError = config?.retryOnNetworkError ?? true;

  return async (req: SerializableRequest, next) => {
    let attempt = 0;

    while (true) {
      try {
        const response = await next(req);

        if (maxRetries > 0 && retryStatusCodes.includes(response.status)) {
          if (attempt < maxRetries) {
            const retryAfterHeader =
              response.headers['retry-after']?.[0] ?? response.headers['Retry-After']?.[0];

            const waitMs = retryAfterHeader
              ? parseRetryAfterMs(retryAfterHeader)
              : initialDelay * Math.pow(backoffMultiplier, attempt);

            await delay(waitMs);
            attempt++;
            continue;
          }

          throw Object.assign(
            new Error(
              `Max retries exceeded after ${maxRetries} attempt(s) (status: ${response.status})`,
            ),
            { status: response.status },
          );
        }

        return response;
      } catch (error) {
        if (retryOnNetworkError && attempt < maxRetries) {
          const waitMs = initialDelay * Math.pow(backoffMultiplier, attempt);
          await delay(waitMs);
          attempt++;
          continue;
        }

        throw error;
      }
    }
  };
}
