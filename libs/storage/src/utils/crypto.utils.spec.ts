import { describe, it, expect, vi, afterEach } from 'vitest';
import { encrypt, decrypt } from './crypto.utils';

describe('crypto.utils', () => {
  const secret = 'super-secure-passphrase-123!';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should encrypt and decrypt a simple string', async () => {
    const plainText = 'Hello, Angular World!';
    const cipherText = await encrypt(plainText, secret);

    expect(typeof cipherText).toBe('string');
    expect(cipherText).not.toBe(plainText);

    const decrypted = await decrypt(cipherText, secret);
    expect(decrypted).toBe(plainText);
  });

  it('should encrypt and decrypt JSON data strings and unicode', async () => {
    const complexData = JSON.stringify({
      user: 'Nicolás 🚀',
      tags: ['ñandú', 'über', '日本語'],
      count: 42,
    });

    const cipherText = await encrypt(complexData, secret);
    const decrypted = await decrypt(cipherText, secret);

    expect(decrypted).toBe(complexData);
    expect(JSON.parse(decrypted)).toEqual({
      user: 'Nicolás 🚀',
      tags: ['ñandú', 'über', '日本語'],
      count: 42,
    });
  });

  it('should produce different ciphertexts for the same plaintext due to random IV', async () => {
    const text = 'Identical input text';
    const cipher1 = await encrypt(text, secret);
    const cipher2 = await encrypt(text, secret);

    expect(cipher1).not.toBe(cipher2);

    expect(await decrypt(cipher1, secret)).toBe(text);
    expect(await decrypt(cipher2, secret)).toBe(text);
  });

  it('should fail to decrypt when given the wrong secret', async () => {
    const plainText = 'Top Secret Data';
    const cipherText = await encrypt(plainText, secret);

    await expect(decrypt(cipherText, 'wrong-secret-key')).rejects.toThrow();
  });

  it('should fail to decrypt when given corrupted ciphertext', async () => {
    const plainText = 'Another secret';
    const cipherText = await encrypt(plainText, secret);

    // Corrupt base64 string
    const corrupted = cipherText.substring(0, cipherText.length - 6) + 'AAAA==';
    await expect(decrypt(corrupted, secret)).rejects.toThrow();
  });

  it('should throw error when WebCrypto API is not supported in environment', async () => {
    const origCrypto = window.crypto;
    try {
      Object.defineProperty(window, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'crypto', {
        value: undefined,
        configurable: true,
        writable: true,
      });
      if (typeof self !== 'undefined') {
        Object.defineProperty(self, 'crypto', {
          value: undefined,
          configurable: true,
          writable: true,
        });
      }

      await expect(encrypt('test', secret)).rejects.toThrow(
        'WebCrypto API is not supported in this environment',
      );
      await expect(decrypt('dGVzdA==', secret)).rejects.toThrow(
        'WebCrypto API is not supported in this environment',
      );
    } finally {
      Object.defineProperty(window, 'crypto', {
        value: origCrypto,
        configurable: true,
        writable: true,
      });
      Object.defineProperty(globalThis, 'crypto', {
        value: origCrypto,
        configurable: true,
        writable: true,
      });
      if (typeof self !== 'undefined') {
        Object.defineProperty(self, 'crypto', {
          value: origCrypto,
          configurable: true,
          writable: true,
        });
      }
    }
  });
});
