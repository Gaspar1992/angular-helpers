import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WorkerStorageTransport } from './worker-transport';
import { WorkerStorageRequest } from '../interfaces/worker-storage.types';
import { STORAGE_WORKER_FACTORY } from '../tokens/worker.tokens';

describe('WorkerStorageTransport', () => {
  let mockWorker: any;
  let factory: () => Worker;
  let transport: WorkerStorageTransport;
  let lastMessageSent: any = null;

  beforeEach(() => {
    lastMessageSent = null;

    mockWorker = {
      postMessage: vi.fn((message: WorkerStorageRequest) => {
        lastMessageSent = message;
      }),
      onmessage: null,
      onerror: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      terminate: vi.fn(),
    };

    factory = () => mockWorker as unknown as Worker;
    transport = WorkerStorageTransport.create(factory);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should initialize via Angular injection context with STORAGE_WORKER_FACTORY token', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: STORAGE_WORKER_FACTORY, useValue: factory }],
    });

    const injectedTransport = TestBed.inject(WorkerStorageTransport);
    expect((injectedTransport as any).worker).toBeDefined();
  });

  it('should throw error when read/write/delete called without worker factory', () => {
    const noWorkerTransport = new WorkerStorageTransport();

    expect(() => noWorkerTransport.read('key')).toThrow(
      /STORAGE_WORKER_FACTORY token must be provided/,
    );
    expect(() => noWorkerTransport.write('key', 'val')).toThrow(
      /STORAGE_WORKER_FACTORY token must be provided/,
    );
    expect(() => noWorkerTransport.delete('key')).toThrow(
      /STORAGE_WORKER_FACTORY token must be provided/,
    );
  });

  it('should throw error if worker factory returns null or undefined', () => {
    const nullFactoryTransport = WorkerStorageTransport.create(() => null as any);

    expect(() => nullFactoryTransport.read('key')).toThrow(/Worker environment is not available/);
  });

  it('should send a read message to the worker with a unique ID and resolve on success response', async () => {
    const readPromise = transport.read('user_1', { serializer: 'toon' });

    expect(mockWorker.postMessage).toHaveBeenCalled();
    expect(lastMessageSent).toBeDefined();
    expect(lastMessageSent.type).toBe('read');
    expect(lastMessageSent.key).toBe('user_1');
    expect(lastMessageSent.options.useToon).toBe(true);
    expect(lastMessageSent.requestId).toBeDefined();

    const requestId = lastMessageSent.requestId;
    mockWorker.onmessage({
      data: {
        type: 'response',
        requestId,
        payload: { id: 1, name: 'Gaston' },
      },
    } as MessageEvent);

    const result = await readPromise;
    expect(result).toEqual({ id: 1, name: 'Gaston' });
  });

  it('should reject read promise if worker response contains error', async () => {
    const readPromise = transport.read('user_err');
    const requestId = lastMessageSent.requestId;

    mockWorker.onmessage({
      data: {
        type: 'response',
        requestId,
        error: 'Database is locked',
      },
    } as MessageEvent);

    await expect(readPromise).rejects.toThrow('Database is locked');
  });

  it('should bubble up error message from the worker if action fails', async () => {
    const readPromise = transport.read('user_2');

    const requestId = lastMessageSent.requestId;
    mockWorker.onmessage({
      data: {
        type: 'error',
        requestId,
        error: 'Database connection failed',
      },
    } as MessageEvent);

    await expect(readPromise).rejects.toThrow('Database connection failed');
  });

  it('should bubble up error with fallback message from worker.onerror if message is empty', async () => {
    const readPromise = transport.read('user_3');

    mockWorker.onerror({
      message: '',
    } as ErrorEvent);

    await expect(readPromise).rejects.toThrow('Worker syntax or runtime error');
  });

  it('should support write action and resolve upon success', async () => {
    const writePromise = transport.write('user_4', { role: 'admin' }, { serializer: 'toon' });

    expect(lastMessageSent.type).toBe('write');
    expect(lastMessageSent.key).toBe('user_4');
    expect(lastMessageSent.payload).toEqual({ role: 'admin' });
    expect(lastMessageSent.options.useToon).toBe(true);

    const requestId = lastMessageSent.requestId;
    mockWorker.onmessage({
      data: {
        type: 'response',
        requestId,
      },
    } as MessageEvent);

    await expect(writePromise).resolves.toBeUndefined();
  });

  it('should support delete action and resolve upon success', async () => {
    const deletePromise = transport.delete('user_5');

    expect(lastMessageSent.type).toBe('delete');
    expect(lastMessageSent.key).toBe('user_5');

    const requestId = lastMessageSent.requestId;
    mockWorker.onmessage({
      data: {
        type: 'response',
        requestId,
      },
    } as MessageEvent);

    await expect(deletePromise).resolves.toBeUndefined();
  });

  it('should trigger onChange callbacks when receiving multi-tab change event from the worker', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unsubscribe1 = transport.onChange('theme', callback1);
    const unsubscribe2 = transport.onChange('theme', callback2);

    mockWorker.onmessage({
      data: {
        type: 'change',
        key: 'theme',
        payload: 'cyber-dark',
      },
    } as MessageEvent);

    expect(callback1).toHaveBeenCalledWith('cyber-dark');
    expect(callback2).toHaveBeenCalledWith('cyber-dark');

    unsubscribe1();
    mockWorker.onmessage({
      data: {
        type: 'change',
        key: 'theme',
        payload: 'cyber-light',
      },
    } as MessageEvent);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith('cyber-light');

    unsubscribe2();
    // After all unsubscribed, map cleaned up
    expect((transport as any).changeCallbacks.has('theme')).toBe(false);
  });

  it('should fallback to Math.random ID generation if crypto.randomUUID is not defined', async () => {
    const origCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    const readPromise = transport.read('math_random_key');
    expect(lastMessageSent.requestId).toBeDefined();

    mockWorker.onmessage({
      data: {
        type: 'response',
        requestId: lastMessageSent.requestId,
        payload: 'ok',
      },
    } as MessageEvent);

    expect(await readPromise).toBe('ok');

    Object.defineProperty(globalThis, 'crypto', {
      value: origCrypto,
      configurable: true,
      writable: true,
    });
  });
});
