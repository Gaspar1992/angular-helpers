import { DestroyRef, signal, type Signal, type WritableSignal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import type { BrowserApiLogger } from '../tokens/logger.token';

/**
 * Configuration for a single WebSocket connection.
 */
export interface WebSocketClientConfig {
  url: string;
  protocols?: string | string[];
  /**
   * Initial reconnect delay in milliseconds. Used as the base for exponential backoff.
   * Set to `0` or omit to disable automatic reconnection.
   */
  reconnectInterval?: number;
  /** Maximum number of automatic reconnect attempts. Defaults to `0` (disabled). */
  maxReconnectAttempts?: number;
  /** Hard cap for reconnect delay in milliseconds. Defaults to `30_000`. */
  maxReconnectDelay?: number;
  /** Heartbeat interval in milliseconds. */
  heartbeatInterval?: number;
  /** Payload sent on every heartbeat tick when `heartbeatInterval` is set. */
  heartbeatMessage?: unknown;
}

export interface WebSocketMessage<T = unknown> {
  /** Message identifier. Auto-generated when omitted. */
  id?: string;
  type: string;
  data: T;
  /** Server-assigned correlation id (used by `request()` to match responses). */
  correlationId?: string;
  timestamp?: number;
}

export type WebSocketState = 'idle' | 'connecting' | 'open' | 'closing' | 'closed' | 'reconnecting';

export interface WebSocketStatusV2 {
  readonly state: WebSocketState;
  readonly reconnectAttempts: number;
  readonly error: string | null;
}

export interface WebSocketRequestOptions {
  /** Timeout in milliseconds. Defaults to `30_000`. */
  timeout?: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

const DEFAULT_MAX_RECONNECT_DELAY = 30_000;
const DEFAULT_REQUEST_TIMEOUT = 30_000;

/**
 * Stateful WebSocket client wrapping a single connection. One instance per logical
 * connection (do NOT share between `connect()` calls).
 *
 * Surfaces:
 * - `status`: signal of the current connection state.
 * - `messages$`: stream of every received message (parsed JSON).
 * - `send` / `sendRaw`: outbound traffic.
 * - `request<T>(type, data)`: round-trip with id correlation and timeout.
 * - `close`: idempotent disposal.
 *
 * Reconnect uses exponential backoff with jitter, capped by `maxReconnectDelay`.
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly _status: WritableSignal<WebSocketStatusV2>;
  private readonly _messages$ = new Subject<WebSocketMessage>();
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private disposed = false;
  private reconnectAttempts = 0;

  constructor(
    private readonly config: WebSocketClientConfig,
    private readonly logger: BrowserApiLogger,
    destroyRef?: DestroyRef,
  ) {
    this._status = signal<WebSocketStatusV2>({
      state: 'idle',
      reconnectAttempts: 0,
      error: null,
    });
    if (destroyRef) {
      destroyRef.onDestroy(() => this.close());
    }
    this.openSocket();
  }

  get status(): Signal<WebSocketStatusV2> {
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
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    const enriched: WebSocketMessage<T> = {
      ...message,
      id: message.id ?? this.generateId(),
      timestamp: message.timestamp ?? Date.now(),
    };
    this.socket.send(JSON.stringify(enriched));
  }

  sendRaw(data: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.socket.send(data);
  }

  /**
   * Send a message and await a correlated response. The server MUST echo back the
   * `correlationId` from the request as `correlationId` on the response message.
   */
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
    this.clearTimers();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        // Ignore — already closing.
      }
      this.socket = null;
    }
    this.rejectAllPending(new Error('WebSocket closed'));
    this.updateStatus({ state: 'closed', error: null });
  }

  /** Internal handle for tests and advanced usage. */
  getNativeSocket(): WebSocket | null {
    return this.socket;
  }

  // ---------- internals ----------

  private openSocket(): void {
    if (this.disposed) return;
    this.updateStatus({ state: 'connecting', error: null });
    try {
      this.socket = new WebSocket(this.config.url, this.config.protocols);
      this.attachHandlers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'WebSocket open failed';
      this.logger.error('[websocket] Failed to construct socket', error);
      this.updateStatus({ state: 'closed', error: message });
      this.scheduleReconnect();
    }
  }

  private attachHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateStatus({ state: 'open', error: null, reconnectAttempts: 0 });
      this.startHeartbeat();
    };

    this.socket.onclose = (event) => {
      this.stopHeartbeat();
      if (this.disposed) return;
      this.updateStatus({
        state: 'closed',
        error: event.wasClean ? null : `closed: ${event.code} ${event.reason}`,
      });
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = () => {
      this.updateStatus({ error: 'WebSocket connection error' });
    };

    this.socket.onmessage = (event) => {
      this.handleIncoming(event.data);
    };
  }

  private handleIncoming(raw: unknown): void {
    let message: WebSocketMessage;
    try {
      const text = typeof raw === 'string' ? raw : String(raw);
      message = JSON.parse(text) as WebSocketMessage;
    } catch (error) {
      this.logger.warn('[websocket] Failed to parse incoming message');
      this.logger.error('[websocket] parse error', error);
      return;
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

  private scheduleReconnect(): void {
    if (this.disposed) return;
    const interval = this.config.reconnectInterval ?? 0;
    const maxAttempts = this.config.maxReconnectAttempts ?? 0;
    if (interval <= 0 || maxAttempts <= 0) return;
    if (this.reconnectAttempts >= maxAttempts) {
      this.updateStatus({
        state: 'closed',
        error: `Max reconnect attempts (${maxAttempts}) reached`,
      });
      return;
    }

    this.reconnectAttempts += 1;
    const delay = WebSocketClient.computeBackoffDelay(
      this.reconnectAttempts,
      interval,
      this.config.maxReconnectDelay ?? DEFAULT_MAX_RECONNECT_DELAY,
    );

    this.updateStatus({
      state: 'reconnecting',
      reconnectAttempts: this.reconnectAttempts,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }

  /**
   * Exponential backoff with full jitter:
   *   baseDelay = min(maxDelay, interval * 2^(attempt - 1))
   *   delay     = random(0, baseDelay)
   */
  static computeBackoffDelay(attempt: number, interval: number, maxDelay: number): number {
    const exp = Math.min(maxDelay, interval * Math.pow(2, attempt - 1));
    return Math.floor(Math.random() * exp);
  }

  private startHeartbeat(): void {
    const { heartbeatInterval, heartbeatMessage } = this.config;
    if (!heartbeatInterval || heartbeatMessage === undefined) return;
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.send({ type: 'heartbeat', data: heartbeatMessage });
        } catch (error) {
          this.logger.warn('[websocket] heartbeat send failed');
          this.logger.error('[websocket] heartbeat error', error);
        }
      }
    }, heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
  }

  private rejectAllPending(reason: Error): void {
    this.pendingRequests.forEach((entry) => {
      clearTimeout(entry.timer);
      entry.reject(reason);
    });
    this.pendingRequests.clear();
  }

  private updateStatus(partial: Partial<WebSocketStatusV2>): void {
    this._status.update((current) => ({ ...current, ...partial }));
  }

  private generateId(): string {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
