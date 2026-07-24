import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';
import { BROWSER_API_LOGGER } from '../tokens/logger.token';
import {
  WebSocketClient,
  type WebSocketClientConfig,
  type WebSocketMessage,
  type WebSocketStatusV2,
} from '../clients/web-socket.client';

/**
 * @deprecated Use `WebSocketStatusV2` (via `WebSocketClient.status`).
 * Kept for backward compatibility — will be removed in v22.
 */
export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error?: string;
  reconnectAttempts: number;
}

/**
 * @deprecated Use `WebSocketClientConfig`. Kept as alias for backward compatibility.
 */
export type WebSocketConfig = WebSocketClientConfig & {
  /** @deprecated Use `heartbeatMessage` directly. */
  heartbeatMessage?: unknown;
};

export type { WebSocketClientConfig, WebSocketMessage, WebSocketStatusV2 };
export { WebSocketClient };

let legacyDeprecationLogged = false;

/**
 * Service that creates and tracks `WebSocketClient` instances.
 *
 * Preferred usage:
 * ```ts
 * const ws = inject(WebSocketService);
 * const client = ws.createClient({ url: 'wss://...' });
 * effect(() => console.log(client.status()));
 * await client.request('ping', {});
 * ```
 *
 * Legacy usage (`connect()` returning Observable) is preserved for one minor cycle
 * and will be removed in v22.
 */
@Injectable()
export class WebSocketService extends BrowserApiBaseService {
  private readonly wsLogger = inject(BROWSER_API_LOGGER);
  private readonly clients = new Set<WebSocketClient>();
  private readonly _cleanup = this.destroyRef.onDestroy(() => this.disposeAll());

  /** Legacy single-connection holder used by deprecated `connect()`/`send()` API. */
  private legacyClient: WebSocketClient | null = null;

  protected override getApiName(): string {
    return 'websocket';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'webSocket';
  }

  /**
   * Create a new WebSocket client. The client owns one connection and is the recommended
   * surface for all interactions (status signal, request/response, reconnect, etc.).
   *
   * The returned client is automatically disposed when the host injector is destroyed.
   */
  createClient(config: WebSocketClientConfig): WebSocketClient {
    this.ensureSupported();
    const client = new WebSocketClient(config, this.wsLogger, this.destroyRef);
    this.clients.add(client);
    return client;
  }

  /** Dispose every client created via `createClient()` (also called automatically on destroy). */
  disposeAll(): void {
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();
    if (this.legacyClient) {
      this.legacyClient.close();
      this.legacyClient = null;
    }
  }

  // ---------- legacy API (deprecated) ----------

  /**
   * @deprecated Use {@link createClient} which returns a `WebSocketClient` exposing a
   * status signal, request/response, and proper reconnect. This wrapper will be removed
   * in v22.
   */
  connect(config: WebSocketConfig): Observable<WebSocketStatus> {
    this.ensureSupported();
    this.warnLegacyOnce();

    return new Observable<WebSocketStatus>((observer) => {
      if (this.legacyClient) {
        this.legacyClient.close();
      }
      const client = new WebSocketClient(config, this.wsLogger);
      this.legacyClient = client;

      const sub = toObservableLike(client).subscribe({
        next: (status) => observer.next(status),
        error: (err) => observer.error(err),
      });

      return () => {
        sub.unsubscribe();
        client.close();
        if (this.legacyClient === client) {
          this.legacyClient = null;
        }
      };
    });
  }

  /** @deprecated Use {@link createClient} and call `client.close()`. */
  disconnect(): void {
    if (this.legacyClient) {
      this.legacyClient.close();
      this.legacyClient = null;
    }
  }

  /** @deprecated Use the client returned by {@link createClient}. */
  send<T>(message: WebSocketMessage<T>): void {
    if (!this.legacyClient) {
      throw new Error('No active legacy WebSocket. Call connect() first or use createClient().');
    }
    this.legacyClient.send(message);
  }

  /** @deprecated Use the client returned by {@link createClient}. */
  sendRaw(data: string): void {
    if (!this.legacyClient) {
      throw new Error('No active legacy WebSocket. Call connect() first or use createClient().');
    }
    this.legacyClient.sendRaw(data);
  }

  /** @deprecated Use `client.status` from {@link createClient}. */
  getStatus(): Observable<WebSocketStatus> {
    return new Observable<WebSocketStatus>((observer) => {
      if (!this.legacyClient) {
        observer.next({
          connected: false,
          connecting: false,
          reconnecting: false,
          reconnectAttempts: 0,
        });
        return () => {
          // No-op
        };
      }
      const sub = toObservableLike(this.legacyClient).subscribe((status) => observer.next(status));
      return () => sub.unsubscribe();
    });
  }

  /** @deprecated Use `client.messages$` from {@link createClient}. */
  getMessages<T = unknown>(): Observable<WebSocketMessage<T>> {
    if (!this.legacyClient) {
      return new Observable<WebSocketMessage<T>>(() => {
        // No-op stream until connected.
      });
    }
    return this.legacyClient.messages$ as Observable<WebSocketMessage<T>>;
  }

  /** @deprecated Use `client.messagesByType()` from {@link createClient}. */
  getMessagesByType<T = unknown>(type: string): Observable<WebSocketMessage<T>> {
    if (!this.legacyClient) {
      return new Observable<WebSocketMessage<T>>(() => {
        // No-op stream until connected.
      });
    }
    return this.legacyClient.messagesByType<T>(type);
  }

  /** @deprecated Use the client returned by {@link createClient}. */
  getNativeWebSocket(): WebSocket | null {
    return this.legacyClient?.getNativeSocket() ?? null;
  }

  /** @deprecated Use `client.status()` from {@link createClient}. */
  isConnected(): boolean {
    return this.legacyClient?.status().state === 'open';
  }

  /** @deprecated Use the native socket via `client.getNativeSocket()`. */
  getReadyState(): number {
    return this.legacyClient?.getNativeSocket()?.readyState ?? WebSocket.CLOSED;
  }

  private warnLegacyOnce(): void {
    if (legacyDeprecationLogged) return;
    legacyDeprecationLogged = true;
    this.wsLogger.warn(
      '[websocket] WebSocketService.connect() is deprecated. Use WebSocketService.createClient() ' +
        'which returns a WebSocketClient with a status signal, request/response, and proper reconnect. ' +
        'The legacy API will be removed in v22.',
    );
  }
}

/**
 * Build a stream of legacy `WebSocketStatus` snapshots from a v2 client. Used to keep the
 * deprecated `connect()` API behaving like before (Observable of legacy status).
 */
function toObservableLike(client: WebSocketClient): Observable<WebSocketStatus> {
  return new Observable<WebSocketStatus>((observer) => {
    const emit = () => {
      const v2 = client.status();
      observer.next({
        connected: v2.state === 'open',
        connecting: v2.state === 'connecting',
        reconnecting: v2.state === 'reconnecting',
        error: v2.error ?? undefined,
        reconnectAttempts: v2.reconnectAttempts,
      });
    };
    emit();
    const id = setInterval(emit, 100);
    return () => clearInterval(id);
  });
}
