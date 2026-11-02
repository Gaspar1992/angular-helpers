import type { StorageSignalOptions } from './storage-options.types';

export type WorkerStorageAction = 'init' | 'read' | 'write' | 'delete';

export interface WorkerStorageRequest {
  type: WorkerStorageAction;
  requestId: string;
  key?: string;
  payload?: any;
  options?: StorageSignalOptions & {
    useToon?: boolean;
    passphrase?: string;
  };
}

export interface WorkerStorageResponse {
  type: 'response' | 'change' | 'error';
  requestId?: string;
  key?: string;
  payload?: any;
  error?: string;
}
