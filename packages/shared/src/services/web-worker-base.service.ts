import { Injectable, inject, DestroyRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BrowserApiBaseService } from './browser-api-base.service';

export interface WorkerMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

export interface WorkerStatus {
  initialized: boolean;
  running: boolean;
  error?: string;
  messageCount: number;
}

export interface WorkerTask {
  id: string;
  type: string;
  data: any;
  transferable?: Transferable[];
}

/**
 * Base class for Web Worker services
 * Provides common functionality for:
 * - Worker management
 * - Message handling
 * - Status tracking
 * - Lifecycle management
 */
@Injectable()
export abstract class WebWorkerBaseService extends BrowserApiBaseService {
  protected workers = new Map<string, Worker>();
  private workerStatuses = new Map<string, Subject<WorkerStatus>>();
  private workerMessages = new Map<string, Subject<WorkerMessage>>();

  protected override getApiName(): string {
    return 'webworker';
  }

  protected override onDestroy(): void {
    this.terminateAllWorkers();
    super.onDestroy();
  }

  override isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  /**
   * Create a worker with the given name and script
   */
  protected async createWorker(name: string, scriptUrl: string): Promise<void> {
    if (!this.isSupported()) {
      const error = 'Web Workers not supported';
      this.updateWorkerStatus(name, { initialized: false, running: false, error, messageCount: 0 });
      return;
    }

    try {
      const worker = new Worker(scriptUrl);
      this.workers.set(name, worker);
      this.setupWorkerHandlers(name, worker);

      this.updateWorkerStatus(name, {
        initialized: true,
        running: true,
        messageCount: 0,
      });
    } catch (error) {
      const errorMessage = `Failed to create worker: ${error}`;
      this.updateWorkerStatus(name, {
        initialized: false,
        running: false,
        error: errorMessage,
        messageCount: 0,
      });
    }
  }

  /**
   * Create a worker from inline code
   */
  protected async createWorkerFromCode(name: string, workerCode: string): Promise<void> {
    if (!this.isSupported()) {
      const error = 'Web Workers not supported';
      this.updateWorkerStatus(name, { initialized: false, running: false, error, messageCount: 0 });
      return;
    }

    try {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      this.workers.set(name, worker);
      this.setupWorkerHandlers(name, worker);

      this.updateWorkerStatus(name, {
        initialized: true,
        running: true,
        messageCount: 0,
      });
    } catch (error) {
      const errorMessage = `Failed to create worker from code: ${error}`;
      this.updateWorkerStatus(name, {
        initialized: false,
        running: false,
        error: errorMessage,
        messageCount: 0,
      });
    }
  }

  /**
   * Post a message to a specific worker
   */
  protected postMessage(workerName: string, task: WorkerTask): void {
    const worker = this.workers.get(workerName);
    if (!worker) {
      this.logError(`Worker ${workerName} not found`);
      return;
    }

    try {
      const message = {
        ...task,
        timestamp: Date.now(),
      };

      if (task.transferable) {
        worker.postMessage(message, task.transferable);
      } else {
        worker.postMessage(message);
      }

      this.incrementMessageCount(workerName);
    } catch (error) {
      this.logError(`Failed to post message to worker ${workerName}:`, error);
    }
  }

  /**
   * Get messages from a specific worker
   */
  protected getMessages(workerName: string): Observable<WorkerMessage> {
    if (!this.workerMessages.has(workerName)) {
      this.workerMessages.set(workerName, new Subject<WorkerMessage>());
    }
    return this.workerMessages.get(workerName)!.asObservable();
  }

  /**
   * Get status updates from a specific worker
   */
  protected getWorkerStatus(workerName: string): Observable<WorkerStatus> {
    if (!this.workerStatuses.has(workerName)) {
      this.workerStatuses.set(workerName, new Subject<WorkerStatus>());
    }
    return this.workerStatuses.get(workerName)!.asObservable();
  }

  /**
   * Terminate a specific worker
   */
  protected terminateWorker(workerName: string): boolean {
    const worker = this.workers.get(workerName);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerName);
      this.updateWorkerStatus(workerName, {
        initialized: false,
        running: false,
        messageCount: this.getCurrentWorkerStatus(workerName).messageCount,
      });
      return true;
    }
    return false;
  }

  /**
   * Terminate all workers
   */
  protected terminateAllWorkers(): void {
    this.workers.forEach((worker, name) => {
      this.terminateWorker(name);
    });
  }

  /**
   * Check if a worker is running
   */
  protected isWorkerRunning(workerName: string): boolean {
    return this.getCurrentWorkerStatus(workerName).running;
  }

  /**
   * Check if a worker is initialized
   */
  protected isWorkerInitialized(workerName: string): boolean {
    return this.getCurrentWorkerStatus(workerName).initialized;
  }

  /**
   * Get error from a worker
   */
  protected getWorkerError(workerName: string): string | undefined {
    return this.getCurrentWorkerStatus(workerName).error;
  }

  /**
   * Get message count from a worker
   */
  protected getWorkerMessageCount(workerName: string): number {
    return this.getCurrentWorkerStatus(workerName).messageCount;
  }

  /**
   * Get list of active workers
   */
  protected getActiveWorkers(): string[] {
    return Array.from(this.workers.keys());
  }

  /**
   * Get total worker count
   */
  protected getWorkerCount(): number {
    return this.workers.size;
  }

  /**
   * Setup event handlers for a worker
   */
  private setupWorkerHandlers(name: string, worker: Worker): void {
    worker.onmessage = (event) => {
      const message: WorkerMessage = {
        id: event.data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: event.data.type || 'message',
        data: event.data.data || event.data,
        timestamp: Date.now(),
      };

      this.handleWorkerMessage(name, message);
    };

    worker.onerror = (error) => {
      const errorMessage = `Worker error: ${error.message || 'Unknown error'}`;
      this.updateWorkerStatus(name, {
        initialized: true,
        running: false,
        error: errorMessage,
        messageCount: this.getCurrentWorkerStatus(name).messageCount,
      });
    };

    worker.onmessageerror = (event) => {
      this.logError(`Worker message error for ${name}:`, event);
    };

    // Auto-cleanup when service is destroyed
    this.destroyRef.onDestroy(() => {
      if (this.workers.has(name)) {
        this.terminateWorker(name);
      }
    });
  }

  /**
   * Handle incoming worker messages
   */
  private handleWorkerMessage(workerName: string, message: WorkerMessage): void {
    let subject = this.workerMessages.get(workerName);
    if (!subject) {
      subject = new Subject<WorkerMessage>();
      this.workerMessages.set(workerName, subject);
    }
    subject.next(message);
  }

  /**
   * Update worker status
   */
  private updateWorkerStatus(workerName: string, status: WorkerStatus): void {
    let subject = this.workerStatuses.get(workerName);
    if (!subject) {
      subject = new Subject<WorkerStatus>();
      this.workerStatuses.set(workerName, subject);
    }
    subject.next(status);
  }

  /**
   * Get current worker status
   */
  private getCurrentWorkerStatus(workerName: string): WorkerStatus {
    return {
      initialized: false,
      running: false,
      messageCount: 0,
    };
  }

  /**
   * Increment message count for a worker
   */
  private incrementMessageCount(workerName: string): void {
    const currentStatus = this.getCurrentWorkerStatus(workerName);
    this.updateWorkerStatus(workerName, {
      ...currentStatus,
      messageCount: currentStatus.messageCount + 1,
    });
  }
}
