import { base64ToBytes, bytesToBase64 } from '@angular-helpers/core/utils';

export const LEGACY_ENCRYPTION_SALT = new Uint8Array([
  7, 21, 14, 9, 3, 18, 5, 12, 1, 20, 16, 2, 8, 15, 6, 11,
]);
const V2_PREFIX = 'v2:';
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;
export const PBKDF2_ITERATIONS = 600_000;
const LEGACY_PBKDF2_ITERATIONS = 100_000;
const MAX_KEY_CACHE_SIZE = 64;

const keyCache = new Map<string, Promise<CryptoKey>>();

function getCrypto(): Crypto | null {
  if (typeof crypto !== 'undefined') return crypto;
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  if (typeof self !== 'undefined' && self.crypto) return self.crypto;
  return null;
}

async function computeCacheKey(
  cryptoContext: Crypto,
  password: string,
  salt: Uint8Array,
): Promise<string> {
  const enc = new TextEncoder();
  const pwBytes = enc.encode(password);
  const combined = new Uint8Array(pwBytes.length + salt.length);
  combined.set(pwBytes, 0);
  combined.set(salt, pwBytes.length);
  const digest = await cryptoContext.subtle.digest('SHA-256', combined);
  return bytesToBase64(digest);
}

async function deriveCryptoKey(
  cryptoContext: Crypto,
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await cryptoContext.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return cryptoContext.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as Uint8Array<ArrayBuffer>,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function getCryptoKey(
  password: string,
  salt: Uint8Array = LEGACY_ENCRYPTION_SALT,
  useCache = true,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  if (!useCache) {
    return deriveCryptoKey(cryptoContext, password, salt, iterations);
  }

  const cacheKey = `${iterations}:${await computeCacheKey(cryptoContext, password, salt)}`;
  const cached = keyCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (keyCache.size >= MAX_KEY_CACHE_SIZE) {
    const oldestKey = keyCache.keys().next().value;
    if (oldestKey !== undefined) {
      keyCache.delete(oldestKey);
    }
  }

  const keyPromise = deriveCryptoKey(cryptoContext, password, salt, iterations).catch((err) => {
    keyCache.delete(cacheKey);
    throw err;
  });

  keyCache.set(cacheKey, keyPromise);
  return keyPromise;
}

/**
 * Encrypts text using AES-GCM with a PBKDF2 derived key and per-message random salt.
 */
export async function encrypt(text: string, secret: string): Promise<string> {
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const enc = new TextEncoder();
  const salt = cryptoContext.getRandomValues(new Uint8Array(SALT_BYTE_LENGTH));
  const iv = cryptoContext.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  // Fresh per-message salt never hits cache; skip keyCache to avoid evicting decrypt keys
  const key = await getCryptoKey(secret, salt, false);

  const encrypted = await cryptoContext.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text),
  );

  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipherBytes, salt.length + iv.length);

  return `${V2_PREFIX}${bytesToBase64(combined)}`;
}

/**
 * Decrypts text using AES-GCM with a PBKDF2 derived key.
 * Supports both `v2:` per-message salted ciphertexts and legacy unprefixed ciphertexts.
 */
export async function decrypt(encoded: string, secret: string): Promise<string> {
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const dec = new TextDecoder();
  let salt: Uint8Array;
  let iv: Uint8Array;
  let ciphertext: Uint8Array;

  let iterations = PBKDF2_ITERATIONS;

  if (encoded.startsWith(V2_PREFIX)) {
    const bytes = base64ToBytes(encoded.slice(V2_PREFIX.length));
    salt = bytes.slice(0, SALT_BYTE_LENGTH);
    iv = bytes.slice(SALT_BYTE_LENGTH, SALT_BYTE_LENGTH + IV_BYTE_LENGTH);
    ciphertext = bytes.slice(SALT_BYTE_LENGTH + IV_BYTE_LENGTH);
  } else {
    const bytes = base64ToBytes(encoded);
    salt = LEGACY_ENCRYPTION_SALT;
    iv = bytes.slice(0, IV_BYTE_LENGTH);
    ciphertext = bytes.slice(IV_BYTE_LENGTH);
    iterations = LEGACY_PBKDF2_ITERATIONS;
  }

  const key = await getCryptoKey(secret, salt, true, iterations);
  const decrypted = await cryptoContext.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as Uint8Array<ArrayBuffer> },
    key,
    ciphertext as Uint8Array<ArrayBuffer>,
  );
  return dec.decode(decrypted);
}
