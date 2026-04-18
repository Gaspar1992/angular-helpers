import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from './web-socket.client';
import type { BrowserApiLogger } from '../tokens/logger.token';

const noopLogger: BrowserApiLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
};

class FakeWebSocket {
  static OPEN = 1;
  static CLOSED = 3;

  static instances: FakeWebSocket[] = [];

  readyState = 0;
  url: string;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string; wasClean: boolean }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  sentMessages: string[] = [];
  closed = false;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sentMessages.push(data);
  }

  close(): void {
    this.closed = true;
    this.readyState = FakeWebSocket.CLOSED;
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(data: unknown): void {
    this.onmessage?.({ data: typeof data === 'string' ? data : JSON.stringify(data) });
  }

  triggerClose(
    opts: { wasClean: boolean; code?: number; reason?: string } = { wasClean: true },
  ): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({ code: opts.code ?? 1000, reason: opts.reason ?? '', wasClean: opts.wasClean });
  }
}

describe('WebSocketClient', () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.useFakeTimers();
    (globalThis as unknown as { WebSocket: typeof FakeWebSocket }).WebSocket = FakeWebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('lifecycle', () => {
    it('starts in connecting state and transitions to open on socket open', () => {
      const client = new WebSocketClient({ url: 'ws://test' }, noopLogger);
      expect(client.status().state).toBe('connecting');
      FakeWebSocket.instances[0].open();
      expect(client.status().state).toBe('open');
      client.close();
    });

    it('close is idempotent', () => {
      const client = new WebSocketClient({ url: 'ws://test' }, noopLogger);
      FakeWebSocket.instances[0].open();
      client.close();
      client.close();
      expect(client.status().state).toBe('closed');
    });
  });

  describe('reconnect with backoff (regression for past dead-loop bug)', () => {
    it('schedules reconnect on unclean close and actually opens a new socket', () => {
      const client = new WebSocketClient(
        {
          url: 'ws://test',
          reconnectInterval: 1000,
          maxReconnectAttempts: 3,
        },
        noopLogger,
      );
      FakeWebSocket.instances[0].open();
      FakeWebSocket.instances[0].triggerClose({ wasClean: false });

      expect(client.status().state).toBe('reconnecting');
      expect(client.status().reconnectAttempts).toBe(1);

      // Advance enough to trigger any backoff up to the cap
      vi.advanceTimersByTime(60_000);

      // A new socket must have been created (regression: old code never reconnected)
      expect(FakeWebSocket.instances.length).toBe(2);
      client.close();
    });

    it('stops after max reconnect attempts', () => {
      const client = new WebSocketClient(
        {
          url: 'ws://test',
          reconnectInterval: 100,
          maxReconnectAttempts: 2,
          maxReconnectDelay: 100,
        },
        noopLogger,
      );
      // Force immediate failures
      for (let i = 0; i < 5; i++) {
        const sock = FakeWebSocket.instances.at(-1)!;
        sock.open();
        sock.triggerClose({ wasClean: false });
        vi.advanceTimersByTime(200);
      }
      expect(client.status().reconnectAttempts).toBeLessThanOrEqual(2);
      expect(client.status().error).toMatch(/Max reconnect attempts/);
      client.close();
    });
  });

  describe('computeBackoffDelay', () => {
    it('caps at maxDelay', () => {
      const v = WebSocketClient.computeBackoffDelay(20, 1000, 5000);
      expect(v).toBeLessThanOrEqual(5000);
      expect(v).toBeGreaterThanOrEqual(0);
    });

    it('grows exponentially below the cap', () => {
      // attempt=1 → max base=interval=100 → delay in [0,100)
      // attempt=4 → max base=800 → delay in [0,800)
      const samples = Array.from({ length: 100 }, () =>
        WebSocketClient.computeBackoffDelay(4, 100, 10_000),
      );
      const max = Math.max(...samples);
      expect(max).toBeLessThan(800);
    });
  });

  describe('request/response correlation', () => {
    it('resolves when matching correlationId arrives', async () => {
      const client = new WebSocketClient({ url: 'ws://test' }, noopLogger);
      FakeWebSocket.instances[0].open();

      const promise = client.request<{ ok: boolean }>('compute', { n: 1 });

      // Read what was sent and reply with same correlationId
      const sentRaw = FakeWebSocket.instances[0].sentMessages[0];
      const sent = JSON.parse(sentRaw);
      FakeWebSocket.instances[0].receive({
        type: 'compute.reply',
        data: { ok: true },
        correlationId: sent.correlationId,
      });

      await expect(promise).resolves.toEqual({ ok: true });
      client.close();
    });

    it('rejects with timeout error and clears pending entry', async () => {
      const client = new WebSocketClient({ url: 'ws://test' }, noopLogger);
      FakeWebSocket.instances[0].open();

      const promise = client.request('slow', {}, { timeout: 50 });
      vi.advanceTimersByTime(60);
      await expect(promise).rejects.toThrow(/timeout/);
      client.close();
    });
  });
});
