import { describe, it, expect, vi, afterEach } from 'vitest';
import { bytesToBase64 } from '@angular-helpers/core/utils';
import { encrypt, decrypt, LEGACY_ENCRYPTION_SALT } from '@angular-helpers/storage/worker';

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
    expect(cipherText.startsWith('v2:')).toBe(true);

    const decrypted = await decrypt(cipherText, secret);
    expect(decrypted).toBe(plainText);
  });

  it('should decrypt legacy unprefixed ciphertexts encrypted with LEGACY_ENCRYPTION_SALT', async () => {
    const plainText = 'Legacy stored payload';
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, [
      'deriveKey',
    ]);
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: LEGACY_ENCRYPTION_SALT,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(plainText),
    );
    const cipherBytes = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + cipherBytes.length);
    combined.set(iv, 0);
    combined.set(cipherBytes, iv.length);
    const legacyBase64 = bytesToBase64(combined);

    expect(legacyBase64.startsWith('v2:')).toBe(false);
    const decrypted = await decrypt(legacyBase64, secret);
    expect(decrypted).toBe(plainText);
  });

  it('should cache derived CryptoKey when decrypting the same salt and passphrase repeatedly', async () => {
    const uniqueSecret = 'cached-key-test-passphrase-xyz';
    const cipherText = await encrypt('Repeated read test', uniqueSecret);
    const deriveKeySpy = vi.spyOn(crypto.subtle, 'deriveKey');

    try {
      const first = await decrypt(cipherText, uniqueSecret);
      const second = await decrypt(cipherText, uniqueSecret);

      expect(first).toBe('Repeated read test');
      expect(second).toBe('Repeated read test');
      expect(deriveKeySpy).not.toHaveBeenCalled();
    } finally {
      deriveKeySpy.mockRestore();
    }
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

  it('should encrypt and decrypt payloads larger than 100 KB without stack overflow', async () => {
    const largeText = 'A'.repeat(120_000);
    const cipherText = await encrypt(largeText, secret);
    const decrypted = await decrypt(cipherText, secret);
    expect(decrypted.length).toBe(120_000);
    expect(decrypted).toBe(largeText);
  });
});
