import { inject, Injectable, signal, type Signal, type WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import { BROWSER_API_LOGGER } from '../tokens/logger.token';

export interface WorkerMessage<T = unknown> {
  id: string;
  type: string;
  data: T;
  timestamp: number;
  /** Set on responses to correlate with a `request()` call. */
  correlationId?: string;
}

export interface WorkerStatus {
  initialized: boolean;
  running: boolean;
  error?: string;
  messageCount: number;
}

export interface WorkerTask<T = unknown> {
  id?: string;
  type: string;
  data: T;
  transferable?: Transferable[];
}

export interface WorkerRequestOptions {
  /** Timeout in milliseconds. Defaults to `30_000`. */
  timeout?: number;
  /** Transferable list forwarded to `postMessage`. */
  transferable?: Transferable[];
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface WorkerEntry {
  worker: Worker | null;
  status: WritableSignal<WorkerStatus>;
  messages$: Subject<WorkerMessage>;
  pending: Map<string, PendingRequest>;
}

const DEFAULT_REQUEST_TIMEOUT = 30_000;

/**
 * Service for creating and managing Web Workers with first-class support for
 * request/response over `postMessage` (id correlation, timeout, transferables).
 *
 * Status is exposed both as a `Signal<WorkerStatus>` (preferred via
 * {@link getStatusSignal}) and as an `Observable<WorkerStatus>` for backward
 * compatibility ({@link createWorker}, {@link getStatus}).
 *
 * The service registers a single `DestroyRef.onDestroy` in its constructor that
 * terminates every registered worker; per-worker handlers do not register their
 * own cleanup callbacks (avoids accumulating callbacks per `setupWorker` call,
 * a previous leak source).
 */
@Injectable()
export class WebWorkerService extends BrowserApiBaseService {
  private readonly workerLogger = inject(BROWSER_API_LOGGER);
  private readonly entries = new Map<string, WorkerEntry>();
  private readonly _cleanup = this.destroyRef.onDestroy(() => this.terminateAllWorkers());

  protected override getApiName(): string {
    return 'webworker';
  }

  /**
   * Create a worker. Idempotent: calling twice with the same name returns the
   * existing entry without recreating the worker.
   *
   * Returns an `Observable<WorkerStatus>` for backward compatibility. Prefer
   * {@link createWorkerSignal} for new code.
   */
  createWorker(name: string, scriptUrl: string): Observable<WorkerStatus> {
    const status = this.createWorkerSignal(name, scriptUrl);
    return toObservable(status);
  }

  /**
   * Create a worker (signal-first). Returns the status signal; status is also
   * accessible later via {@link getStatusSignal}.
   */
  createWorkerSignal(name: string, scriptUrl: string): Signal<WorkerStatus> {
    this.ensureSupported();
    const existing = this.entries.get(name);
    if (existing && existing.worker) return existing.status.asReadonly();

    const entry = this.ensureEntry(name);
    try {
      const worker = new Worker(scriptUrl);
      entry.worker = worker;
      this.attachHandlers(name, entry);
      entry.status.set({ initialized: true, running: true, messageCount: 0 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      entry.status.set({ initialized: false, running: false, error: message, messageCount: 0 });
      this.workerLogger.error(`[webworker] Failed to create worker "${name}"`, error);
    }
    return entry.status.asReadonly();
  }

  terminateWorker(name: string): void {
    const entry = this.entries.get(name);
    if (!entry) return;
    this.rejectPending(entry, new Error(`Worker "${name}" terminated`));
    if (entry.worker) entry.worker.terminate();
    entry.messages$.complete();
    this.entries.delete(name);
  }

  terminateAllWorkers(): void {
    for (const name of [...this.entries.keys()]) {
      this.terminateWorker(name);
    }
  }

  /** Send a fire-and-forget message. Use {@link request} when you need a reply. */
  postMessage(workerName: string, task: WorkerTask): void {
    const entry = this.entries.get(workerName);
    if (!entry || !entry.worker) {
      this.workerLogger.error(`[webworker] postMessage: worker "${workerName}" not found`);
      return;
    }
    const message: WorkerMessage = {
      id: task.id ?? this.generateId(),
      type: task.type,
      data: task.data,
      timestamp: Date.now(),
    };
    try {
      if (task.transferable) {
        entry.worker.postMessage(message, task.transferable);
      } else {
        entry.worker.postMessage(message);
      }
      this.bumpMessageCount(entry);
    } catch (error) {
      this.workerLogger.error(`[webworker] postMessage failed for "${workerName}"`, error);
    }
  }

  /**
   * Send a message and await a correlated response. The worker MUST send back a
   * message containing `correlationId` matching the request id.
   *
   * ```ts
   * const result = await ws.request<{ ok: boolean }>('worker', 'compute', { n: 1 });
   * ```
   */
  request<TRes = unknown, TReq = unknown>(
    workerName: string,
    type: string,
    data: TReq,
    opts?: WorkerRequestOptions,
  ): Promise<TRes> {
    const entry = this.entries.get(workerName);
    if (!entry || !entry.worker) {
      return Promise.reject(new Error(`Worker "${workerName}" not found`));
    }
    const id = this.generateId();
    const timeoutMs = opts?.timeout ?? DEFAULT_REQUEST_TIMEOUT;

    return new Promise<TRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        entry.pending.delete(id);
        reject(new Error(`WebWorker "${workerName}" request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      entry.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      const message: WorkerMessage = {
        id,
        type,
        data,
        timestamp: Date.now(),
        correlationId: id,
      };
      try {
        if (opts?.transferable) {
          entry.worker!.postMessage(message, opts.transferable);
        } else {
          entry.worker!.postMessage(message);
        }
        this.bumpMessageCount(entry);
      } catch (error) {
        clearTimeout(timer);
        entry.pending.delete(id);
        reject(error instanceof Error ? error : new Error('postMessage failed'));
      }
    });
  }

  getMessages<T = unknown>(workerName: string): Observable<WorkerMessage<T>> {
    const entry = this.ensureEntry(workerName);
    return entry.messages$.asObservable() as Observable<WorkerMessage<T>>;
  }

  getMessagesByType<T = unknown>(workerName: string, type: string): Observable<WorkerMessage<T>> {
    return this.getMessages<T>(workerName).pipe(filter((m) => m.type === type));
  }

  /** @deprecated Use {@link getStatusSignal}. Kept as Observable for backward compat. */
  getStatus(workerName: string): Observable<WorkerStatus> {
    return toObservable(this.getStatusSignal(workerName));
  }

  getStatusSignal(workerName: string): Signal<WorkerStatus> {
    return this.ensureEntry(workerName).status.asReadonly();
  }

  getCurrentStatus(workerName: string): WorkerStatus | undefined {
    return this.entries.get(workerName)?.status();
  }

  getAllStatuses(): Map<string, WorkerStatus> {
    const result = new Map<string, WorkerStatus>();
    for (const [name, entry] of this.entries) result.set(name, entry.status());
    return result;
  }

  isWorkerRunning(workerName: string): boolean {
    return this.entries.get(workerName)?.status().running ?? false;
  }

  getNativeWorker(name: string): Worker | undefined {
    return this.entries.get(name)?.worker ?? undefined;
  }

  getAllWorkers(): Map<string, Worker> {
    const result = new Map<string, Worker>();
    for (const [name, entry] of this.entries) {
      if (entry.worker) result.set(name, entry.worker);
    }
    return result;
  }

  // ---------- internals ----------

  private attachHandlers(name: string, entry: WorkerEntry): void {
    if (!entry.worker) return;

    entry.worker.onmessage = (event) => {
      const data = event.data ?? {};
      const correlationId: string | undefined = data.correlationId ?? data.id;
      if (correlationId && entry.pending.has(correlationId)) {
        const p = entry.pending.get(correlationId)!;
        clearTimeout(p.timer);
        entry.pending.delete(correlationId);
        p.resolve(data.data);
        return;
      }

      const message: WorkerMessage = {
        id: data.id ?? this.generateId(),
        type: data.type ?? 'message',
        data: data.data,
        timestamp: data.timestamp ?? Date.now(),
        correlationId: data.correlationId,
      };
      entry.messages$.next(message);
    };

    entry.worker.onerror = (error) => {
      this.workerLogger.error(`[webworker] Worker "${name}" error`, error);
      entry.status.update((s) => ({
        ...s,
        running: false,
        error: error instanceof Error ? error.message : 'Worker error',
      }));
    };
  }

  private rejectPending(entry: WorkerEntry, reason: Error): void {
    for (const p of entry.pending.values()) {
      clearTimeout(p.timer);
      p.reject(reason);
    }
    entry.pending.clear();
  }

  private bumpMessageCount(entry: WorkerEntry): void {
    entry.status.update((s) => ({ ...s, messageCount: s.messageCount + 1 }));
  }

  private ensureEntry(workerName: string): WorkerEntry {
    let entry = this.entries.get(workerName);
    if (!entry) {
      entry = {
        worker: null,
        status: signal<WorkerStatus>({ initialized: false, running: false, messageCount: 0 }),
        messages$: new Subject<WorkerMessage>(),
        pending: new Map(),
      };
      this.entries.set(workerName, entry);
    }
    return entry;
  }

  private generateId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
