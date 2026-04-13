import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: unknown;
}

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
}

export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
  reconnecting: boolean;
  error?: string;
  reconnectAttempts: number;
}

@Injectable()
export class WebSocketService extends BrowserApiBaseService {
  private webSocket: WebSocket | null = null;
  private statusSubject = new BehaviorSubject<WebSocketStatus>({
    connected: false,
    connecting: false,
    reconnecting: false,
    reconnectAttempts: 0,
  });
  private messageSubject = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly _cleanup = this.destroyRef.onDestroy(() => this.disconnect());

  protected override getApiName(): string {
    return 'websocket';
  }

  protected override ensureSupported(): void {
    super.ensureSupported();
    if (typeof WebSocket === 'undefined') {
      throw new Error('WebSocket API not supported in this browser');
    }
  }

  connect(config: WebSocketConfig): Observable<WebSocketStatus> {
    this.ensureSupported();

    return new Observable<WebSocketStatus>((observer) => {
      this.disconnect(); // Disconnect existing connection if any

      this.updateStatus({
        connected: false,
        connecting: true,
        reconnecting: false,
        reconnectAttempts: 0,
      });

      try {
        this.webSocket = new WebSocket(config.url, config.protocols);
        this.setupWebSocketHandlers(config);
        observer.next(this.statusSubject.getValue());
      } catch (error) {
        this.logError('Error creating WebSocket:', error);
        this.updateStatus({
          connected: false,
          connecting: false,
          reconnecting: false,
          error: error instanceof Error ? error.message : 'Connection failed',
          reconnectAttempts: 0,
        });
        observer.next(this.statusSubject.getValue());
      }

      return () => {
        this.disconnect();
      };
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }

    this.updateStatus({
      connected: false,
      connecting: false,
      reconnecting: false,
      reconnectAttempts: 0,
    });
  }

  send<T>(message: WebSocketMessage<T>): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now(),
    };

    this.webSocket.send(JSON.stringify(messageWithTimestamp));
  }

  sendRaw(data: string): void {
    if (!this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.webSocket.send(data);
  }

  getStatus(): Observable<WebSocketStatus> {
    return this.statusSubject.asObservable();
  }

  getMessages<T = unknown>(): Observable<WebSocketMessage<T>> {
    return this.messageSubject.asObservable() as Observable<WebSocketMessage<T>>;
  }

  getMessagesByType<T = unknown>(type: string): Observable<WebSocketMessage<T>> {
    return this.messageSubject
      .asObservable()
      .pipe(filter((msg): msg is WebSocketMessage<T> => msg.type === type));
  }

  private setupWebSocketHandlers(config: WebSocketConfig): void {
    if (!this.webSocket) return;

    this.webSocket.onopen = () => {
      this.logInfo(`Connected to: ${config.url}`);
      this.reconnectAttempts = 0;
      this.updateStatus({
        connected: true,
        connecting: false,
        reconnecting: false,
        reconnectAttempts: 0,
      });

      // Start heartbeat if configured
      if (config.heartbeatInterval && config.heartbeatMessage) {
        this.startHeartbeat(config);
      }
    };

    this.webSocket.onclose = (event) => {
      this.logInfo(`Connection closed: ${event.code} ${event.reason}`);
      this.updateStatus({
        connected: false,
        connecting: false,
        reconnecting: false,
        reconnectAttempts: this.reconnectAttempts,
      });

      // Attempt reconnection if not a clean close and reconnect is enabled
      if (!event.wasClean && config.reconnectInterval && config.maxReconnectAttempts) {
        this.attemptReconnect(config);
      }
    };

    this.webSocket.onerror = (error) => {
      this.logError('WebSocket error:', error);
      this.updateStatus({
        connected: false,
        connecting: false,
        reconnecting: false,
        error: 'WebSocket connection error',
        reconnectAttempts: this.reconnectAttempts,
      });
    };

    this.webSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.messageSubject.next(message);
      } catch (error) {
        this.logError('Error parsing message:', error);
      }
    };
  }

  private startHeartbeat(config: WebSocketConfig): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
        this.send({
          type: 'heartbeat',
          data: config.heartbeatMessage!,
        });
      }
    }, config.heartbeatInterval);
  }

  private attemptReconnect(config: WebSocketConfig): void {
    if (this.reconnectAttempts >= (config.maxReconnectAttempts || 5)) {
      this.logInfo('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    this.updateStatus({
      connected: false,
      connecting: false,
      reconnecting: true,
      reconnectAttempts: this.reconnectAttempts,
    });

    this.reconnectTimer = setTimeout(() => {
      this.logInfo(`Reconnect attempt ${this.reconnectAttempts}`);
      this.connect(config);
    }, config.reconnectInterval || 3000);
  }

  private updateStatus(status: Partial<WebSocketStatus>): void {
    const newStatus = { ...this.statusSubject.getValue(), ...status };
    this.statusSubject.next(newStatus);
  }

  // Direct access to native WebSocket
  getNativeWebSocket(): WebSocket | null {
    return this.webSocket;
  }

  isConnected(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number {
    return this.webSocket?.readyState ?? WebSocket.CLOSED;
  }
}
