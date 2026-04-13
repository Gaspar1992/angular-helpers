import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConnectionRegistryBaseService } from './base/connection-registry-base.service';

export type SSEConnectionState = 'connecting' | 'open' | 'closed';

export interface SSEMessage<T = unknown> {
  data: T;
  type: string;
  lastEventId: string;
  origin: string;
}

export interface SSEConfig {
  withCredentials?: boolean;
  eventTypes?: string[];
}

@Injectable()
export class ServerSentEventsService extends ConnectionRegistryBaseService<EventSource> {
  protected override getApiName(): string {
    return 'server-sent-events';
  }

  protected override closeNativeConnection(source: EventSource): void {
    source.close();
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'EventSource' in window;
  }

  private ensureSSESupported(): void {
    if (!this.isSupported()) {
      throw new Error('Server-Sent Events (EventSource) not supported in this environment');
    }
  }

  connect<T = unknown>(url: string, config: SSEConfig = {}): Observable<SSEMessage<T>> {
    this.ensureSSESupported();

    return new Observable<SSEMessage<T>>((observer) => {
      const source = new EventSource(url, { withCredentials: config.withCredentials ?? false });
      this.connections.set(url, source);

      const messageHandler = (event: MessageEvent) => {
        try {
          observer.next({
            data: JSON.parse(event.data) as T,
            type: event.type,
            lastEventId: event.lastEventId,
            origin: event.origin,
          });
        } catch {
          observer.next({
            data: event.data as T,
            type: event.type,
            lastEventId: event.lastEventId,
            origin: event.origin,
          });
        }
      };

      const errorHandler = (event: Event) => {
        if (source.readyState === EventSource.CLOSED) {
          observer.error(new Error('SSE connection closed unexpectedly'));
        } else {
          this.logWarn('SSE connection error, reconnecting...');
        }
      };

      source.addEventListener('message', messageHandler);
      source.addEventListener('error', errorHandler);

      if (config.eventTypes) {
        for (const type of config.eventTypes) {
          source.addEventListener(type, messageHandler);
        }
      }

      const cleanup = () => {
        this.disconnect(url);
      };

      this.destroyRef.onDestroy(cleanup);

      return cleanup;
    });
  }

  disconnect(url: string): void {
    this.removeConnection(url);
  }

  disconnectAll(): void {
    this.closeAllConnections();
  }

  getState(url: string): SSEConnectionState {
    const source = this.connections.get(url);
    if (!source) return 'closed';
    const states: SSEConnectionState[] = ['connecting', 'open', 'closed'];
    return states[source.readyState] ?? 'closed';
  }

  getActiveConnections(): string[] {
    return this.getConnectionKeys();
  }
}
