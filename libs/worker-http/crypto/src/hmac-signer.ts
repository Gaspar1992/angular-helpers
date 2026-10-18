import { bufferToHex, toArrayBuffer } from '@angular-helpers/core/utils';
import type { HmacSigner, HmacSignerConfig } from './worker-crypto.types';

/**
 * Creates an HMAC signer using the Web Crypto API.
 *
 * Works in both main thread and web workers.
 * Requires a secure context (HTTPS).
 *
 * @example
 * ```typescript
 * const signer = await createHmacSigner({
 *   keyMaterial: new TextEncoder().encode('my-secret-key'),
 *   algorithm: 'SHA-256',
 * });
 *
 * const signature = await signer.signHex('request-payload');
 * const isValid = await signer.verify('request-payload', signatureBuffer);
 * ```
 */
export async function createHmacSigner(config: HmacSignerConfig): Promise<HmacSigner> {
  const algorithm = config.algorithm ?? 'SHA-256';
  const keyMaterial =
    config.keyMaterial instanceof Uint8Array
      ? new Uint8Array(config.keyMaterial.buffer.slice(0))
      : new Uint8Array(config.keyMaterial);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial as Uint8Array<ArrayBuffer>,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign', 'verify'],
  );

  return {
    async sign(data: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
      return crypto.subtle.sign('HMAC', cryptoKey, toArrayBuffer(data));
    },

    async signHex(data: string | ArrayBuffer | Uint8Array): Promise<string> {
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, toArrayBuffer(data));
      return bufferToHex(signature);
    },

    async verify(
      data: string | ArrayBuffer | Uint8Array,
      signature: ArrayBuffer,
    ): Promise<boolean> {
      return crypto.subtle.verify('HMAC', cryptoKey, signature, toArrayBuffer(data));
    },
  };
}
