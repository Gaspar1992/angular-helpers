import '@angular/compiler';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WebWorkerService, type WorkerMessage } from './web-worker.service';

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  posted: WorkerMessage[] = [];
  terminated = false;

  constructor(public scriptUrl: string) {
    FakeWorker.instances.push(this);
  }

  postMessage(message: WorkerMessage): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  receive(data: unknown): void {
    this.onmessage?.({ data });
  }
}

describe('WebWorkerService', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.useFakeTimers();
    (globalThis as unknown as { Worker: typeof FakeWorker }).Worker = FakeWorker;
    Object.defineProperty(globalThis, 'window', {
      value: globalThis,
      writable: true,
      configurable: true,
    });
    TestBed.configureTestingModule({ providers: [WebWorkerService] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('createWorkerSignal exposes status as a signal', () => {
    const ws = TestBed.inject(WebWorkerService);
    const status = ws.createWorkerSignal('w1', 'fake.js');
    expect(status().initialized).toBe(true);
    expect(status().running).toBe(true);
    expect(FakeWorker.instances.length).toBe(1);
  });

  it('createWorker is idempotent for the same name', () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');
    ws.createWorkerSignal('w1', 'fake.js');
    expect(FakeWorker.instances.length).toBe(1);
  });

  it('request() resolves on matching correlationId', async () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');
    const promise = ws.request<{ ok: boolean }>('w1', 'compute', { n: 1 });
    const sent = FakeWorker.instances[0].posted[0];
    FakeWorker.instances[0].receive({
      type: 'compute.reply',
      data: { ok: true },
      correlationId: sent.correlationId,
    });
    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('request() rejects with timeout and clears pending entry', async () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');
    const promise = ws.request('w1', 'slow', {}, { timeout: 50 });
    vi.advanceTimersByTime(60);
    await expect(promise).rejects.toThrow(/timeout/);
  });

  it('multiple concurrent requests resolve independently', async () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');
    const p1 = ws.request<number>('w1', 'inc', 1);
    const p2 = ws.request<number>('w1', 'inc', 2);
    const sent = FakeWorker.instances[0].posted;
    FakeWorker.instances[0].receive({ data: 11, correlationId: sent[0].correlationId });
    FakeWorker.instances[0].receive({ data: 22, correlationId: sent[1].correlationId });
    await expect(p1).resolves.toBe(11);
    await expect(p2).resolves.toBe(22);
  });

  it('terminateWorker rejects pending requests and removes entry', async () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');
    const promise = ws.request('w1', 'forever', {}, { timeout: 999_999 });
    ws.terminateWorker('w1');
    await expect(promise).rejects.toThrow(/terminated/);
    expect(FakeWorker.instances[0].terminated).toBe(true);
  });

  it('messageCount increments on postMessage', () => {
    const ws = TestBed.inject(WebWorkerService);
    const status = ws.createWorkerSignal('w1', 'fake.js');
    ws.postMessage('w1', { type: 'a', data: 1 });
    ws.postMessage('w1', { type: 'b', data: 2 });
    expect(status().messageCount).toBe(2);
  });
});
