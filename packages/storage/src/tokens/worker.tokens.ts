import { InjectionToken } from '@angular/core';

/**
 * Injection token to provide the Storage Web Worker factory function.
 */
export const STORAGE_WORKER_FACTORY = new InjectionToken<() => Worker>('STORAGE_WORKER_FACTORY');
