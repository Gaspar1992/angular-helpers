import { bufferToHex, toArrayBuffer } from '@angular-helpers/core/utils';
import type { ContentHasher, HashAlgorithm } from './worker-crypto.types';

/**
 * Creates a content hasher using the Web Crypto API.
 *
 * Works in both main thread and web workers.
 * Useful for content integrity verification (e.g., response body hashing).
 *
 * @example
 * ```typescript
 * const hasher = createContentHasher('SHA-256');
 * const hex = await hasher.hashHex('response-body-content');
 * ```
 */
export function createContentHasher(algorithm: HashAlgorithm = 'SHA-256'): ContentHasher {
  return {
    async hash(data: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
      return crypto.subtle.digest(algorithm, toArrayBuffer(data));
    },

    async hashHex(data: string | ArrayBuffer | Uint8Array): Promise<string> {
      const hash = await crypto.subtle.digest(algorithm, toArrayBuffer(data));
      return bufferToHex(hash);
    },
  };
}
