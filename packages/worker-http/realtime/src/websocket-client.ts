import { DestroyRef, signal, type Signal, type WritableSignal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface WebSocketClientConfig {
  url: string;
  protocols?: string | string[];
  /** Initial reconnect delay in ms. Set to 0 or omit to disable automatic reconnection. */
  reconnectInterval?: number;
  /** Max number of reconnect attempts. Defaults to 0 (disabled). */
  maxReconnectAttempts?: number;
  /** Hard cap for reconnect delay in ms. Defaults to 30_000. */
  maxReconnectDelay?: number;
  /** Heartbeat interval in ms. */
  heartbeatInterval?: number;
  /** Payload sent on every heartbeat tick. */
  heartbeatMessage?: unknown;
}

export interface WebSocketMessage<T = unknown> {
  id?: string;
  type: string;
  data: T;
  correlationId?: string;
  timestamp?: number;
}

export type WebSocketState = 'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting';

export interface WebSocketStatus {
  readonly state: WebSocketState;
  readonly reconnectAttempts: number;
  readonly error: string | null;
}

export interface WebSocketRequestOptions {
  timeout?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_REQUEST_TIMEOUT = 30_000;

/**
 * Client for managing WebSocket connections off-main-thread running in a Web Worker.
 */
export class WorkerWebSocketClient {
  private readonly connectionId: string;
  private readonly _status: WritableSignal<WebSocketStatus>;
  private readonly _messages$ = new Subject<WebSocketMessage>();
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private readonly listener: (event: MessageEvent) => void;
  private disposed = false;

  constructor(
    private readonly worker: Worker | MessagePort,
    private readonly config: WebSocketClientConfig,
    destroyRef?: DestroyRef,
  ) {
    this.connectionId = `ws-${this.generateId()}`;

    this._status = signal<WebSocketStatus>({
      state: 'idle',
      reconnectAttempts: 0,
      error: null,
    });

    this.listener = (event: MessageEvent) => {
      const msg = event.data;
      if (msg && msg.connectionId === this.connectionId) {
        if (msg.type === 'ws-status') {
          this.updateStatus({
            state: msg.state,
            reconnectAttempts: msg.reconnectAttempts ?? 0,
            error: msg.error,
          });
        } else if (msg.type === 'ws-message') {
          this.handleIncoming(msg.data);
        }
      }
    };

    this.worker.addEventListener('message', this.listener as EventListener);

    if (destroyRef) {
      destroyRef.onDestroy(() => this.close());
    }

    this.connect();
  }

  get status(): Signal<WebSocketStatus> {
    return this._status.asReadonly();
  }

  get messages$(): Observable<WebSocketMessage> {
    return this._messages$.asObservable();
  }

  messagesByType<T = unknown>(type: string): Observable<WebSocketMessage<T>> {
    return this._messages$
      .asObservable()
      .pipe(filter((msg): msg is WebSocketMessage<T> => msg.type === type));
  }

  send<T>(message: WebSocketMessage<T>): void {
    if (this.disposed) {
      throw new Error('WebSocket client is closed');
    }
    const enriched = {
      ...message,
      id: message.id ?? this.generateId(),
      timestamp: message.timestamp ?? Date.now(),
    };
    this.worker.postMessage({
      type: 'send-ws',
      connectionId: this.connectionId,
      data: JSON.stringify(enriched),
    });
  }

  sendRaw(data: string): void {
    if (this.disposed) {
      throw new Error('WebSocket client is closed');
    }
    this.worker.postMessage({
      type: 'send-ws',
      connectionId: this.connectionId,
      data,
    });
  }

  request<TRes = unknown, TReq = unknown>(
    type: string,
    data: TReq,
    opts?: WebSocketRequestOptions,
  ): Promise<TRes> {
    const id = this.generateId();
    const timeoutMs = opts?.timeout ?? DEFAULT_REQUEST_TIMEOUT;

    return new Promise<TRes>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`WebSocket request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      try {
        this.send({ id, type, data, correlationId: id } as WebSocketMessage<TReq>);
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(id);
        reject(error instanceof Error ? error : new Error('WebSocket send failed'));
      }
    });
  }

  close(): void {
    if (this.disposed) return;
    this.disposed = true;

    this.worker.postMessage({
      type: 'close-ws',
      connectionId: this.connectionId,
    });

    this.worker.removeEventListener('message', this.listener as EventListener);
    this.rejectAllPending(new Error('WebSocket closed'));
    this.updateStatus({ state: 'closed', error: null });
  }

  private connect(): void {
    this.worker.postMessage({
      type: 'connect-ws',
      connectionId: this.connectionId,
      url: this.config.url,
      protocols: this.config.protocols,
      reconnectInterval: this.config.reconnectInterval,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      maxReconnectDelay: this.config.maxReconnectDelay,
      heartbeatInterval: this.config.heartbeatInterval,
      heartbeatMessage: this.config.heartbeatMessage,
    });
  }

  private handleIncoming(raw: unknown): void {
    let message: WebSocketMessage;
    try {
      const text = typeof raw === 'string' ? raw : String(raw);
      message = JSON.parse(text) as WebSocketMessage;
    } catch (error) {
      // If parsing fails, treat it as a raw message without correlation
      message = {
        type: 'raw',
        data: raw,
      };
    }

    const correlationId = message.correlationId ?? message.id;
    if (correlationId && this.pendingRequests.has(correlationId)) {
      const pending = this.pendingRequests.get(correlationId)!;
      clearTimeout(pending.timer);
      this.pendingRequests.delete(correlationId);
      pending.resolve(message.data);
      return;
    }

    this._messages$.next(message);
  }

  private rejectAllPending(reason: Error): void {
    this.pendingRequests.forEach((entry) => {
      clearTimeout(entry.timer);
      entry.reject(reason);
    });
    this.pendingRequests.clear();
  }

  private updateStatus(partial: Partial<WebSocketStatus>): void {
    this._status.update((current) => ({ ...current, ...partial }));
  }

  private generateId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15);
  }
}
