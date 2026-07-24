import type { ContentHasher, HashAlgorithm } from './worker-crypto.types';

function toArrayBuffer(data: string | ArrayBuffer | Uint8Array): ArrayBuffer {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data).buffer as ArrayBuffer;
  }
  if (data instanceof Uint8Array) {
    return data.buffer as ArrayBuffer;
  }
  return data;
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

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
      return arrayBufferToHex(hash);
    },
  };
}
