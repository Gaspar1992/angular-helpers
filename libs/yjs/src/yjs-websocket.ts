import { DestroyRef, inject, signal, type Signal } from '@angular/core';
import type * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export type YjsWebsocketStatus = 'connecting' | 'connected' | 'disconnected';

export interface YjsWebsocketOptions {
  params?: Record<string, string>;
  awareness?: any;
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
  /** The underlying y-websocket WebsocketProvider instance */
  readonly provider: WebsocketProvider;
  /** Manually establish connection */
  connect(): void;
  /** Manually disconnect from server */
  disconnect(): void;
}

/**
 * Reactive Angular adapter for y-websocket provider.
 * Connects a Y.Doc to a WebSocket server and exposes connection status and synced state as Signals.
 *
 * @param serverUrl The WebSocket server endpoint (e.g. 'wss://demos.yjs.dev')
 * @param roomName The room/document identifier
 * @param doc The target Y.Doc instance
 * @param options Configuration options for y-websocket WebsocketProvider
 */
export function injectYjsWebsocket(
  serverUrl: string,
  roomName: string,
  doc: Y.Doc,
  options?: YjsWebsocketOptions,
): YjsWebsocketRef {
  const destroyRef = inject(DestroyRef);

  const provider = new WebsocketProvider(serverUrl, roomName, doc, options);

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
