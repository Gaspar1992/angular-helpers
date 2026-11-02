import { Injectable, inject } from '@angular/core';
import type { StorageTransport } from './storage-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';
import { STORAGE_WORKER_FACTORY } from '../tokens/worker.tokens';
import type {
  WorkerStorageAction,
  WorkerStorageResponse,
} from '../interfaces/worker-storage.types';
import type { StorageSignalOptions } from '../interfaces/storage.types';
import { detectTransferables } from '../utils/detect-transferables';

@Injectable({
  providedIn: 'root',
})
export class WorkerStorageTransport implements StorageTransport {
  private worker?: Worker;
  private workerFactory?: () => Worker;
  private secretPassphrase?: string;
  private nextFallbackId = 0;
  private readonly pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (err: Error) => void }
  >();
  private readonly changeCallbacks = new Map<string, Set<(value: any) => void>>();

  constructor() {
    try {
      this.workerFactory =
        inject<(() => Worker) | null>(STORAGE_WORKER_FACTORY, { optional: true }) ?? undefined;
      this.secretPassphrase =
        inject<string | null>(SECURE_STORAGE_PASSPHRASE, { optional: true }) ?? undefined;
    } catch {
      // Graceful fallback when instantiated outside an injection context
    }

    if (this.workerFactory) {
      this.initWorker();
    }
  }

  /**
   * Updates the worker factory and initializes the underlying Web Worker.
   */
  public setWorkerFactory(workerFactory: () => Worker): void {
    this.workerFactory = workerFactory;
    this.initWorker();
  }

  /**
   * Configures a custom encryption passphrase for worker operations.
   */
  public setPassphrase(passphrase: string): void {
    this.secretPassphrase = passphrase;
  }

  /**
   * Factory method for creating an instance with an explicit worker factory (e.g. in unit tests).
   */
  public static create(workerFactory: () => Worker, passphrase?: string): WorkerStorageTransport {
    const transport = new WorkerStorageTransport();
    if (passphrase !== undefined) {
      transport.setPassphrase(passphrase);
    }
    transport.setWorkerFactory(workerFactory);
    return transport;
  }

  private initWorker() {
    if (this.worker || !this.workerFactory) return;

    this.worker = this.workerFactory();
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<WorkerStorageResponse>) => {
      const { type, requestId, payload, key, error } = event.data;

      if (type === 'response' && requestId) {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(payload);
          }
          this.pendingRequests.delete(requestId);
        }
      } else if (type === 'change' && key) {
        const callbacks = this.changeCallbacks.get(key);
        if (callbacks) {
          callbacks.forEach((cb) => cb(payload));
        }
      } else if (type === 'error' && requestId) {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          pending.reject(new Error(error || 'Unknown Worker Error'));
          this.pendingRequests.delete(requestId);
        }
      }
    };

    this.worker.onerror = (event: ErrorEvent) => {
      const errorMsg = event.message || 'Worker syntax or runtime error';
      this.pendingRequests.forEach((pending) => {
        pending.reject(new Error(errorMsg));
      });
      this.pendingRequests.clear();
    };
  }

  read<T>(key: string, options?: StorageSignalOptions): Promise<T | undefined> {
    this.ensureWorker();
    const useToon = options?.serializer === 'toon';
    const passphrase =
      options?.passphrase ?? (options?.encrypt ? this.secretPassphrase : undefined);
    return this.postRequest<T | undefined>('read', key, undefined, {
      ...options,
      useToon,
      ...(passphrase !== undefined ? { passphrase } : {}),
    });
  }

  write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    this.ensureWorker();
    const useToon = options?.serializer === 'toon';
    const passphrase =
      options?.passphrase ?? (options?.encrypt ? this.secretPassphrase : undefined);
    return this.postRequest<void>('write', key, data, {
      ...options,
      useToon,
      ...(passphrase !== undefined ? { passphrase } : {}),
    });
  }

  delete(key: string, options?: StorageSignalOptions): Promise<void> {
    this.ensureWorker();
    return this.postRequest<void>('delete', key, undefined, options);
  }

  onChange<T>(key: string, callback: (value: T) => void): () => void {
    if (!this.changeCallbacks.has(key)) {
      this.changeCallbacks.set(key, new Set());
    }
    this.changeCallbacks.get(key)!.add(callback);
    return () => {
      const set = this.changeCallbacks.get(key);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.changeCallbacks.delete(key);
        }
      }
    };
  }

  private ensureWorker() {
    if (!this.worker) {
      if (!this.workerFactory) {
        throw new Error(
          '[WorkerStorageTransport] STORAGE_WORKER_FACTORY token must be provided to run in Web Worker mode',
        );
      }
      this.initWorker();
      if (!this.worker) {
        throw new Error('Worker environment is not available (e.g. SSR)');
      }
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined') {
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      if (typeof crypto.getRandomValues === 'function') {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      }
    }
    return `req-${++this.nextFallbackId}-${Date.now()}`;
  }

  private postRequest<T>(
    type: WorkerStorageAction,
    key?: string,
    payload?: any,
    options?: any,
  ): Promise<T> {
    const requestId = this.generateId();
    return new Promise<T>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      const transferables = detectTransferables(payload);
      this.worker!.postMessage({ type, requestId, key, payload, options }, transferables);
    });
  }
}
