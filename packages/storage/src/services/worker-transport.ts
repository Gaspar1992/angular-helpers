import { Inject, Injectable, Optional } from '@angular/core';
import { StorageTransport } from './storage-transport';
import { STORAGE_WORKER_FACTORY } from '../tokens/worker.tokens';
import { WorkerStorageAction, WorkerStorageResponse } from '../interfaces/worker-storage.types';
import { StorageSignalOptions } from '../interfaces/storage.types';
import { detectTransferables } from '../utils/detect-transferables';

@Injectable()
export class WorkerStorageTransport implements StorageTransport {
  private worker?: Worker;
  private readonly pendingRequests = new Map<
    string,
    { resolve: (value: any) => void; reject: (err: Error) => void }
  >();
  private readonly changeCallbacks = new Map<string, Set<(value: any) => void>>();

  constructor(
    @Inject(STORAGE_WORKER_FACTORY) @Optional() private readonly workerFactory?: () => Worker,
  ) {
    if (this.workerFactory) {
      this.initWorker();
    }
  }

  private initWorker() {
    if (this.worker || !this.workerFactory) return;

    this.worker = this.workerFactory();
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
    return this.postRequest<T | undefined>('read', key, undefined, { ...options, useToon });
  }

  write<T>(key: string, data: T, options?: StorageSignalOptions): Promise<void> {
    this.ensureWorker();
    const useToon = options?.serializer === 'toon';
    return this.postRequest<void>('write', key, data, { ...options, useToon });
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
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
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
