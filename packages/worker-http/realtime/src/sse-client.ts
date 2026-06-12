import { DestroyRef, signal, type Signal, type WritableSignal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SseClientConfig {
  url: string;
  withCredentials?: boolean;
  /** List of custom event names to listen to. */
  events?: string[];
}

export interface SseMessage<T = unknown> {
  id: string | null;
  event: string;
  data: T;
  lastEventId: string | null;
}

export type SseState = 'idle' | 'connecting' | 'open' | 'closed';

export interface SseStatus {
  readonly state: SseState;
  readonly error: string | null;
}

/**
 * Client for managing Server-Sent Events (SSE) connections off-main-thread running in a Web Worker.
 */
export class WorkerSseClient {
  private readonly connectionId: string;
  private readonly _status: WritableSignal<SseStatus>;
  private readonly _events$ = new Subject<SseMessage>();
  private readonly listener: (event: MessageEvent) => void;
  private disposed = false;

  constructor(
    private readonly worker: Worker | MessagePort,
    private readonly config: SseClientConfig,
    destroyRef?: DestroyRef,
  ) {
    this.connectionId = `sse-${this.generateId()}`;

    this._status = signal<SseStatus>({
      state: 'idle',
      error: null,
    });

    this.listener = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && msg.connectionId === this.connectionId) {
        if (msg.type === 'sse-status') {
          this.updateStatus({
            state: msg.state,
            error: msg.error,
          });
        } else if (msg.type === 'sse-message') {
          this._events$.next({
            id: msg.id ?? null,
            event: msg.event ?? 'message',
            data: this.parseData(msg.data),
            lastEventId: msg.lastEventId ?? null,
          });
        }
      }
    };

    this.worker.addEventListener('message', this.listener as EventListener);

    if (destroyRef) {
      destroyRef.onDestroy(() => this.close());
    }

    this.connect();
  }

  get status(): Signal<SseStatus> {
    return this._status.asReadonly();
  }

  get events$(): Observable<SseMessage> {
    return this._events$.asObservable();
  }

  close(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.worker.postMessage({
      type: 'close-sse',
      connectionId: this.connectionId,
    });

    this.worker.removeEventListener('message', this.listener as EventListener);
    this._status.set({ state: 'closed', error: null });
  }

  private connect(): void {
    this.worker.postMessage({
      type: 'connect-sse',
      connectionId: this.connectionId,
      url: this.config.url,
      withCredentials: this.config.withCredentials,
      events: this.config.events,
    });
  }

  private parseData(raw: unknown): unknown {
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  }

  private updateStatus(partial: Partial<SseStatus>): void {
    this._status.update((current) => ({ ...current, ...partial }));
  }

  private generateId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
  }
}
