import { Injectable, inject, DestroyRef, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

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
export class ServerSentEventsService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private sources = new Map<string, EventSource>();

  isSupported(): boolean {
    return isPlatformBrowser(this.platformId) && 'EventSource' in window;
  }

  private ensureSupport(): void {
    if (!this.isSupported()) {
      throw new Error('Server-Sent Events (EventSource) not supported in this environment');
    }
  }

  connect<T = unknown>(url: string, config: SSEConfig = {}): Observable<SSEMessage<T>> {
    this.ensureSupport();

    return new Observable<SSEMessage<T>>((observer) => {
      const source = new EventSource(url, { withCredentials: config.withCredentials ?? false });
      this.sources.set(url, source);

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
          console.warn('[ServerSentEventsService] SSE connection error, reconnecting...', event);
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
    const source = this.sources.get(url);
    if (source) {
      source.close();
      this.sources.delete(url);
    }
  }

  disconnectAll(): void {
    this.sources.forEach((source) => source.close());
    this.sources.clear();
  }

  getState(url: string): SSEConnectionState {
    const source = this.sources.get(url);
    if (!source) return 'closed';
    const states: SSEConnectionState[] = ['connecting', 'open', 'closed'];
    return states[source.readyState] ?? 'closed';
  }

  getActiveConnections(): string[] {
    return Array.from(this.sources.keys());
  }
}
