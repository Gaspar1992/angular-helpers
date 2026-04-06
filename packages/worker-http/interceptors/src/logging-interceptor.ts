import type {
  LoggingConfig,
  SerializableRequest,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

/**
 * Creates a logging interceptor that logs request and response details.
 *
 * Uses `console.log` by default. A custom logger can be provided via config.
 * Logger exceptions are swallowed — a logging failure never interrupts the pipeline.
 *
 * @example
 * ```typescript
 * createWorkerPipeline([
 *   loggingInterceptor({ includeHeaders: true }),
 * ]);
 * ```
 */
export function loggingInterceptor(config?: LoggingConfig): WorkerInterceptorFn {
  const logger = config?.logger ?? ((msg: string, data?: unknown) => console.log(msg, data));
  const includeHeaders = config?.includeHeaders ?? false;

  function safeLog(message: string, data?: unknown): void {
    try {
      logger(message, data);
    } catch {
      // swallow — logger must never break the pipeline
    }
  }

  return async (req: SerializableRequest, next) => {
    const startMs = Date.now();

    safeLog(
      `[worker] → ${req.method} ${req.url}`,
      includeHeaders ? { headers: req.headers } : undefined,
    );

    try {
      const response = await next(req);
      const elapsedMs = Date.now() - startMs;

      safeLog(
        `[worker] ← ${response.status} ${req.url} (${elapsedMs}ms)`,
        includeHeaders ? { headers: response.headers } : undefined,
      );

      return response;
    } catch (error) {
      const elapsedMs = Date.now() - startMs;
      const status = (error as { status?: number }).status;
      const label = status != null ? String(status) : 'NETWORK_ERROR';

      safeLog(`[worker] ✕ ${label} ${req.url} (${elapsedMs}ms)`, error);

      throw error;
    }
  };
}
