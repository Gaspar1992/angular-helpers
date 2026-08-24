import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockSocketInstances: any[];

  beforeEach(() => {
    mockSocketInstances = [];

    class MockWebSocket {
      url: string;
      readyState = 1; // OPEN
      onopen: any = null;
      onclose: any = null;
      onerror: any = null;
      onmessage: any = null;
      listeners: Record<string, Set<EventListener>> = {};

      static readonly CONNECTING = 0;
      static readonly OPEN = 1;
      static readonly CLOSING = 2;
      static readonly CLOSED = 3;

      constructor(url: string) {
        this.url = url;
        mockSocketInstances.push(this);
      }

      send = vi.fn();
      close = vi.fn(function (this: any) {
        this.readyState = 3; // CLOSED
        this.onclose?.(new CloseEvent('close'));
        this.dispatchEvent(new CloseEvent('close'));
      });

      addEventListener(event: string, cb: EventListener) {
        if (!this.listeners[event]) this.listeners[event] = new Set();
        this.listeners[event].add(cb);
      }

      removeEventListener(event: string, cb: EventListener) {
        this.listeners[event]?.delete(cb);
      }

      dispatchEvent(event: Event): boolean {
        this.listeners[event.type]?.forEach((cb) => cb(event));
        return true;
      }
    }

    vi.stubGlobal('WebSocket', MockWebSocket);

    TestBed.configureTestingModule({
      providers: [WebSocketService, BrowserCapabilityService],
    });
    service = TestBed.inject(WebSocketService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should create WebSocketClient with createClient()', () => {
    const client = service.createClient({ url: 'wss://echo.websocket.org' });
    expect(client).toBeDefined();
    expect(client.status().state).toBeDefined();
  });

  it('should dispose all clients on disposeAll()', () => {
    const client1 = service.createClient({ url: 'wss://echo.websocket.org/1' });
    const client2 = service.createClient({ url: 'wss://echo.websocket.org/2' });
    const closeSpy1 = vi.spyOn(client1, 'close');
    const closeSpy2 = vi.spyOn(client2, 'close');

    service.disposeAll();
    expect(closeSpy1).toHaveBeenCalled();
    expect(closeSpy2).toHaveBeenCalled();
  });

  it('should support legacy connect/send/disconnect methods', () => {
    const sub = service.connect({ url: 'wss://echo.websocket.org' }).subscribe();

    service.send({ type: 'greeting', payload: 'hello' });
    service.sendRaw('raw data');

    expect(service.isConnected()).toBe(false);
    expect(service.getMessages()).toBeDefined();
    expect(service.getMessagesByType('greeting')).toBeDefined();

    sub.unsubscribe();
    service.disconnect();
  });

  it('should throw error when sending without active legacy connection', () => {
    expect(() => service.send({ type: 'test', payload: {} })).toThrow(/No active legacy WebSocket/);
    expect(() => service.sendRaw('test')).toThrow(/No active legacy WebSocket/);
  });

  it('should throw when on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        WebSocketService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(WebSocketService);
    expect(serverService.isSupported()).toBe(false);
    expect(() => serverService.createClient({ url: 'wss://test' })).toThrow(/server environment/);
  });
});
