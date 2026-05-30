import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { InMemoryStorageTransport } from './in-memory.transport';

// Polyfill subtle crypto for JSDOM / Node environment
if (typeof globalThis !== 'undefined' && !globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

describe('InMemoryStorageTransport', () => {
  let transport: InMemoryStorageTransport;
  const passphrase = 'test-secret-passphrase';

  beforeEach(() => {
    transport = new InMemoryStorageTransport(passphrase);
  });

  it('should write a value and read it back successfully', async () => {
    await transport.write('key1', { name: 'Angular' });
    const result = await transport.read<any>('key1');
    expect(result).toEqual({ name: 'Angular' });
  });

  it('should delete a value and verify read returns undefined', async () => {
    await transport.write('key2', 'val2');
    await transport.delete('key2');
    const result = await transport.read('key2');
    expect(result).toBeUndefined();
  });

  it('should ensure data isolation by returning deserialized clones (deep isolation verification)', async () => {
    const original = { list: [1, 2, 3] };
    await transport.write('key3', original);
    const retrieved = await transport.read<any>('key3');
    expect(retrieved).toEqual(original);
    expect(retrieved).not.toBe(original); // Should be a different reference

    retrieved.list.push(4);
    const secondRetrieval = await transport.read<any>('key3');
    expect(secondRetrieval.list).toEqual([1, 2, 3]); // Should not have been mutated
  });

  it('should support encryption and decrypt the underlying data in the internal map', async () => {
    const rawData = { secret: '42' };
    await transport.write('secureKey', rawData, { encrypt: true } as any);

    // Verify it is encrypted in the internal store
    const internalMap = transport.getInternalMap();
    const storedString = internalMap.get('secureKey');
    expect(storedString).toBeDefined();
    expect(storedString).not.toContain('42');

    // Read back and ensure decrypted correctly
    const decrypted = await transport.read<any>('secureKey', { encrypt: true } as any);
    expect(decrypted).toEqual(rawData);
  });

  it('should support subscription events via onChange and unsubscribe function', async () => {
    const callback = vi.fn();
    const unsubscribe = transport.onChange<string>('subKey', callback);

    await transport.write('subKey', 'newData');

    // Allow callbacks to execute asynchronously
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(callback).toHaveBeenCalledWith('newData');

    // Unsubscribe and ensure no further calls
    unsubscribe();
    callback.mockClear();

    await transport.write('subKey', 'newerData');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(callback).not.toHaveBeenCalled();
  });

  it('should trigger subscription callbacks with undefined when a key is deleted', async () => {
    const callback = vi.fn();
    transport.onChange<any>('subKeyDelete', callback);

    await transport.write('subKeyDelete', 'someData');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(callback).toHaveBeenCalledWith('someData');
    callback.mockClear();

    await transport.delete('subKeyDelete');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(callback).toHaveBeenCalledWith(undefined);
  });
});
