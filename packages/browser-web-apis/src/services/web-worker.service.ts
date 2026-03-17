import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';

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

@Injectable()
export class WebWorkerService extends BrowserApiBaseService {
  private workers = new Map<string, Worker>();
  private workerStatuses = new Map<string, Subject<WorkerStatus>>();
  private workerMessages = new Map<string, Subject<WorkerMessage>>();
  private destroy$ = new Subject<void>();

  constructor() {
    super();
  }

  protected override getApiName(): string {
    return 'webworker';
  }

  protected override async onInitialize(): Promise<void> {
    await super.onInitialize();
    this.logInfo('WebWorker service initialized');
  }

  ngOnDestroy(): void {
    this.terminateAllWorkers();
    this.destroy$.next();
    this.destroy$.complete();
  }

  override isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  createWorker(name: string, scriptUrl: string): Observable<WorkerStatus> {
    if (!this.isSupported()) {
      const error = 'Web Workers not supported';
      this.updateWorkerStatus(name, { initialized: false, running: false, error, messageCount: 0 });
      return this.getWorkerStatus(name);
    }

    try {
      this.terminateWorker(name);
      const worker = new Worker(scriptUrl);
      this.workers.set(name, worker);

      this.updateWorkerStatus(name, {
        initialized: true,
        running: true,
        messageCount: 0
      });

      worker.onmessage = (event) => {
        const message: WorkerMessage = {
          id: event.data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: event.data.type || 'message',
          data: event.data.data || event.data,
          timestamp: Date.now()
        };
        this.handleWorkerMessage(name, message);
      };

      worker.onerror = (error) => {
        const errorMessage = `Worker error: ${error.message || 'Unknown error'}`;
        this.updateWorkerStatus(name, {
          initialized: true,
          running: false,
          error: errorMessage,
          messageCount: this.getCurrentWorkerStatus(name).messageCount
        });
      };

    } catch (error) {
      const errorMessage = `Failed to create worker: ${error}`;
      this.updateWorkerStatus(name, {
        initialized: false,
        running: false,
        error: errorMessage,
        messageCount: 0
      });
    }

    return this.getWorkerStatus(name);
  }

  createWorkerFromCode(name: string, workerCode: string): Observable<WorkerStatus> {
    if (!this.isSupported()) {
      const error = 'Web Workers not supported';
      this.updateWorkerStatus(name, { initialized: false, running: false, error, messageCount: 0 });
      return this.getWorkerStatus(name);
    }

    try {
      this.terminateWorker(name);
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      this.workers.set(name, worker);

      this.updateWorkerStatus(name, {
        initialized: true,
        running: true,
        messageCount: 0
      });

      worker.onmessage = (event) => {
        const message: WorkerMessage = {
          id: event.data.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: event.data.type || 'message',
          data: event.data.data || event.data,
          timestamp: Date.now()
        };
        this.handleWorkerMessage(name, message);
      };

      worker.onerror = (error) => {
        const errorMessage = `Worker error: ${error.message || 'Unknown error'}`;
        this.updateWorkerStatus(name, {
          initialized: true,
          running: false,
          error: errorMessage,
          messageCount: this.getCurrentWorkerStatus(name).messageCount
        });
      };

    } catch (error) {
      const errorMessage = `Failed to create worker from code: ${error}`;
      this.updateWorkerStatus(name, {
        initialized: false,
        running: false,
        error: errorMessage,
        messageCount: 0
      });
    }

    return this.getWorkerStatus(name);
  }

  private handleWorkerMessage(workerName: string, message: WorkerMessage): void {
    const currentStatus = this.getCurrentWorkerStatus(workerName);
    this.updateWorkerStatus(workerName, {
      ...currentStatus,
      messageCount: currentStatus.messageCount + 1
    });

    let subject = this.workerMessages.get(workerName);
    if (!subject) {
      subject = new Subject<WorkerMessage>();
      this.workerMessages.set(workerName, subject);
    }
    subject.next(message);
  }

  postMessage(workerName: string, task: WorkerTask): void {
    const worker = this.workers.get(workerName);
    if (!worker) {
      this.logError(`Worker ${workerName} not found`);
      return;
    }

    try {
      const message = { ...task, timestamp: Date.now() };

      if (task.transferable) {
        worker.postMessage(message, task.transferable);
      } else {
        worker.postMessage(message);
      }

      const currentStatus = this.getCurrentWorkerStatus(workerName);
      this.updateWorkerStatus(workerName, {
        ...currentStatus,
        messageCount: currentStatus.messageCount + 1
      });
    } catch (error) {
      this.logError(`Failed to post message to worker ${workerName}:`, error);
    }
  }

  getMessages(workerName: string): Observable<WorkerMessage> {
    if (!this.workerMessages.has(workerName)) {
      this.workerMessages.set(workerName, new Subject<WorkerMessage>());
    }
    return this.workerMessages.get(workerName)!.asObservable();
  }

  getWorkerStatus(workerName: string): Observable<WorkerStatus> {
    let subject = this.workerStatuses.get(workerName);
    if (!subject) {
      subject = new Subject<WorkerStatus>();
      this.workerStatuses.set(workerName, subject);
    }
    return subject.asObservable();
  }

  private getCurrentWorkerStatus(workerName: string): WorkerStatus {
    return {
      initialized: false,
      running: false,
      messageCount: 0
    };
  }

  private updateWorkerStatus(workerName: string, status: WorkerStatus): void {
    let subject = this.workerStatuses.get(workerName);
    if (!subject) {
      subject = new Subject<WorkerStatus>();
      this.workerStatuses.set(workerName, subject);
    }
    subject.next(status);
  }

  terminateWorker(workerName: string): boolean {
    const worker = this.workers.get(workerName);
    if (worker) {
      worker.terminate();
      this.workers.delete(workerName);
      this.updateWorkerStatus(workerName, {
        initialized: false,
        running: false,
        messageCount: this.getCurrentWorkerStatus(workerName).messageCount
      });
      return true;
    }
    return false;
  }

  terminateAllWorkers(): void {
    this.workers.forEach((worker, name) => {
      this.terminateWorker(name);
    });
  }

  isWorkerInitialized(workerName: string): boolean {
    return this.getCurrentWorkerStatus(workerName).initialized;
  }
}
