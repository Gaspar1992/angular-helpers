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

    it('should throw error when calling send/sendRaw after closing', () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });
      client.close();
      expect(() => client.send({ type: 'test', data: 'hello' })).toThrow();
      expect(() => client.sendRaw('raw-data')).toThrow();
    });

    it('should support sendRaw method', () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });
      client.sendRaw('raw-test');
      expect(worker.postedMessages.length).toBe(2);
      expect(worker.postedMessages[1].data).toBe('raw-test');
      client.close();
    });

    it('should clean up with DestroyRef', () => {
      const worker = new MockWorker();
      let destroyCb: (() => void) | null = null;
      const destroyRefMock = {
        onDestroy: (cb: () => void) => {
          destroyCb = cb;
        },
      } as any;

      const client = new WorkerWebSocketClient(
        worker as any,
        {
          url: 'wss://echo.websocket.org',
        },
        destroyRefMock,
      );

      expect(destroyCb).toBeTypeOf('function');
      destroyCb!(); // trigger destroy
      expect(client.status().state).toBe('closed');
    });

    it('should fallback to generateId when crypto.randomUUID is not available', () => {
      const originalUUID = globalThis.crypto.randomUUID;
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      expect(worker.postedMessages[0].connectionId).toBeDefined();
      client.close();

      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: originalUUID,
        writable: true,
        configurable: true,
      });
    });

    it('should support messagesByType observable', () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      const messages: any[] = [];
      client.messagesByType('greeting').subscribe((msg) => messages.push(msg.data));

      const connMsg = worker.postedMessages[0];
      worker.triggerMessage({
        type: 'ws-message',
        connectionId: connMsg.connectionId,
        data: '{"type":"greeting","data":"hello"}',
      });

      worker.triggerMessage({
        type: 'ws-message',
        connectionId: connMsg.connectionId,
        data: '{"type":"other","data":"ignored"}',
      });

      expect(messages).toEqual(['hello']);
      client.close();
    });

    it('should handle raw messages in handleIncoming when JSON parsing fails', () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      const messages: any[] = [];
      client.messages$.subscribe((msg) => messages.push(msg));

      const connMsg = worker.postedMessages[0];
      worker.triggerMessage({
        type: 'ws-message',
        connectionId: connMsg.connectionId,
        data: 'plain-text-raw',
      });

      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('raw');
      expect(messages[0].data).toBe('plain-text-raw');
      client.close();
    });

    it('should reject pending requests if send fails (e.g. client is closed)', async () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });
      client.close(); // dispose the client

      const reqPromise = client.request('test-type', { data: 123 });
      await expect(reqPromise).rejects.toThrow('WebSocket client is closed');
    });

    it('should reject all pending requests on close', async () => {
      const worker = new MockWorker();
      const client = new WorkerWebSocketClient(worker as any, {
        url: 'wss://echo.websocket.org',
      });

      const reqPromise = client.request('test-type', { data: 123 });
      client.close(); // should trigger rejectAllPending

      await expect(reqPromise).rejects.toThrow('WebSocket closed');
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

    it('should handle non-JSON data in parseData and fallback ID generation', () => {
      const originalUUID = globalThis.crypto.randomUUID;
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const worker = new MockWorker();
      const client = new WorkerSseClient(worker as any, {
        url: 'https://api.eventsource.org',
      });

      const events: any[] = [];
      client.events$.subscribe((e) => events.push(e));

      const sseMsg = worker.postedMessages[0];
      worker.triggerMessage({
        type: 'sse-message',
        connectionId: sseMsg.connectionId,
        data: 'plain-text',
      });

      worker.triggerMessage({
        type: 'sse-message',
        connectionId: sseMsg.connectionId,
        data: 1234, // non-string
      });

      expect(events.length).toBe(2);
      expect(events[0].data).toBe('plain-text');
      expect(events[1].data).toBe(1234);
      client.close();

      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: originalUUID,
        writable: true,
        configurable: true,
      });
    });

    it('should clean up with DestroyRef', () => {
      const worker = new MockWorker();
      let destroyCb: (() => void) | null = null;
      const destroyRefMock = {
        onDestroy: (cb: () => void) => {
          destroyCb = cb;
        },
      } as any;

      const client = new WorkerSseClient(
        worker as any,
        {
          url: 'https://api.eventsource.org',
        },
        destroyRefMock,
      );

      expect(destroyCb).toBeTypeOf('function');
      destroyCb!();
      expect(client.status().state).toBe('closed');
    });

    it('should ignore messages with incorrect connectionId or null/undefined messages', () => {
      const worker = new MockWorker();
      const client = new WorkerSseClient(worker as any, {
        url: 'https://api.eventsource.org',
      });

      const events: any[] = [];
      client.events$.subscribe((e) => events.push(e));

      // Trigger message with wrong connection ID
      worker.triggerMessage({
        type: 'sse-message',
        connectionId: 'wrong-id',
        data: 'ignored-data',
      });

      // Trigger null message
      worker.triggerMessage(null);

      // Trigger undefined message
      worker.triggerMessage(undefined);

      expect(events.length).toBe(0);
      client.close();
    });

    it('should ignore unknown message types', () => {
      const worker = new MockWorker();
      const client = new WorkerSseClient(worker as any, {
        url: 'https://api.eventsource.org',
      });

      const sseMsg = worker.postedMessages[0];
      const connectionId = sseMsg.connectionId;

      const events: any[] = [];
      client.events$.subscribe((e) => events.push(e));

      worker.triggerMessage({
        type: 'unknown-sse-type',
        connectionId,
        data: 'ignored-data',
      });

      expect(events.length).toBe(0);
      client.close();
    });

    it('should do nothing on subsequent close calls', () => {
      const worker = new MockWorker();
      const client = new WorkerSseClient(worker as any, {
        url: 'https://api.eventsource.org',
      });

      const initialCount = worker.postedMessages.length;
      client.close();
      expect(worker.postedMessages.length).toBe(initialCount + 1);

      // Call close again
      client.close();
      expect(worker.postedMessages.length).toBe(initialCount + 1); // Should not post message again
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

    it('should manage WebSocket error and connection failure', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'ws-test-error';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId,
        url: 'wss://echo.org',
      });

      const socketInstance = MockWebSocket.instances[0];

      // Trigger error
      socketInstance.onerror!();
      const errorMsg = workerScope.postedMessages.find(
        (m: any) => m.connectionId === connectionId && m.error === 'WebSocket connection error',
      );
      expect(errorMsg).toBeDefined();
    });

    it('should start heartbeat interval and send ping messages', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'ws-test-heartbeat';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId,
        url: 'wss://echo.org',
        heartbeatInterval: 200,
        heartbeatMessage: 'ping-tick',
      });

      const socketInstance = MockWebSocket.instances[0];
      socketInstance.triggerOpen();

      // Advance timers to trigger interval
      vi.advanceTimersByTime(200);
      expect(socketInstance.sendSpy).toHaveBeenCalledWith('ping-tick');

      // Test with non-string heartbeat message
      const connectionId2 = 'ws-test-hb-json';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId: connectionId2,
        url: 'wss://echo.org',
        heartbeatInterval: 200,
        heartbeatMessage: { check: true },
      });

      const socketInstance2 = MockWebSocket.instances[1];
      socketInstance2.triggerOpen();
      vi.advanceTimersByTime(200);
      expect(socketInstance2.sendSpy).toHaveBeenCalledWith(
        '{"type":"heartbeat","data":{"check":true}}',
      );
    });

    it('should handle EventSource connection error and standard message event', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'sse-test-errors';
      workerScope.triggerMessage({
        type: 'connect-sse',
        connectionId,
        url: 'https://api.org',
      });

      const sseInstance = MockEventSource.instances[0];

      // Trigger error
      sseInstance.triggerError();
      const errStatusMsg = workerScope.postedMessages.find(
        (m: any) => m.connectionId === connectionId && m.state === 'connecting' && m.error !== null,
      );
      expect(errStatusMsg).toBeDefined();

      // Trigger standard message event
      sseInstance.triggerMessage('standard-data');
      const messageMsg = workerScope.postedMessages.find(
        (m: any) =>
          m.connectionId === connectionId && m.type === 'sse-message' && m.data === 'standard-data',
      );
      expect(messageMsg).toBeDefined();
    });

    it('should catch exceptions in EventSource constructor', () => {
      // Mock EventSource constructor to throw
      const badEventSource = vi.fn().mockImplementation(() => {
        throw new Error('Invalid URL scheme');
      });
      globalThis.EventSource = badEventSource as any;

      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'sse-test-throw';
      workerScope.triggerMessage({
        type: 'connect-sse',
        connectionId,
        url: 'bad-url',
      });
      const errStatusMsg = workerScope.postedMessages.find(
        (m: any) => m.connectionId === connectionId && m.state === 'closed',
      );
      expect(errStatusMsg).toBeDefined();
      expect(errStatusMsg.error).toBeDefined();
    });

    it('should clear reconnect timers and heartbeat intervals on WebSocket cleanup', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'ws-cleanup-test';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId,
        url: 'wss://echo.org',
        reconnectInterval: 100,
        maxReconnectAttempts: 3,
        heartbeatInterval: 200,
        heartbeatMessage: 'ping',
      });

      const socketInstance = MockWebSocket.instances[0];
      socketInstance.triggerOpen();

      // Unclean close to trigger reconnect scheduling
      socketInstance.triggerClose(false, 1006, 'Abnormal Closure');

      // Trigger cleanup by sending close message
      workerScope.triggerMessage({
        type: 'close-ws',
        connectionId,
      });

      // Wait to verify no reconnect happens
      vi.advanceTimersByTime(200);
      expect(MockWebSocket.instances.length).toBe(1);
    });

    it('should prevent actions if socket is already disposed', () => {
      const workerScope = new MockWorker();
      attachRealtimeWorker(workerScope as any);

      const connectionId = 'ws-disposed-test';
      workerScope.triggerMessage({
        type: 'connect-ws',
        connectionId,
        url: 'wss://echo.org',
      });

      const socketInstance = MockWebSocket.instances[0];

      // Trigger close immediately which disposes the socket
      workerScope.triggerMessage({
        type: 'close-ws',
        connectionId,
      });

      // Trigger socket.onclose manually
      const initialMsgsCount = workerScope.postedMessages.length;
      socketInstance.triggerClose(false, 1006, 'Abnormal Closure');

      // Should not have sent any additional status message
      expect(workerScope.postedMessages.length).toBe(initialMsgsCount);
    });
  });
});
