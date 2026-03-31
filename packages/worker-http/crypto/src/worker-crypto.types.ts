/**
 * Supported HMAC hash algorithms.
 */
export type HmacAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Supported AES algorithms.
 */
export type AesAlgorithm = 'AES-GCM' | 'AES-CBC' | 'AES-CTR';

/**
 * Supported hash algorithms for content integrity.
 */
export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512';

/**
 * Configuration for HMAC signing operations.
 */
export interface HmacSignerConfig {
  /** The raw key material (e.g., a secret string encoded as ArrayBuffer) */
  keyMaterial: ArrayBuffer | Uint8Array;
  /** Hash algorithm to use (default: 'SHA-256') */
  algorithm?: HmacAlgorithm;
}

/**
 * Configuration for AES encryption operations.
 */
export interface AesEncryptorConfig {
  /** The raw key material */
  keyMaterial: ArrayBuffer | Uint8Array;
  /** AES algorithm to use (default: 'AES-GCM') */
  algorithm?: AesAlgorithm;
  /** Key length in bits (default: 256) */
  keyLength?: 128 | 192 | 256;
}

/**
 * Result of an AES encryption operation.
 */
export interface EncryptedPayload {
  /** The encrypted data */
  ciphertext: ArrayBuffer;
  /** The initialization vector used */
  iv: Uint8Array;
  /** The algorithm used */
  algorithm: AesAlgorithm;
}

/**
 * Interface for HMAC signing and verification.
 */
export interface HmacSigner {
  /** Sign data and return the signature as ArrayBuffer */
  sign(data: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer>;
  /** Sign data and return the signature as hex string */
  signHex(data: string | ArrayBuffer | Uint8Array): Promise<string>;
  /** Verify a signature against data */
  verify(data: string | ArrayBuffer | Uint8Array, signature: ArrayBuffer): Promise<boolean>;
}

/**
 * Interface for AES encryption and decryption.
 */
export interface AesEncryptor {
  /** Encrypt data */
  encrypt(data: string | ArrayBuffer | Uint8Array): Promise<EncryptedPayload>;
  /** Decrypt data */
  decrypt(payload: EncryptedPayload): Promise<ArrayBuffer>;
}

/**
 * Interface for content hashing.
 */
export interface ContentHasher {
  /** Hash data and return as ArrayBuffer */
  hash(data: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer>;
  /** Hash data and return as hex string */
  hashHex(data: string | ArrayBuffer | Uint8Array): Promise<string>;
}
