import '@angular/compiler';

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DestroyRef } from '@angular/core';
import { WorkerWebSocketClient } from './websocket-client';
import { WorkerSseClient } from './sse-client';
import { attachRealtimeWorker } from './worker-handler';

// Mock Worker implementation
class MockWorker implements Writable {
  listeners: Array<(e: MessageEvent) => void> = [];
  postedMessages: any[] = [];

  addEventListener(type: string, listener: any) {
    if (type === 'message') {
      this.listeners.push(listener);
    }
  }

  removeEventListener(type: string, listener: any) {
    if (type === 'message') {
      const idx = this.listeners.indexOf(listener);
      if (idx !== -1) {
        this.listeners.splice(idx, 1);
      }
    }
  }

  postMessage(message: any) {
    this.postedMessages.push(message);
  }

  // Helper to trigger message event from worker to client
  triggerMessage(data: any) {
    for (const listener of this.listeners) {
      listener({ data } as MessageEvent);
    }
  }
}

// Mock WebSocket class
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  static instances: MockWebSocket[] = [];

  readyState = 0; // CONNECTING
  url: string;
  protocols?: string | string[];

  onopen: (() => void) | null = null;
  onclose: ((e: any) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: any) => void) | null = null;

  sendSpy = vi.fn();
  closeSpy = vi.fn();

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;
    MockWebSocket.instances.push(this);
  }

  send(data: string) {
    this.sendSpy(data);
  }

  close() {
    this.readyState = 3; // CLOSED
    this.closeSpy();
    if (this.onclose) {
      this.onclose({ wasClean: true, code: 1000, reason: '' });
    }
  }

  triggerOpen() {
    this.readyState = 1; // OPEN
    if (this.onopen) this.onopen();
  }

  triggerClose(wasClean: boolean, code: number, reason: string) {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ wasClean, code, reason });
    }
  }

  triggerMessage(data: string) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }
}

// Mock EventSource class
class MockEventSource {
  static instances: MockEventSource[] = [];

  url: string;
  config?: any;

  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((e: any) => void) | null = null;

  listeners = new Map<string, Array<(e: any) => void>>();
  closeSpy = vi.fn();

  constructor(url: string, config?: any) {
    this.url = url;
    this.config = config;
    MockEventSource.instances.push(this);
  }

  addEventListener(event: string, cb: (e: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
  }

  close() {
    this.closeSpy();
  }

  triggerOpen() {
    if (this.onopen) this.onopen();
  }

  triggerError() {
    if (this.onerror) this.onerror();
  }

  triggerMessage(data: string, lastEventId = '', type = 'message') {
    const event = { data, lastEventId, type };
    if (type === 'message' && this.onmessage) {
      this.onmessage(event as MessageEvent);
    } else {
      const list = this.listeners.get(type);
      if (list) {
        for (const cb of list) {
          cb(event);
        }
      }
    }
  }
}

describe('Worker Realtime module', () => {
  let originalWebSocket: any;
  let originalEventSource: any;

  beforeEach(() => {
    vi.useFakeTimers();
    originalWebSocket = globalThis.WebSocket;
    originalEventSource = globalThis.EventSource;

    MockWebSocket.instances = [];
    MockEventSource.instances = [];

    globalThis.WebSocket = MockWebSocket as any;
    globalThis.EventSource = MockEventSource as any;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    globalThis.EventSource = originalEventSource;
    vi.useRealTimers();
  });

  describe('WorkerWebSocketClient', () => {
    it('should connect to WebSocket in worker', () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
        protocols: 'chat',
      });

      expect(worker.postedMessages.length).toBe(1);
      const connMsg = worker.postedMessages[0];
      expect(connMsg.type).toBe('connect-ws');
      expect(connMsg.url).toBe('wss://echo.websocket.org');
      expect(connMsg.protocols).toBe('chat');

      // Emulate worker status message
      const connId = connMsg.connectionId;
      worker.triggerMessage({
        type: 'ws-status',
        connectionId: connId,
        state: 'open',
        error: null,
      });

      expect(client.status().state).toBe('open');
      client.close();
    });

    it('should send messages to worker', () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      const messagePayload = { type: 'test', data: 'hello' };
      client.send(messagePayload);

      expect(worker.postedMessages.length).toBe(2);
      expect(worker.postedMessages[1].type).toBe('send-ws');
      const data = JSON.parse(worker.postedMessages[1].data);
      expect(data.data).toBe('hello');
      client.close();
    });

