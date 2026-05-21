import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { webcrypto } from 'node:crypto';
import { LocalStorageTransport } from './local-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';

// Polyfill for JSDOM/HappyDOM lack of subtle crypto support
if (typeof globalThis !== 'undefined' && !globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

describe('LocalStorageTransport', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should resolve with the default encryption passphrase', () => {
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).secretPassphrase).toBe('angular-helpers-secure-storage-passphrase');
  });

  it('should allow configuring a custom encryption passphrase', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SECURE_STORAGE_PASSPHRASE, useValue: 'my-custom-secret-passphrase' }],
    });
    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).secretPassphrase).toBe('my-custom-secret-passphrase');
  });

  it('should read and write in a stateless way with variable options', async () => {
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    // Write an encrypted value
    await transport.write(
      'confidential',
      { topSecret: true },
      { storageType: 'local', serializer: 'json', encrypt: true },
    );
    // Write another value without encryption
    await transport.write(
      'public',
      { topSecret: false },
      { storageType: 'local', serializer: 'json', encrypt: false },
    );

    // Read encrypted value
    const conf = await transport.read<any>('confidential', {
      storageType: 'local',
      serializer: 'json',
      encrypt: true,
    });
    expect(conf).toEqual({ topSecret: true });

    // Read public value
    const pub = await transport.read<any>('public', {
      storageType: 'local',
      serializer: 'json',
      encrypt: false,
    });
    expect(pub).toEqual({ topSecret: false });

    // Verify that confidential data in localStorage is encrypted (not visible plain text)
    const rawConf = localStorage.getItem('confidential');
    expect(rawConf).toBeDefined();
    expect(rawConf).not.toContain('topSecret');

    // Verify that public data in localStorage is visible JSON
    const rawPub = localStorage.getItem('public');
    expect(rawPub).toContain('"topSecret":false');
  });

  it('should support concurrent asynchronous reads and writes without state clashing', async () => {
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    // Launch concurrent writes with cross options in parallel
    const op1 = transport.write('keyA', 'dataA', {
      storageType: 'local',
      serializer: 'json',
      encrypt: true,
    });
    const op2 = transport.write('keyB', 'dataB', {
      storageType: 'session',
      serializer: 'json',
      encrypt: false,
    });

    await Promise.all([op1, op2]);

    // Read in parallel
    const resA = await transport.read<string>('keyA', {
      storageType: 'local',
      serializer: 'json',
      encrypt: true,
    });
    const resB = await transport.read<string>('keyB', {
      storageType: 'session',
      serializer: 'json',
      encrypt: false,
    });

    expect(resA).toBe('dataA');
    expect(resB).toBe('dataB');

    // Confirm that the instance's default storage type didn't change
    expect(transport.storageType).toBe('local');
    expect(transport.encrypt).toBe(false);
  });
});
