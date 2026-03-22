import { Injectable, inject, DestroyRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
}

export interface WorkerStatus {
  initialized: boolean;
  running: boolean;
  error?: string;
  messageCount: number;
}

export interface WorkerTask<T = unknown> {
  id: string;
  type: string;
  data: T;
  transferable?: Transferable[];
}

@Injectable()
export class WebWorkerService extends BrowserApiBaseService {
  protected override destroyRef = inject(DestroyRef);
  private workers = new Map<string, Worker>();
  private workerStatuses = new Map<string, Subject<WorkerStatus>>();
  private workerMessages = new Map<string, Subject<WorkerMessage>>();
  private currentWorkerStatuses = new Map<string, WorkerStatus>();

  protected override getApiName(): string {
    return 'webworker';
  }

  private ensureWorkerSupport(): void {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers not supported in this browser');
    }
  }

  createWorker(name: string, scriptUrl: string): Observable<WorkerStatus> {
    this.ensureWorkerSupport();

    return new Observable<WorkerStatus>((observer) => {
      if (this.workers.has(name)) {
        observer.next(this.currentWorkerStatuses.get(name)!);
        observer.complete();
        return () => {
          this.terminateWorker(name);
        };
      }

      try {
        const worker = new Worker(scriptUrl);
        this.workers.set(name, worker);
        this.setupWorker(name, worker);

        const status: WorkerStatus = {
          initialized: true,
          running: true,
          messageCount: 0
        };

        this.currentWorkerStatuses.set(name, status);
        this.updateWorkerStatus(name, status);
        observer.next(status);
        observer.complete();

      } catch (error) {
        console.error(`[WebWorkerService] Failed to create worker ${name}:`, error);
        const status: WorkerStatus = {
          initialized: false,
          running: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          messageCount: 0
        };
        this.currentWorkerStatuses.set(name, status);
        this.updateWorkerStatus(name, status);
        observer.next(status);
        observer.complete();
      }

      return () => {
        this.terminateWorker(name);
      };
    });
  }

  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
      this.workerStatuses.delete(name);
      this.workerMessages.delete(name);
      this.currentWorkerStatuses.delete(name);
    }
  }

  terminateAllWorkers(): void {
    this.workers.forEach((_, name) => {
      this.terminateWorker(name);
    });
  }

  postMessage(workerName: string, task: WorkerTask): void {
    const worker = this.workers.get(workerName);
    if (!worker) {
      console.error(`[WebWorkerService] Worker ${workerName} not found`);
      return;
    }

    try {
      const message = { ...task, timestamp: Date.now() };

      if (task.transferable) {
        worker.postMessage(message, task.transferable);
      } else {
        worker.postMessage(message);
      }

      const currentStatus = this.currentWorkerStatuses.get(workerName);
      if (currentStatus) {
        currentStatus.messageCount++;
        this.updateWorkerStatus(workerName, currentStatus);
      }
    } catch (error) {
      console.error(`[WebWorkerService] Failed to post message to worker ${workerName}:`, error);
    }
  }

  getMessages(workerName: string): Observable<WorkerMessage> {
    if (!this.workerMessages.has(workerName)) {
      this.workerMessages.set(workerName, new Subject<WorkerMessage>());
    }
    return this.workerMessages.get(workerName)!.asObservable();
  }

  getStatus(workerName: string): Observable<WorkerStatus> {
    if (!this.workerStatuses.has(workerName)) {
      this.workerStatuses.set(workerName, new Subject<WorkerStatus>());
    }
    return this.workerStatuses.get(workerName)!.asObservable();
  }

  getCurrentStatus(workerName: string): WorkerStatus | undefined {
    return this.currentWorkerStatuses.get(workerName);
  }

  getAllStatuses(): Map<string, WorkerStatus> {
    return new Map(this.currentWorkerStatuses);
  }

  isWorkerRunning(workerName: string): boolean {
    const status = this.currentWorkerStatuses.get(workerName);
    return status?.running ?? false;
  }

  private setupWorker(name: string, worker: Worker): void {
    worker.onmessage = (event) => {
      const message: WorkerMessage = {
        id: event.data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: event.data.type || 'message',
        data: event.data.data,
        timestamp: event.data.timestamp || Date.now()
      };

      if (!this.workerMessages.has(name)) {
        this.workerMessages.set(name, new Subject<WorkerMessage>());
      }
      this.workerMessages.get(name)!.next(message);
    };

    worker.onerror = (error) => {
      console.error(`[WebWorkerService] Worker ${name} error:`, error);
      const status: WorkerStatus = {
        initialized: true,
        running: false,
        error: error instanceof Error ? error.message : 'Worker error',
        messageCount: this.currentWorkerStatuses.get(name)?.messageCount ?? 0
      };
      this.currentWorkerStatuses.set(name, status);
      this.updateWorkerStatus(name, status);
    };

    // Auto-cleanup when service is destroyed
    this.destroyRef.onDestroy(() => {
      this.terminateWorker(name);
    });
  }

  private updateWorkerStatus(name: string, status: WorkerStatus): void {
    if (!this.workerStatuses.has(name)) {
      this.workerStatuses.set(name, new Subject<WorkerStatus>());
    }
    this.workerStatuses.get(name)!.next(status);
  }

  // Direct access to native Worker API
  getNativeWorker(name: string): Worker | undefined {
    return this.workers.get(name);
  }

  getAllWorkers(): Map<string, Worker> {
    return new Map(this.workers);
  }
}
