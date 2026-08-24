import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryStorageTransport } from './in-memory.transport';

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

  it('should return undefined when reading non-existing key', async () => {
    const result = await transport.read('non_existing');
    expect(result).toBeUndefined();
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

  it('should handle encryption error when passphrase is not provided', async () => {
    const noPassTransport = new InMemoryStorageTransport(); // No passphrase
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await noPassTransport.write('encKey', { a: 1 }, { encrypt: true } as any);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[InMemoryStorageTransport] Error writing key:'),
      'encKey',
      expect.any(Error),
    );

    // Store encrypted ciphertext manually and try to read
    noPassTransport.getInternalMap().set('readEncKey', 'some-encrypted-string');
    const readRes = await noPassTransport.read('readEncKey', { encrypt: true } as any);
    expect(readRes).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[InMemoryStorageTransport] Error reading key:'),
      'readEncKey',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
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

  it('should handle multiple listeners on the same key and isolate callback failures', async () => {
    const cb1 = vi.fn().mockImplementation(() => {
      throw new Error('Listener 1 exploded');
    });
    const cb2 = vi.fn();

    const unsub1 = transport.onChange('multiKey', cb1);
    const unsub2 = transport.onChange('multiKey', cb2);

    await transport.write('multiKey', 'val');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(cb1).toHaveBeenCalledWith('val');
    expect(cb2).toHaveBeenCalledWith('val');

    unsub1();
    unsub2();
  });

  it('should handle delete listener errors gracefully', async () => {
    const cb1 = vi.fn().mockImplementation(() => {
      throw new Error('Delete listener error');
    });
    transport.onChange('delKey', cb1);

    await transport.delete('delKey');
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cb1).toHaveBeenCalledWith(undefined);
  });
});
