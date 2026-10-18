import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { bufferToHex, hexToBytes, toArrayBuffer } from '@angular-helpers/core/utils';

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export type HmacAlgorithm = 'HMAC-SHA-256' | 'HMAC-SHA-384' | 'HMAC-SHA-512';

export type AesKeyLength = 128 | 192 | 256;

export interface AesEncryptResult {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

@Injectable()
export class WebCryptoService {
  private readonly platformId = inject(PLATFORM_ID);

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'crypto' in window && 'subtle' in crypto;
  }

  private get subtle(): SubtleCrypto {
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported in this environment');
    }
    return crypto.subtle;
  }

  private ensureSecureContext(): void {
    if (!window.isSecureContext) {
      throw new Error('Web Crypto API requires a secure context (HTTPS)');
    }
  }

  async hash(data: string | ArrayBuffer, algorithm: HashAlgorithm = 'SHA-256'): Promise<string> {
    this.ensureSecureContext();

    const hashBuffer = await this.subtle.digest(algorithm, toArrayBuffer(data));
    return bufferToHex(hashBuffer);
  }

  async generateAesKey(length: AesKeyLength = 256): Promise<CryptoKey> {
    this.ensureSecureContext();
    return this.subtle.generateKey({ name: 'AES-GCM', length }, true, ['encrypt', 'decrypt']);
  }

  async encryptAes(key: CryptoKey, data: string | ArrayBuffer): Promise<AesEncryptResult> {
    this.ensureSecureContext();

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await this.subtle.encrypt({ name: 'AES-GCM', iv }, key, toArrayBuffer(data));

    return { ciphertext, iv };
  }

  async decryptAes(
    key: CryptoKey,
    ciphertext: ArrayBuffer,
    iv: Uint8Array<ArrayBuffer>,
  ): Promise<string> {
    this.ensureSecureContext();
    const decrypted = await this.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(decrypted);
  }

  async exportKey(key: CryptoKey): Promise<JsonWebKey> {
    this.ensureSecureContext();
    return this.subtle.exportKey('jwk', key);
  }

  async importAesKey(jwk: JsonWebKey): Promise<CryptoKey> {
    this.ensureSecureContext();
    return this.subtle.importKey('jwk', jwk, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }

  generateRandomBytes(length: number): Uint8Array {
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported');
    }
    return crypto.getRandomValues(new Uint8Array(length));
  }

  randomUUID(): string {
    if (!this.isSupported()) {
      throw new Error('Web Crypto API not supported');
    }
    return crypto.randomUUID();
  }

  async generateHmacKey(algorithm: HmacAlgorithm = 'HMAC-SHA-256'): Promise<CryptoKey> {
    this.ensureSecureContext();
    return this.subtle.generateKey(
      { name: 'HMAC', hash: { name: this.hmacHashName(algorithm) } },
      true,
      ['sign', 'verify'],
    );
  }

  /**
   * Signs data with an HMAC key. Returns a hex-encoded signature.
   */
  async sign(key: CryptoKey, data: string | ArrayBuffer): Promise<string> {
    this.ensureSecureContext();
    const signature = await this.subtle.sign('HMAC', key, toArrayBuffer(data));
    return bufferToHex(signature);
  }

  /**
   * Verifies an HMAC signature (hex-encoded). Returns false for malformed input — never throws.
   */
  async verify(key: CryptoKey, data: string | ArrayBuffer, signature: string): Promise<boolean> {
    this.ensureSecureContext();

    let sigBytes: Uint8Array<ArrayBuffer>;
    try {
      sigBytes = hexToBytes(signature);
    } catch {
      return false;
    }

    try {
      return await this.subtle.verify('HMAC', key, sigBytes, toArrayBuffer(data));
    } catch {
      return false;
    }
  }

  async importHmacKey(
    jwk: JsonWebKey,
    algorithm: HmacAlgorithm = 'HMAC-SHA-256',
  ): Promise<CryptoKey> {
    this.ensureSecureContext();
    return this.subtle.importKey(
      'jwk',
      jwk,
      { name: 'HMAC', hash: { name: this.hmacHashName(algorithm) } },
      true,
      ['sign', 'verify'],
    );
  }

  private hmacHashName(algorithm: HmacAlgorithm): string {
    return algorithm.replace('HMAC-', '');
  }
}
