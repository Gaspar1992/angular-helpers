import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';
import { ServerSentEventsService } from './server-sent-events.service';
import { BrowserCapabilityService } from './browser-capability.service';

describe('ServerSentEventsService', () => {
  let service: ServerSentEventsService;
  let mockEventSources: Map<string, any>;

  beforeEach(() => {
    mockEventSources = new Map();

    class MockEventSource {
      url: string;
      readyState = 0; // CONNECTING
      listeners: Record<string, Set<EventListener>> = {};
      closed = false;

      constructor(
        url: string,
        public config?: any,
      ) {
        this.url = url;
        this.listeners = { message: new Set(), error: new Set() };
        mockEventSources.set(url, this);
        setTimeout(() => {
          this.readyState = 1; // OPEN
        }, 0);
      }

      addEventListener(event: string, cb: EventListener) {
        if (!this.listeners[event]) this.listeners[event] = new Set();
        this.listeners[event].add(cb);
      }

      removeEventListener(event: string, cb: EventListener) {
        this.listeners[event]?.delete(cb);
      }

      close() {
        this.closed = true;
        this.readyState = 2; // CLOSED
      }

      simulateMessage(data: any, type = 'message', lastEventId = '1', origin = 'http://localhost') {
        const ev = {
          data: typeof data === 'string' ? data : JSON.stringify(data),
          type,
          lastEventId,
          origin,
        } as MessageEvent;
        this.listeners[type]?.forEach((cb) => cb(ev));
      }

      simulateError() {
        const ev = new Event('error');
        this.listeners['error']?.forEach((cb) => cb(ev));
      }
    }

    (MockEventSource as any).CONNECTING = 0;
    (MockEventSource as any).OPEN = 1;
    (MockEventSource as any).CLOSED = 2;

    vi.stubGlobal('EventSource', MockEventSource);

    TestBed.configureTestingModule({
      providers: [ServerSentEventsService, BrowserCapabilityService],
    });
    service = TestBed.inject(ServerSentEventsService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should be created and verify support', () => {
    expect(service).toBeTruthy();
    expect(service.isSupported()).toBe(true);
  });

  it('should connect to SSE url and parse JSON messages', async () => {
    const sse$ = service.connect<{ text: string }>('https://api.example.com/events');
    const messages: any[] = [];
    const sub = sse$.subscribe((msg) => messages.push(msg));

    expect(service.getActiveConnections()).toContain('https://api.example.com/events');

    const es = mockEventSources.get('https://api.example.com/events');
    es.simulateMessage({ text: 'Hello SSE' });

    expect(messages.length).toBe(1);
    expect(messages[0].data).toEqual({ text: 'Hello SSE' });
    expect(messages[0].type).toBe('message');
    expect(messages[0].lastEventId).toBe('1');
    sub.unsubscribe();
  });

  it('should handle plain string messages that are not valid JSON', () => {
    const sse$ = service.connect<string>('https://api.example.com/raw');
    const messages: any[] = [];
    const sub = sse$.subscribe((msg) => messages.push(msg));

    const es = mockEventSources.get('https://api.example.com/raw');
    es.simulateMessage('raw-unparsed-data');

    expect(messages[0].data).toBe('raw-unparsed-data');
    sub.unsubscribe();
  });

  it('should listen to custom eventTypes if configured', () => {
    const sse$ = service.connect('https://api.example.com/custom', {
      eventTypes: ['update', 'delete'],
    });
    const messages: any[] = [];
    const sub = sse$.subscribe((msg) => messages.push(msg));

    const es = mockEventSources.get('https://api.example.com/custom');
    es.simulateMessage({ id: 10 }, 'update');

    expect(messages[0].type).toBe('update');
    sub.unsubscribe();
  });

  it('should disconnect specific and all connections', () => {
    const sub1 = service.connect('https://api.example.com/1').subscribe();
    const sub2 = service.connect('https://api.example.com/2').subscribe();
    expect(service.getActiveConnections().length).toBe(2);

    service.disconnect('https://api.example.com/1');
    expect(service.getActiveConnections()).toEqual(['https://api.example.com/2']);

    service.disconnectAll();
    expect(service.getActiveConnections().length).toBe(0);
    sub1.unsubscribe();
    sub2.unsubscribe();
  });

  it('should return connection state', () => {
    expect(service.getState('https://api.example.com/nonexistent')).toBe('closed');

    const sub = service.connect('https://api.example.com/stream').subscribe();
    expect(service.getState('https://api.example.com/stream')).toBe('connecting');
    sub.unsubscribe();
  });

  it('should emit error when connection is closed unexpectedly on error event', () => {
    const sse$ = service.connect('https://api.example.com/error-stream');
    let emittedErr: any;
    const sub = sse$.subscribe({ error: (err) => (emittedErr = err) });

    const es = mockEventSources.get('https://api.example.com/error-stream');
    es.readyState = 2; // CLOSED
    es.simulateError();

    expect(emittedErr?.message).toBe('SSE connection closed unexpectedly');
    sub.unsubscribe();
  });

  it('should throw when on server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ServerSentEventsService,
        BrowserCapabilityService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const serverService = TestBed.inject(ServerSentEventsService);
    expect(serverService.isSupported()).toBe(false);
    expect(() => serverService.connect('https://test')).toThrow(/server environment/);
  });
});
