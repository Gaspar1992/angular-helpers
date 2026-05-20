const ENCRYPTION_SALT = new Uint8Array([7, 21, 14, 9, 3, 18, 5, 12, 1, 20, 16, 2, 8, 15, 6, 11]);

function getCrypto(): Crypto | null {
  if (typeof crypto !== 'undefined') return crypto;
  if (typeof window !== 'undefined' && window.crypto) return window.crypto;
  return null;
}

async function getCryptoKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

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
      salt: ENCRYPTION_SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypts text using AES-GCM with a PBKDF2 derived key.
 */
export async function encrypt(text: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await getCryptoKey(secret);
  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const iv = cryptoContext.getRandomValues(new Uint8Array(12));
  const encrypted = await cryptoContext.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text),
  );

  const cipherBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + cipherBytes.length);
  combined.set(iv, 0);
  combined.set(cipherBytes, iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts text using AES-GCM with a PBKDF2 derived key.
 */
export async function decrypt(base64: string, secret: string): Promise<string> {
  const dec = new TextDecoder();
  const key = await getCryptoKey(secret);

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  const cryptoContext = getCrypto();
  if (!cryptoContext) {
    throw new Error('WebCrypto API is not supported in this environment');
  }

  const decrypted = await cryptoContext.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return dec.decode(decrypted);
}
