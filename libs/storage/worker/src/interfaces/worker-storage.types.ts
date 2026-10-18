import type { StorageSignalOptions } from './storage-options.types';

export type WorkerStorageAction = 'read' | 'write' | 'delete';

export interface WorkerStorageRequest {
  type: WorkerStorageAction;
  requestId: string;
  key?: string;
  payload?: any;
  options?: StorageSignalOptions & {
    useToon?: boolean;
  };
}

export interface WorkerStorageResponse {
  type: 'response' | 'change' | 'error';
  requestId?: string;
  key?: string;
  payload?: any;
  error?: string;
}
