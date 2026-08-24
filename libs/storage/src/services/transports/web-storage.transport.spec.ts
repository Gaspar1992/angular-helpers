import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WebStorageTransport } from './web-storage.transport';
import { injectPlatform } from '@angular-helpers/core';

describe('WebStorageTransport', () => {
  let mockLocalStorage: any;
  let mockSessionStorage: any;
  let localStore: Record<string, string>;
  let sessionStore: Record<string, string>;
  const passphrase = 'test-web-storage-secret-passphrase';

  beforeEach(() => {
    localStore = {};
    sessionStore = {};

    mockLocalStorage = {
      getItem: vi.fn((key: string) => localStore[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        localStore[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStore[key];
      }),
      clear: vi.fn(() => {
        localStore = {};
      }),
    };

    mockSessionStorage = {
      getItem: vi.fn((key: string) => sessionStore[key] ?? null),
      setItem: vi.fn((key: string, val: string) => {
        sessionStore[key] = val;
      }),
      removeItem: vi.fn((key: string) => {
        delete sessionStore[key];
      }),
      clear: vi.fn(() => {
        sessionStore = {};
      }),
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
      configurable: true,
    });
  });

  it('should write and read from localStorage by default', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();
      const payload = { id: 1, name: 'Angular' };

      await transport.write('app_config', payload);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('app_config', JSON.stringify(payload));

      const result = await transport.read<typeof payload>('app_config');
      expect(result).toEqual(payload);
    });
  });

  it('should write and read from sessionStorage when storageType is session', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();
      const payload = { token: 'session-xyz' };
      const options = { storageType: 'session' as const };

      await transport.write('session_token', payload, options);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'session_token',
        JSON.stringify(payload),
      );

      const result = await transport.read<typeof payload>('session_token', options);
      expect(result).toEqual(payload);
    });
  });

  it('should return undefined when key does not exist', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();
      const result = await transport.read('missing_key');
      expect(result).toBeUndefined();
    });
  });

  it('should delete from localStorage and sessionStorage', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();

      await transport.write('key_local', 'data');
      await transport.delete('key_local');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('key_local');

      await transport.write('key_session', 'data', { storageType: 'session' });
      await transport.delete('key_session', { storageType: 'session' });
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('key_session');
    });
  });

  it('should encrypt data on write and decrypt on read with a passphrase', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport(passphrase);
      const secret = { apiKey: 'ultra-secret-key' };
      const options = { encrypt: true };

      await transport.write('secure_conf', secret, options);

      // Verify the raw item stored is encrypted
      const rawStored = localStore['secure_conf'];
      expect(rawStored).toBeDefined();
      expect(rawStored).not.toContain('ultra-secret-key');

      const decrypted = await transport.read<typeof secret>('secure_conf', options);
      expect(decrypted).toEqual(secret);
    });
  });

  it('should handle encryption error when passphrase is missing', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport(); // No passphrase
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await transport.write('secure_key', { secret: 123 }, { encrypt: true });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WebStorageTransport] Error writing key:'),
        'secure_key',
        expect.any(Error),
      );

      localStore['encrypted_data'] = 'some-cipher';
      const readRes = await transport.read('encrypted_data', { encrypt: true });
      expect(readRes).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WebStorageTransport] Error reading key:'),
        'encrypted_data',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  it('should handle corrupted JSON data gracefully on read', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      localStore['corrupt_json'] = 'invalid{json:data';
      const result = await transport.read('corrupt_json');
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WebStorageTransport] Error reading key:'),
        'corrupt_json',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  it('should support multi-tab synchronization via onChange listener', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();
      const callback = vi.fn();
      const unsubscribe = transport.onChange('synced_key', callback);

      // Simulate a storage event for this key
      const event = new StorageEvent('storage', {
        key: 'synced_key',
        newValue: JSON.stringify({ synced: true }),
      });
      window.dispatchEvent(event);

      // Wait for async deserializeData to finish
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledWith({ synced: true });

      // Simulate an event with a different key
      const otherEvent = new StorageEvent('storage', {
        key: 'other_key',
        newValue: JSON.stringify({ synced: false }),
      });
      window.dispatchEvent(otherEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledTimes(1);

      // Simulate an event with newValue: null (deletion)
      const nullEvent = new StorageEvent('storage', {
        key: 'synced_key',
        newValue: null,
      });
      window.dispatchEvent(nullEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledTimes(1);

      // Simulate an event with invalid JSON (error ignored)
      const corruptEvent = new StorageEvent('storage', {
        key: 'synced_key',
        newValue: '{corrupt',
      });
      window.dispatchEvent(corruptEvent);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();
      window.dispatchEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle SSR / non-browser environments gracefully', async () => {
    await TestBed.runInInjectionContext(async () => {
      const transport = new WebStorageTransport();
      // Temporarily mock platform as non-browser
      (transport as any).platform = { isBrowser: false, window: null };

      expect(await transport.read('key')).toBeUndefined();
      await transport.write('key', 'value');
      await transport.delete('key');
      const unsub = transport.onChange('key', () => {});
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });
});
