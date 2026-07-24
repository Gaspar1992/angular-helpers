import type {
  ContentIntegrityConfig,
  SerializableResponse,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hashBody(body: unknown, algorithm: string): Promise<string> {
  let data: ArrayBuffer;

  if (body instanceof ArrayBuffer) {
    data = body;
  } else if (body instanceof Blob) {
    data = await body.arrayBuffer();
  } else {
    const str = typeof body === 'string' ? body : (JSON.stringify(body) ?? '');
    data = new TextEncoder().encode(str).buffer as ArrayBuffer;
  }

  const hash = await crypto.subtle.digest(algorithm, data);
  return arrayBufferToHex(hash);
}

function getHeaderValue(response: SerializableResponse, headerName: string): string | undefined {
  const lower = headerName.toLowerCase();
  return response.headers[lower]?.[0] ?? response.headers[headerName]?.[0];
}

/**
 * Creates a content integrity interceptor that verifies response body integrity
 * against a hash provided in a response header.
 *
 * Uses WebCrypto `SubtleCrypto` (native in web workers).
 *
 * @example
 * ```typescript
 * createWorkerPipeline([
 *   contentIntegrityInterceptor({
 *     algorithm: 'SHA-256',
 *     headerName: 'X-Content-Hash',
 *     requireHash: true,
 *   }),
 * ]);
 * ```
 */
export function contentIntegrityInterceptor(config?: ContentIntegrityConfig): WorkerInterceptorFn {
  const algorithm = config?.algorithm ?? 'SHA-256';
  const headerName = config?.headerName ?? 'X-Content-Hash';
  const requireHash = config?.requireHash ?? false;

  return async (req, next) => {
    const response = await next(req);

    const expectedHash = getHeaderValue(response, headerName);

    if (!expectedHash) {
      if (requireHash) {
        throw Object.assign(
          new Error(`Content integrity header '${headerName}' is required but missing`),
          { status: 0 },
        );
      }
      return response;
    }

    const actualHash = await hashBody(response.body, algorithm);

    if (actualHash !== expectedHash.toLowerCase()) {
      throw Object.assign(new Error('Content integrity check failed'), { status: 0 });
    }

    return response;
  };
}
