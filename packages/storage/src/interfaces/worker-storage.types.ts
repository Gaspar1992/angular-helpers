export type WorkerStorageAction = 'read' | 'write' | 'delete';

export interface WorkerStorageRequest {
  type: WorkerStorageAction;
  requestId: string;
  key?: string;
  payload?: any;
  options?: {
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
