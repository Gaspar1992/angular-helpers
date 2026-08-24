import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LocalStorageTransport } from './local-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';
import { STORAGE_WORKER_FACTORY } from '../tokens/worker.tokens';

describe('LocalStorageTransport', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.clear === 'function') {
      sessionStorage.clear();
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should resolve with the default encryption passphrase and warn when encryption is enabled', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});

    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).secretPassphrase).toBe('angular-helpers-secure-storage-passphrase');

    // Trigger encryption write to activate warning
    await transport.write('warn-key', 'secret', { encrypt: true });
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[LocalStorageTransport] WARNING: Encryption is enabled'),
    );

    // Should not warn twice
    consoleWarnSpy.mockClear();
    await transport.read('warn-key', { encrypt: true });
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should allow configuring a custom encryption passphrase without warning', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: SECURE_STORAGE_PASSPHRASE, useValue: 'my-custom-secret-passphrase' }],
    });
    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).secretPassphrase).toBe('my-custom-secret-passphrase');

    await transport.write('custom-pass-key', 'val', { encrypt: true });
    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should read and write in a stateless way with variable options', async () => {
    TestBed.resetTestingModule();
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

    // Verify raw values
    const rawConf = localStorage.getItem('confidential');
    expect(rawConf).toBeDefined();
    expect(rawConf).not.toContain('topSecret');

    const rawPub = localStorage.getItem('public');
    expect(rawPub).toContain('"topSecret":false');
  });

  it('should delete keys from web storage and memory', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    await transport.write('delete-me', 'exists');
    await transport.delete('delete-me');
    expect(await transport.read('delete-me')).toBeUndefined();

    // Memory storage deletion
    await transport.write('mem-del', 'exists', { storageType: 'memory' });
    await transport.delete('mem-del', { storageType: 'memory' });
    expect(await transport.read('mem-del', { storageType: 'memory' })).toBeUndefined();
  });

  it('should route requests correctly to the in-memory transport when storageType: memory is set', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    await transport.write(
      'memKey',
      { role: 'tester' },
      { storageType: 'memory', serializer: 'json' },
    );
    const result = await transport.read<any>('memKey', {
      storageType: 'memory',
      serializer: 'json',
    });
    expect(result).toEqual({ role: 'tester' });

    expect(localStorage.getItem('memKey')).toBeNull();
  });

  it('should route requests to cacheapi and indexeddb transports in browser mode', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    // CacheAPI routing
    const cacheSpy = vi.spyOn((transport as any).cacheApi, 'write').mockResolvedValue(undefined);
    await transport.write('cache-item', { a: 1 }, { storageType: 'cacheapi' });
    expect(cacheSpy).toHaveBeenCalledWith('cache-item', { a: 1 }, expect.any(Object));

    // IndexedDB routing
    const idbSpy = vi.spyOn((transport as any).indexedDB, 'write').mockResolvedValue(undefined);
    await transport.write('idb-item', { b: 2 }, { storageType: 'indexeddb' });
    expect(idbSpy).toHaveBeenCalledWith('idb-item', { b: 2 }, expect.any(Object));
  });

  it('should fallback to in-memory transport in SSR mode', async () => {
    TestBed.resetTestingModule();
    // Simulate instantiation outside browser
    const ssrTransport = new LocalStorageTransport();
    (ssrTransport as any).isBrowser = false;
    (ssrTransport as any).storageType = 'memory';

    await ssrTransport.write('ssr-key', { server: true });
    const res = await ssrTransport.read<any>('ssr-key');
    expect(res).toEqual({ server: true });
  });

  it('should integrate with WorkerStorageTransport when STORAGE_WORKER_FACTORY is provided', async () => {
    const mockWorker = {
      postMessage: vi.fn(),
      onmessage: null,
      onerror: null,
    };
    const mockWorkerFactory = () => mockWorker as unknown as Worker;

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_WORKER_FACTORY, useValue: mockWorkerFactory }],
    });

    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).workerTransport).toBeDefined();

    const writePromise = transport.write('worker-key', { worker: true });
    // Expect worker.postMessage to have been called
    expect(mockWorker.postMessage).toHaveBeenCalled();

    // Respond to write message
    const requestId = mockWorker.postMessage.mock.calls[0][0].requestId;
    mockWorker.onmessage?.({ data: { type: 'response', requestId } } as any);
    await writePromise;

    // Test delete through worker
    const deletePromise = transport.delete('worker-key');
    const delRequestId = mockWorker.postMessage.mock.calls[1][0].requestId;
    mockWorker.onmessage?.({ data: { type: 'response', requestId: delRequestId } } as any);
    await deletePromise;
  });

  it('should support multi-tab synchronization via onChange and BroadcastChannel', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    const callback = vi.fn();
    const unsub = transport.onChange('broadcast-key', callback);

    await transport.write('broadcast-key', 'broadcast-val');
    // Allow promises to resolve
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(typeof unsub).toBe('function');
    unsub();
  });
});
