import { DestroyRef, inject, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { YjsDocService } from '@angular-helpers/yjs';

export type YjsWebsocketStatus = 'connecting' | 'connected' | 'disconnected';

export interface YjsWebsocketOptions {
  params?: Record<string, string>;
  awareness?: unknown;
  connect?: boolean;
  resyncInterval?: number;
  maxBackoffTime?: number;
  WebSocketPolyfill?: typeof WebSocket;
}

export interface YjsWebsocketRef {
  /** Signal reflecting current connection status ('connecting' | 'connected' | 'disconnected') */
  readonly status: Signal<YjsWebsocketStatus>;
  /** Signal reflecting whether initial document synchronization has completed */
  readonly isSynced: Signal<boolean>;
  /** The underlying y-websocket WebsocketProvider instance, or null in SSR */
  readonly provider: WebsocketProvider | null;
  /** Manually establish connection */
  connect(): void;
  /** Manually disconnect from server */
  disconnect(): void;
}

/**
 * Reactive Angular adapter for y-websocket provider.
 * Connects a Y.Doc to a WebSocket server and exposes connection status and synced state as Signals.
 * SSR-safe: returns an inert disconnected ref when WebSocket is unavailable.
 */
export function injectYjsWebsocket(
  serverUrl: string,
  roomName: string,
  doc: Y.Doc = inject(YjsDocService).doc,
  options?: YjsWebsocketOptions,
): YjsWebsocketRef {
  const destroyRef = inject(DestroyRef);
  const platformId = inject(PLATFORM_ID, { optional: true });
  const isBrowser = platformId ? isPlatformBrowser(platformId) : typeof window !== 'undefined';
  const hasWebSocket =
    (isBrowser && typeof WebSocket !== 'undefined') || Boolean(options?.WebSocketPolyfill);

  if (!hasWebSocket) {
    const statusSig = signal<YjsWebsocketStatus>('disconnected');
    const isSyncedSig = signal<boolean>(false);
    return {
      status: statusSig.asReadonly(),
      isSynced: isSyncedSig.asReadonly(),
      provider: null,
      connect() {},
      disconnect() {},
    };
  }

  const provider = new WebsocketProvider(serverUrl, roomName, doc, options as never);

  const statusSig = signal<YjsWebsocketStatus>(
    provider.wsconnected ? 'connected' : provider.wsconnecting ? 'connecting' : 'disconnected',
  );
  const isSyncedSig = signal<boolean>(provider.synced);

  const handleStatus = (event: { status: YjsWebsocketStatus }) => {
    statusSig.set(event.status);
  };

  const handleSync = (isSynced: boolean) => {
    isSyncedSig.set(isSynced);
  };

  provider.on('status', handleStatus);
  provider.on('sync', handleSync);

  destroyRef.onDestroy(() => {
    provider.off('status', handleStatus);
    provider.off('sync', handleSync);
    provider.destroy();
  });

  return {
    status: statusSig.asReadonly(),
    isSynced: isSyncedSig.asReadonly(),
    provider,
    connect() {
      provider.connect();
    },
    disconnect() {
      provider.disconnect();
    },
  };
}
