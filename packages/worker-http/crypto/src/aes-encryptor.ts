import type { AesEncryptor, AesEncryptorConfig, EncryptedPayload } from './worker-crypto.types';

function toArrayBuffer(data: string | ArrayBuffer | Uint8Array): ArrayBuffer {
  if (typeof data === 'string') {
    return new TextEncoder().encode(data).buffer as ArrayBuffer;
  }
  if (data instanceof Uint8Array) {
    return data.buffer as ArrayBuffer;
  }
  return data;
}

/**
 * Creates an AES encryptor using the Web Crypto API.
 *
 * Works in both main thread and web workers.
 * Requires a secure context (HTTPS).
 *
 * @example
 * ```typescript
 * const encryptor = await createAesEncryptor({
 *   keyMaterial: new TextEncoder().encode('32-byte-secret-key-for-aes-256!'),
 *   algorithm: 'AES-GCM',
 * });
 *
 * const encrypted = await encryptor.encrypt('sensitive data');
 * const decrypted = await encryptor.decrypt(encrypted);
 * ```
 */
export async function createAesEncryptor(config: AesEncryptorConfig): Promise<AesEncryptor> {
  const algorithm = config.algorithm ?? 'AES-GCM';
  const keyLength = config.keyLength ?? 256;
  const keyMaterial =
    config.keyMaterial instanceof Uint8Array
      ? new Uint8Array(config.keyMaterial.buffer.slice(0))
      : new Uint8Array(config.keyMaterial);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyMaterial as Uint8Array<ArrayBuffer>,
    { name: algorithm, length: keyLength },
    false,
    ['encrypt', 'decrypt'],
  );

  return {
    async encrypt(data: string | ArrayBuffer | Uint8Array): Promise<EncryptedPayload> {
      const iv = crypto.getRandomValues(new Uint8Array(12)) as Uint8Array<ArrayBuffer>;

      const params =
        algorithm === 'AES-GCM'
          ? ({ name: algorithm, iv } satisfies AesGcmParams)
          : algorithm === 'AES-CBC'
            ? ({ name: algorithm, iv } satisfies AesCbcParams)
            : ({ name: algorithm, counter: iv, length: 64 } satisfies AesCtrParams);

      const ciphertext = await crypto.subtle.encrypt(params, cryptoKey, toArrayBuffer(data));

      return { ciphertext, iv, algorithm };
    },

    async decrypt(payload: EncryptedPayload): Promise<ArrayBuffer> {
      const iv = payload.iv as Uint8Array<ArrayBuffer>;
      const params =
        payload.algorithm === 'AES-GCM'
          ? ({ name: payload.algorithm, iv } satisfies AesGcmParams)
          : payload.algorithm === 'AES-CBC'
            ? ({ name: payload.algorithm, iv } satisfies AesCbcParams)
            : ({ name: payload.algorithm, counter: iv, length: 64 } satisfies AesCtrParams);

      return crypto.subtle.decrypt(params, cryptoKey, payload.ciphertext);
    },
  };
}
