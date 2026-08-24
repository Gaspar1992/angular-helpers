import '@angular/compiler';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { webcrypto } from 'node:crypto';
import { WebCryptoService } from './web-crypto.service';

describe('WebCryptoService', () => {
  let service: WebCryptoService;

  beforeAll(() => {
    vi.stubGlobal('crypto', webcrypto);
    (window as any).isSecureContext = true;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WebCryptoService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(WebCryptoService);
  });

  describe('isSupported', () => {
    it('returns true when in browser environment with crypto.subtle', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('returns false when in server environment (SSR)', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebCryptoService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(WebCryptoService);
      expect(ssrService.isSupported()).toBe(false);
    });
  });

  describe('hashing', () => {
    it('hashes string with default SHA-256', async () => {
      const hash = await service.hash('hello world');
      expect(typeof hash).toBe('string');
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('hashes ArrayBuffer data', async () => {
      const buffer = new TextEncoder().encode('hello world').buffer;
      const hash = await service.hash(buffer, 'SHA-256');
      expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('supports SHA-1, SHA-384, and SHA-512 algorithms', async () => {
      const sha1 = await service.hash('test', 'SHA-1');
      const sha384 = await service.hash('test', 'SHA-384');
      const sha512 = await service.hash('test', 'SHA-512');

      expect(sha1.length).toBe(40);
      expect(sha384.length).toBe(96);
      expect(sha512.length).toBe(128);
    });
  });

  describe('AES-GCM encryption & decryption', () => {
    it('generates AES keys with lengths 128, 192, and 256', async () => {
      const key128 = await service.generateAesKey(128);
      const key192 = await service.generateAesKey(192);
      const key256 = await service.generateAesKey(256);

      expect(key128.algorithm.name).toBe('AES-GCM');
      expect(key192.algorithm.name).toBe('AES-GCM');
      expect(key256.algorithm.name).toBe('AES-GCM');
    });

    it('encrypts and decrypts string data roundtrip', async () => {
      const key = await service.generateAesKey();
      const plaintext = 'Super secret payload! 🔒';

      const { ciphertext, iv } = await service.encryptAes(key, plaintext);
      expect(ciphertext.byteLength).toBeGreaterThan(0);
      expect(iv.length).toBe(12);

      const decrypted = await service.decryptAes(key, ciphertext, iv);
      expect(decrypted).toBe(plaintext);
    });

    it('encrypts and decrypts ArrayBuffer data', async () => {
      const key = await service.generateAesKey();
      const raw = new TextEncoder().encode('binary message');

      const { ciphertext, iv } = await service.encryptAes(key, raw.buffer);
      const decrypted = await service.decryptAes(key, ciphertext, iv);
      expect(decrypted).toBe('binary message');
    });

    it('exports and imports AES keys via JWK', async () => {
      const originalKey = await service.generateAesKey();
      const jwk = await service.exportKey(originalKey);
      expect(jwk.kty).toBe('oct');

      const importedKey = await service.importAesKey(jwk);
      const plaintext = 'test import/export';
      const encrypted = await service.encryptAes(importedKey, plaintext);
      const decrypted = await service.decryptAes(originalKey, encrypted.ciphertext, encrypted.iv);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('HMAC signing & verification', () => {
    it('generates HMAC keys with different algorithms', async () => {
      const key256 = await service.generateHmacKey('HMAC-SHA-256');
      const key384 = await service.generateHmacKey('HMAC-SHA-384');
      const key512 = await service.generateHmacKey('HMAC-SHA-512');

      expect(key256.algorithm.name).toBe('HMAC');
      expect(key384.algorithm.name).toBe('HMAC');
      expect(key512.algorithm.name).toBe('HMAC');
    });

    it('signs and verifies data with HMAC key', async () => {
      const key = await service.generateHmacKey('HMAC-SHA-256');
      const data = 'important document';

      const signature = await service.sign(key, data);
      expect(typeof signature).toBe('string');

      const isValid = await service.verify(key, data, signature);
      expect(isValid).toBe(true);

      const isTamperedData = await service.verify(key, 'tampered document', signature);
      expect(isTamperedData).toBe(false);
    });

    it('signs ArrayBuffer data', async () => {
      const key = await service.generateHmacKey('HMAC-SHA-256');
      const buffer = new TextEncoder().encode('buffer message').buffer;

      const signature = await service.sign(key, buffer);
      const isValid = await service.verify(key, buffer, signature);
      expect(isValid).toBe(true);
    });

    it('returns false on invalid hex or corrupted signature without throwing', async () => {
      const key = await service.generateHmacKey('HMAC-SHA-256');
      expect(await service.verify(key, 'data', 'abc')).toBe(false);
      expect(await service.verify(key, 'data', 'zzzz')).toBe(false);
      expect(await service.verify(key, 'data', '001122334455')).toBe(false);
    });

    it('imports HMAC key from JWK and verifies signature', async () => {
      const key = await service.generateHmacKey('HMAC-SHA-256');
      const jwk = await service.exportKey(key);

      const importedKey = await service.importHmacKey(jwk, 'HMAC-SHA-256');
      const signature = await service.sign(importedKey, 'hello');
      const valid = await service.verify(key, 'hello', signature);
      expect(valid).toBe(true);
    });

    it('returns false when subtle.verify throws due to invalid key algorithm', async () => {
      const aesKey = await service.generateAesKey();
      const validHexSig = '00112233445566778899aabbccddeeff';
      const valid = await service.verify(aesKey, 'hello', validHexSig);
      expect(valid).toBe(false);
    });
  });

  describe('random utilities', () => {
    it('generates random bytes of given length', () => {
      const bytes = service.generateRandomBytes(32);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('generates valid UUIDs', () => {
      const uuid = service.randomUUID();
      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('throws error when generateRandomBytes or randomUUID called in unsupported environment', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebCryptoService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(WebCryptoService);

      expect(() => ssrService.generateRandomBytes(16)).toThrow('Web Crypto API not supported');
      expect(() => ssrService.randomUUID()).toThrow('Web Crypto API not supported');
    });
  });

  describe('secure context & error handling', () => {
    it('throws when subtle called in unsupported environment', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [WebCryptoService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const ssrService = TestBed.inject(WebCryptoService);

      await expect(ssrService.hash('test')).rejects.toThrow();
    });

    it('throws when not in a secure context', async () => {
      (window as any).isSecureContext = false;
      try {
        await expect(service.hash('test')).rejects.toThrow(
          'Web Crypto API requires a secure context (HTTPS)',
        );
      } finally {
        (window as any).isSecureContext = true;
      }
    });
  });
});
