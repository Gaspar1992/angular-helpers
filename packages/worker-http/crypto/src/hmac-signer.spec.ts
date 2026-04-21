// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { createHmacSigner } from './hmac-signer';

const KEY_UTF8 = 'my-test-secret-key-32-chars!!!!';
const KEY_BYTES = new TextEncoder().encode(KEY_UTF8);

describe('createHmacSigner', () => {
  it('produces a deterministic hex signature for the same input and key', async () => {
    const signer = await createHmacSigner({ keyMaterial: KEY_BYTES });
    const a = await signer.signHex('hello');
    const b = await signer.signHex('hello');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/); // SHA-256 → 32 bytes → 64 hex chars
  });

  it('signs and verifies the same payload end-to-end', async () => {
    const signer = await createHmacSigner({ keyMaterial: KEY_BYTES });
    const signature = await signer.sign('payload-123');
    expect(await signer.verify('payload-123', signature)).toBe(true);
  });

  it('returns false when the signature does not match the data', async () => {
    const signer = await createHmacSigner({ keyMaterial: KEY_BYTES });
    const signature = await signer.sign('original');
    expect(await signer.verify('tampered', signature)).toBe(false);
  });

  it('produces 96 hex characters for SHA-384 and 128 for SHA-512', async () => {
    const s384 = await createHmacSigner({ keyMaterial: KEY_BYTES, algorithm: 'SHA-384' });
    const s512 = await createHmacSigner({ keyMaterial: KEY_BYTES, algorithm: 'SHA-512' });
    expect((await s384.signHex('x')).length).toBe(96);
    expect((await s512.signHex('x')).length).toBe(128);
  });

  it('produces different signatures across algorithms', async () => {
    const s256 = await createHmacSigner({ keyMaterial: KEY_BYTES, algorithm: 'SHA-256' });
    const s384 = await createHmacSigner({ keyMaterial: KEY_BYTES, algorithm: 'SHA-384' });
    const a = await s256.signHex('payload');
    const b = await s384.signHex('payload');
    expect(a).not.toBe(b);
  });

  it('accepts Uint8Array, ArrayBuffer and string payloads interchangeably', async () => {
    const signer = await createHmacSigner({ keyMaterial: KEY_BYTES });
    const fromString = await signer.signHex('hello');
    const fromBytes = await signer.signHex(new TextEncoder().encode('hello'));
    const fromBuffer = await signer.signHex(new TextEncoder().encode('hello').buffer);
    expect(fromString).toBe(fromBytes);
    expect(fromString).toBe(fromBuffer);
  });

  it('different keys produce different signatures for the same payload', async () => {
    const a = await createHmacSigner({ keyMaterial: new TextEncoder().encode('key-A') });
    const b = await createHmacSigner({ keyMaterial: new TextEncoder().encode('key-B') });
    const sigA = await a.signHex('same-payload');
    const sigB = await b.signHex('same-payload');
    expect(sigA).not.toBe(sigB);
  });
});
