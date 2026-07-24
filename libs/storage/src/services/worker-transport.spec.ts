import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerStorageTransport } from './worker-transport';
import { WorkerStorageRequest } from '../interfaces/worker-storage.types';

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
    transport = new WorkerStorageTransport(factory);
  });

  it('should send a read message to the worker with a unique ID and resolve on success response', async () => {
    const readPromise = transport.read('user_1');

    expect(mockWorker.postMessage).toHaveBeenCalled();
    expect(lastMessageSent).toBeDefined();
    expect(lastMessageSent.type).toBe('read');
    expect(lastMessageSent.key).toBe('user_1');
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

  it('should bubble up error from worker.onerror if worker crashes', async () => {
    const readPromise = transport.read('user_3');

    mockWorker.onerror({
      message: 'SyntaxError: Unexpected token',
    } as ErrorEvent);

    await expect(readPromise).rejects.toThrow('SyntaxError: Unexpected token');
  });

  it('should support write action and resolve upon success', async () => {
    const writePromise = transport.write('user_4', { role: 'admin' });

    expect(lastMessageSent.type).toBe('write');
    expect(lastMessageSent.key).toBe('user_4');
    expect(lastMessageSent.payload).toEqual({ role: 'admin' });

    const requestId = lastMessageSent.requestId;
    mockWorker.onmessage({
      data: {
        type: 'response',
        requestId,
      },
    } as MessageEvent);

    await expect(writePromise).resolves.toBeUndefined();
  });

  it('should trigger onChange callbacks when receiving multi-tab change event from the worker', () => {
    const callback = vi.fn();
    const unsubscribe = transport.onChange('theme', callback);

    mockWorker.onmessage({
      data: {
        type: 'change',
        key: 'theme',
        payload: 'cyber-dark',
      },
    } as MessageEvent);

    expect(callback).toHaveBeenCalledWith('cyber-dark');

    unsubscribe();
    mockWorker.onmessage({
      data: {
        type: 'change',
        key: 'theme',
        payload: 'cyber-premium-glass',
      },
    } as MessageEvent);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
