import type {
  HmacInterceptorConfig,
  SerializableRequest,
  WorkerInterceptorFn,
} from './worker-interceptor.types';

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function defaultPayloadBuilder(req: SerializableRequest): string {
  const body = req.body != null ? JSON.stringify(req.body) : '';
  return `${req.method}:${req.url}:${body}`;
}

/**
 * Creates an HMAC signing interceptor that adds a signature header to outgoing requests.
 *
 * Uses WebCrypto `SubtleCrypto` (native in web workers). The `CryptoKey` is
 * imported lazily on the first request and reused for all subsequent requests
 * in the same factory instance.
 *
 * @example
 * ```typescript
 * createWorkerPipeline([
 *   hmacSigningInterceptor({
 *     keyMaterial: new TextEncoder().encode('my-secret-key'),
 *     algorithm: 'SHA-256',
 *     headerName: 'X-HMAC-Signature',
 *   }),
 * ]);
 * ```
 */
export function hmacSigningInterceptor(config: HmacInterceptorConfig): WorkerInterceptorFn {
  const algorithm = config.algorithm ?? 'SHA-256';
  const headerName = config.headerName ?? 'X-HMAC-Signature';
  const payloadBuilder = config.payloadBuilder ?? defaultPayloadBuilder;

  let cryptoKeyPromise: Promise<CryptoKey> | null = null;

  function getCryptoKey(): Promise<CryptoKey> {
    if (!cryptoKeyPromise) {
      const keyMaterial =
        config.keyMaterial instanceof Uint8Array
          ? (config.keyMaterial as Uint8Array<ArrayBuffer>)
          : new Uint8Array(config.keyMaterial);

      cryptoKeyPromise = crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign'],
      );
    }
    return cryptoKeyPromise;
  }

  return async (req: SerializableRequest, next) => {
    const key = await getCryptoKey();
    const payload = payloadBuilder(req);
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(payload),
    );
    const signatureHex = arrayBufferToHex(signatureBuffer);

    const signedReq: SerializableRequest = {
      ...req,
      headers: {
        ...req.headers,
        [headerName]: [signatureHex],
      },
    };

    return next(signedReq);
  };
}
