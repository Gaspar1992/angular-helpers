// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { createContentHasher } from './content-hasher';

/** Known test vectors — https://www.di-mgt.com.au/sha_testvectors.html */
const SHA256_ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const SHA384_ABC =
  'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7';
const SHA512_ABC =
  'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a' +
  '2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f';

describe('createContentHasher', () => {
  it('matches the SHA-256 known vector for "abc"', async () => {
    const hasher = createContentHasher('SHA-256');
    expect(await hasher.hashHex('abc')).toBe(SHA256_ABC);
  });

  it('matches the SHA-384 known vector for "abc"', async () => {
    const hasher = createContentHasher('SHA-384');
    expect(await hasher.hashHex('abc')).toBe(SHA384_ABC);
  });

  it('matches the SHA-512 known vector for "abc"', async () => {
    const hasher = createContentHasher('SHA-512');
    expect(await hasher.hashHex('abc')).toBe(SHA512_ABC);
  });

  it('defaults to SHA-256 when no algorithm is given', async () => {
    const hasher = createContentHasher();
    expect(await hasher.hashHex('abc')).toBe(SHA256_ABC);
  });

  it('produces identical hashes for equivalent string, Uint8Array and ArrayBuffer inputs', async () => {
    const hasher = createContentHasher('SHA-256');
    const encoded = new TextEncoder().encode('hello');
    const fromString = await hasher.hashHex('hello');
    const fromBytes = await hasher.hashHex(encoded);
    const fromBuffer = await hasher.hashHex(encoded.buffer);
    expect(fromString).toBe(fromBytes);
    expect(fromString).toBe(fromBuffer);
  });

  it('hash() returns an ArrayBuffer of the expected byte length per algorithm', async () => {
    expect((await createContentHasher('SHA-256').hash('x')).byteLength).toBe(32);
    expect((await createContentHasher('SHA-384').hash('x')).byteLength).toBe(48);
    expect((await createContentHasher('SHA-512').hash('x')).byteLength).toBe(64);
  });

  it('hashes an empty string deterministically', async () => {
    // RFC test vector: SHA-256("") = e3b0c442...
    const hasher = createContentHasher('SHA-256');
    expect(await hasher.hashHex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
