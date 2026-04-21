// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { createAesEncryptor } from './aes-encryptor';

const KEY_256 = new Uint8Array(32).fill(7);

describe('createAesEncryptor', () => {
  describe('AES-GCM (default)', () => {
    it('round-trips arbitrary text data encrypt → decrypt', async () => {
      const enc = await createAesEncryptor({ keyMaterial: KEY_256 });
      const payload = await enc.encrypt('hello worker-http');
      const plaintext = new TextDecoder().decode(await enc.decrypt(payload));
      expect(plaintext).toBe('hello worker-http');
    });

    it('produces a fresh 12-byte IV on every encrypt call', async () => {
      const enc = await createAesEncryptor({ keyMaterial: KEY_256 });
      const a = await enc.encrypt('same-data');
      const b = await enc.encrypt('same-data');
      expect(a.iv.byteLength).toBe(12);
      expect(b.iv.byteLength).toBe(12);
      // Extremely improbable to collide. If this ever fails, investigate RNG.
      expect(a.iv.toString()).not.toBe(b.iv.toString());
    });

    it('rejects decryption when the ciphertext has been tampered with', async () => {
      const enc = await createAesEncryptor({ keyMaterial: KEY_256 });
      const payload = await enc.encrypt('top-secret');
      const tampered = new Uint8Array(payload.ciphertext);
      tampered[0] = tampered[0] ^ 0xff;
      await expect(enc.decrypt({ ...payload, ciphertext: tampered.buffer })).rejects.toBeDefined();
    });

    it('encodes algorithm in the payload so decryption works with the same encryptor', async () => {
      const enc = await createAesEncryptor({ keyMaterial: KEY_256, algorithm: 'AES-GCM' });
      const payload = await enc.encrypt('x');
      expect(payload.algorithm).toBe('AES-GCM');
    });
  });

  describe('AES-CBC', () => {
    it('round-trips data with a 16-byte block cipher', async () => {
      const enc = await createAesEncryptor({ keyMaterial: KEY_256, algorithm: 'AES-CBC' });
      const payload = await enc.encrypt('cbc-data');
      const plaintext = new TextDecoder().decode(await enc.decrypt(payload));
      expect(plaintext).toBe('cbc-data');
      expect(payload.algorithm).toBe('AES-CBC');
    });
  });

  describe('AES-CTR', () => {
    it('round-trips data with a counter', async () => {
      const enc = await createAesEncryptor({ keyMaterial: KEY_256, algorithm: 'AES-CTR' });
      const payload = await enc.encrypt('ctr-data');
      const plaintext = new TextDecoder().decode(await enc.decrypt(payload));
      expect(plaintext).toBe('ctr-data');
      expect(payload.algorithm).toBe('AES-CTR');
    });
  });

  it('supports 128 and 192 bit keys in addition to the default 256', async () => {
    const enc128 = await createAesEncryptor({
      keyMaterial: new Uint8Array(16).fill(1),
      keyLength: 128,
    });
    const enc192 = await createAesEncryptor({
      keyMaterial: new Uint8Array(24).fill(1),
      keyLength: 192,
    });
    const p128 = await enc128.encrypt('small');
    const p192 = await enc192.encrypt('medium');
    expect(new TextDecoder().decode(await enc128.decrypt(p128))).toBe('small');
    expect(new TextDecoder().decode(await enc192.decrypt(p192))).toBe('medium');
  });

  it('accepts Uint8Array and string payloads interchangeably', async () => {
    const enc = await createAesEncryptor({ keyMaterial: KEY_256 });
    const bytes = new TextEncoder().encode('same-input');
    const fromString = await enc.encrypt('same-input');
    const fromBytes = await enc.encrypt(bytes);
    expect(new TextDecoder().decode(await enc.decrypt(fromString))).toBe('same-input');
    expect(new TextDecoder().decode(await enc.decrypt(fromBytes))).toBe('same-input');
  });
});
