import { Injectable, signal, OnDestroy } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, interval } from 'rxjs';
import { retry, filter } from 'rxjs/operators';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: any;
}

export interface WebSocketMessage {
  type: string;
  data: any;
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
export class WebSocketService extends BrowserApiBaseService implements OnDestroy {
  private websocket = signal<WebSocket | null>(null);
  private status = signal<WebSocketStatus>({
    connected: false,
    connecting: false,
    reconnecting: false,
    reconnectAttempts: 0
  });
  
  private messages = new Subject<WebSocketMessage>();
  private reconnectAttempts = 0;
  private heartbeatTimer: any = null;

  constructor() {
    super();
  }

  protected override getApiName(): string {
    return 'websocket';
  }

  override isSupported(): boolean {
    return this.isBrowserEnvironment() && typeof WebSocket !== 'undefined';
  }

  connect(config: WebSocketConfig): Observable<WebSocketStatus> {
    if (!this.isSupported()) {
      this.status.set({
        connected: false,
        connecting: false,
        reconnecting: false,
        error: 'WebSocket not supported',
        reconnectAttempts: 0
      });
      return toObservable(this.status);
    }

    this.status.set({
      connected: false,
      connecting: true,
      reconnecting: this.reconnectAttempts > 0,
      reconnectAttempts: this.reconnectAttempts
    });

    try {
      const ws = new WebSocket(config.url, config.protocols);
      this.websocket.set(ws);

      ws.onopen = () => {
        this.status.set({
          connected: true,
          connecting: false,
          reconnecting: false,
          reconnectAttempts: 0
        });
        this.reconnectAttempts = 0;
        this.startHeartbeat(config);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messages.next({
            type: data.type || 'message',
            data: data.data || data,
            timestamp: Date.now()
          });
        } catch {
          this.messages.next({
            type: 'message',
            data: event.data,
            timestamp: Date.now()
          });
        }
      };

      ws.onclose = (event) => {
        this.websocket.set(null);
        this.stopHeartbeat();
        
        const wasConnected = this.status().connected;
        this.status.set({
          connected: false,
          connecting: false,
          reconnecting: false,
          error: event.reason || 'Connection closed',
          reconnectAttempts: this.reconnectAttempts
        });

        if (wasConnected && event.code !== 1000 && this.reconnectAttempts < (config.maxReconnectAttempts || 5)) {
          this.scheduleReconnect(config);
        }
      };

      ws.onerror = () => {
        this.status.update(current => ({
          ...current,
          connecting: false,
          error: 'WebSocket error occurred'
        }));
      };

    } catch (error: any) {
      this.status.set({
        connected: false,
        connecting: false,
        reconnecting: false,
        error: error.message || 'Failed to create WebSocket',
        reconnectAttempts: 0
      });
    }

    return toObservable(this.status);
  }

  private scheduleReconnect(config: WebSocketConfig): void {
    this.reconnectAttempts++;
    const interval = config.reconnectInterval || 3000;
    
    setTimeout(() => {
      if (!this.status().connected) {
        this.connect(config);
      }
    }, interval);
  }

  private startHeartbeat(config: WebSocketConfig): void {
    if (config.heartbeatInterval && config.heartbeatMessage) {
      this.heartbeatTimer = interval(config.heartbeatInterval).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        this.send(config.heartbeatMessage);
      });
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      this.heartbeatTimer.unsubscribe();
      this.heartbeatTimer = null;
    }
  }

  disconnect(): void {
    const ws = this.websocket();
    if (ws) {
      ws.close(1000, 'Disconnected by user');
      this.websocket.set(null);
    }
    this.stopHeartbeat();
    this.reconnectAttempts = 0;
  }

  send(message: any): boolean {
    const ws = this.websocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      ws.send(data);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  sendTyped(type: string, data: any): boolean {
    return this.send({ type, data });
  }

  getMessages(): Observable<WebSocketMessage> {
    return this.messages.asObservable();
  }

  getMessagesByType(type: string): Observable<any> {
    return this.messages.pipe(
      filter(message => message.type === type),
      retry(3)
    );
  }

  getStatus(): Observable<WebSocketStatus> {
    return toObservable(this.status);
  }

  readonly getStatusSignal = this.status.asReadonly();

  isConnected(): boolean {
    return this.status().connected;
  }

  isConnecting(): boolean {
    return this.status().connecting;
  }

  getReadyState(): number {
    const ws = this.websocket();
    return ws ? ws.readyState : WebSocket.CLOSED;
  }

  getReadyStateText(): string {
    const state = this.getReadyState();
    switch (state) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  // Utility methods
  ping(): boolean {
    return this.send({ type: 'ping', timestamp: Date.now() });
  }

  request(data: any, requestId?: string): boolean {
    const id = requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.send({
      type: 'request',
      id,
      data,
      timestamp: Date.now()
    });
  }

  subscribe(channel: string): boolean {
    return this.sendTyped('subscribe', { channel });
  }

  unsubscribe(channel: string): boolean {
    return this.sendTyped('unsubscribe', { channel });
  }

  // Static factory methods for common configurations
  static createConfig(url: string, options: Partial<WebSocketConfig> = {}): WebSocketConfig {
    return {
      url,
      protocols: options.protocols,
      reconnectInterval: options.reconnectInterval || 3000,
      maxReconnectAttempts: options.maxReconnectAttempts || 5,
      heartbeatInterval: options.heartbeatInterval || 30000,
      heartbeatMessage: options.heartbeatMessage || { type: 'ping' }
    };
  }

  static createSecureConfig(url: string, protocols?: string[], options: Partial<WebSocketConfig> = {}): WebSocketConfig {
    const secureUrl = url.startsWith('wss://') ? url : `wss://${url.replace(/^https?:\/\//, '')}`;
    return this.createConfig(secureUrl, { ...options, protocols });
  }

  ngOnDestroy(): void {
    this.disconnect();
    // No manual cleanup needed with takeUntilDestroyed
  }
}