    it('should handle request-response correlation', async () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      const responsePromise = client.request('greeting', { name: 'Alice' });

      // Emulate worker send
      expect(worker.postedMessages.length).toBe(2);
      const sendMsg = worker.postedMessages[1];
      expect(sendMsg.type).toBe('send-ws');
      const sentData = JSON.parse(sendMsg.data);
      expect(sentData.type).toBe('greeting');

      const correlationId = sentData.correlationId;
      expect(correlationId).toBeDefined();

      // Trigger message back from worker
      const responseData = { greeting: 'Hello Alice' };
      worker.triggerMessage({
        type: 'ws-message',
        connectionId: sendMsg.connectionId,
        data: JSON.stringify({
          correlationId,
          type: 'greeting-response',
          data: responseData,
        }),
      });

      const result = await responsePromise;
      expect(result).toEqual(responseData);
      client.close();
    });

    it('should timeout request if no response received', async () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      const requestPromise = client.request('greeting', { name: 'Alice' }, { timeout: 1000 });

      vi.advanceTimersByTime(1000);

      await expect(requestPromise).rejects.toThrow('timeout');
      client.close();
    });
  });

  describe('WorkerSseClient', () => {
    it('should connect to SSE in worker and receive events', () => {
      const worker = new MockWorker();
      const client = new WorkerSseClient(worker as any, {
        url: 'https://api.eventsource.org',
        events: ['custom-event'],
      });

      expect(worker.postedMessages.length).toBe(1);
      const sseMsg = worker.postedMessages[0];
      expect(sseMsg.type).toBe('connect-sse');
      expect(sseMsg.url).toBe('https://api.eventsource.org');
      expect(sseMsg.events).toEqual(['custom-event']);

      const connId = sseMsg.connectionId;
      worker.triggerMessage({
        type: 'sse-status',
        connectionId: connId,
        state: 'open',
        error: null,
      });

      expect(client.status().state).toBe('open');

      const events: any[] = [];
      client.events$.subscribe((e) => events.push(e));

      // Trigger sse message
      worker.triggerMessage({
        type: 'sse-message',
        connectionId: connId,
        data: '{"count": 1}',
        event: 'message',
        id: 'id-1',
      });

      expect(events.length).toBe(1);
      expect(events[0].data).toEqual({ count: 1 });
      expect(events[0].id).toBe('id-1');
      client.close();
    });
  });

  describe('attachRealtimeWorker', () => {
    it('should manage WebSocket native connection', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      // Trigger connect message
      const connectionId = 'ws-test-1';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId,
        url: 'wss://echo.org',
      });

      expect(MockWebSocket.instances.length).toBe(1);
      const socketInstance = MockWebSocket.instances[0];
      expect(socketInstance.url).toBe('wss://echo.org');

      // Emulate WebSocket open
      socketInstance.triggerOpen();

      const stateOpenMsg = workerScope.postedMessages.find(
        (m: any) => m.type === 'ws-status' && m.state === 'open',
      );
      expect(stateOpenMsg).toBeDefined();

      // Trigger message from native socket
      socketInstance.triggerMessage('{"ping":true}');
      const wsMessageMsg = workerScope.postedMessages.find(
        (m: any) => m.type === 'ws-message' && m.data === '{"ping":true}',
      );
      expect(wsMessageMsg).toBeDefined();

      // Send message to worker
      workerScope.triggerMessage({
        type: 'send-ws',
        connectionId,
        data: '{"hello":"worker"}',
      });
      expect(socketInstance.sendSpy).toHaveBeenCalledWith('{"hello":"worker"}');

      // Close WebSocket from client
      workerScope.triggerMessage({
        type: 'close-ws',
        connectionId,
      });
      expect(socketInstance.closeSpy).toHaveBeenCalled();
    });

    it('should auto-reconnect WebSocket connection on unclean close', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'ws-reconnect-1';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId,
        url: 'wss://echo.org',
        reconnectInterval: 100,
        maxReconnectAttempts: 3,
      });

      const socketInstance = MockWebSocket.instances[0];
      socketInstance.triggerOpen();

      // Unclean close
      socketInstance.triggerClose(false, 1006, 'Abnormal Closure');

      const reconnectingMsg = workerScope.postedMessages.find(
        (m: any) => m.type === 'ws-status' && m.state === 'reconnecting',
      );
      expect(reconnectingMsg).toBeDefined();
      expect(reconnectingMsg.reconnectAttempts).toBe(1);

      // Advance timers to trigger reconnect constructor
      vi.advanceTimersByTime(100);
      expect(MockWebSocket.instances.length).toBe(2);
    });

    it('should manage EventSource native connection', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'sse-test-1';
      workerScope.triggerMessage({
        type: 'connect-sse',
        connectionId,
        url: 'https://api.org',
        events: ['custom-action'],
      });

      expect(MockEventSource.instances.length).toBe(1);
      const sseInstance = MockEventSource.instances[0];
      expect(sseInstance.url).toBe('https://api.org');

      sseInstance.triggerOpen();
      const openMsg = workerScope.postedMessages.find(
        (m: any) => m.type === 'sse-status' && m.state === 'open',
      );
      expect(openMsg).toBeDefined();

      // Trigger message
      sseInstance.triggerMessage('message-data', '123', 'custom-action');
      const messageMsg = workerScope.postedMessages.find(
        (m: any) => m.type === 'sse-message' && m.data === 'message-data',
      );
      expect(messageMsg).toBeDefined();
      expect(messageMsg.event).toBe('custom-action');

      // Close from client
      workerScope.triggerMessage({
        type: 'close-sse',
        connectionId,
      });
      expect(sseInstance.closeSpy).toHaveBeenCalled();
    });
  });
});
