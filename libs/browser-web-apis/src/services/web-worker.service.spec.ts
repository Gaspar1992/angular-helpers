import '@angular/compiler';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WebWorkerService, type WorkerMessage, type WorkerStatus } from './web-worker.service';
import { provideBrowserApiLogLevel } from '../tokens/logger.token';

class FakeWorker {
  static instances: FakeWorker[] = [];
  static shouldThrowOnConstruct = false;
  static shouldThrowOnPost = false;

  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  posted: { message: WorkerMessage; transfer?: Transferable[] }[] = [];
  terminated = false;

  constructor(public scriptUrl: string) {
    if (FakeWorker.shouldThrowOnConstruct) {
      throw new Error('Failed to construct Worker');
    }
    FakeWorker.instances.push(this);
  }

  postMessage(message: WorkerMessage, transfer?: Transferable[]): void {
    if (FakeWorker.shouldThrowOnPost) {
      throw new Error('postMessage failed');
    }
    this.posted.push({ message, transfer });
  }

  terminate(): void {
    this.terminated = true;
  }

  receive(data: unknown): void {
    this.onmessage?.({ data });
  }

  triggerError(err: unknown): void {
    this.onerror?.(err);
  }
}

describe('WebWorkerService', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    FakeWorker.shouldThrowOnConstruct = false;
    FakeWorker.shouldThrowOnPost = false;
    vi.useFakeTimers();
    vi.stubGlobal('Worker', FakeWorker);
    TestBed.configureTestingModule({
      providers: [WebWorkerService, provideBrowserApiLogLevel('silent')],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('createWorkerSignal exposes status as a signal and createWorker returns an Observable', () => {
    const ws = TestBed.inject(WebWorkerService);
    const status = ws.createWorkerSignal('w1', 'fake.js');
    expect(status().initialized).toBe(true);
    expect(status().running).toBe(true);
    expect(FakeWorker.instances.length).toBe(1);

    let observed: WorkerStatus | undefined;
    const status$ = TestBed.runInInjectionContext(() => ws.createWorker('w1', 'fake.js'));
    const sub = status$.subscribe((s) => {
      observed = s;
    });
    TestBed.tick();
    expect(observed?.running).toBe(true);
    sub.unsubscribe();
  });

  it('handles Worker constructor failure gracefully', () => {
    FakeWorker.shouldThrowOnConstruct = true;
    const ws = TestBed.inject(WebWorkerService);
    const status = ws.createWorkerSignal('bad', 'bad.js');
    expect(status().initialized).toBe(false);
    expect(status().running).toBe(false);
    expect(status().error).toBe('Failed to construct Worker');
  });

  it('request() resolves on matching correlationId and supports transferables', async () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');
    const buf = new ArrayBuffer(8);
    const promise = ws.request<{ ok: boolean }>('w1', 'compute', { n: 1 }, { transferable: [buf] });
    const sent = FakeWorker.instances[0].posted[0];
    expect(sent.transfer).toEqual([buf]);
    FakeWorker.instances[0].receive({
      type: 'compute.reply',
      data: { ok: true },
      correlationId: sent.message.correlationId,
    });
    await expect(promise).resolves.toEqual({ ok: true });
  });

  it('request() rejects when worker not found, on postMessage throw, or on timeout', async () => {
    const ws = TestBed.inject(WebWorkerService);
    await expect(ws.request('missing', 'ping', {})).rejects.toThrow(/not found/);

    ws.createWorkerSignal('w1', 'fake.js');
    FakeWorker.shouldThrowOnPost = true;
    await expect(ws.request('w1', 'ping', {})).rejects.toThrow('postMessage failed');

    FakeWorker.shouldThrowOnPost = false;
    const promise = ws.request('w1', 'slow', {}, { timeout: 50 });
    vi.advanceTimersByTime(60);
    await expect(promise).rejects.toThrow(/timeout/);
  });

  it('postMessage handles missing worker, transferables, and postMessage errors', () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.postMessage('missing', { type: 'a', data: 1 });

    const status = ws.createWorkerSignal('w1', 'fake.js');
    const buf = new ArrayBuffer(4);
    ws.postMessage('w1', { type: 'a', data: 1, transferable: [buf] });
    expect(status().messageCount).toBe(1);
    expect(FakeWorker.instances[0].posted[0].transfer).toEqual([buf]);

    FakeWorker.shouldThrowOnPost = true;
    ws.postMessage('w1', { type: 'b', data: 2 });
    expect(status().messageCount).toBe(1);
  });

  it('getMessages and getMessagesByType emit non-correlated worker messages and handle worker onerror', () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake.js');

    const allMessages: WorkerMessage[] = [];
    const typedMessages: WorkerMessage[] = [];
    ws.getMessages('w1').subscribe((m) => allMessages.push(m));
    ws.getMessagesByType('w1', 'custom').subscribe((m) => typedMessages.push(m));

    FakeWorker.instances[0].receive({ type: 'custom', data: 'hello' });
    FakeWorker.instances[0].receive({ type: 'other', data: 'world' });

    expect(allMessages.length).toBe(2);
    expect(typedMessages.length).toBe(1);
    expect(typedMessages[0].data).toBe('hello');

    FakeWorker.instances[0].triggerError(new Error('Worker crashed'));
    expect(ws.isWorkerRunning('w1')).toBe(false);
    expect(ws.getCurrentStatus('w1')?.error).toBe('Worker crashed');
  });

  it('exposes status/worker getters and terminateAllWorkers', () => {
    const ws = TestBed.inject(WebWorkerService);
    ws.createWorkerSignal('w1', 'fake1.js');
    ws.createWorkerSignal('w2', 'fake2.js');

    expect(ws.getStatusSignal('w1')().running).toBe(true);
    let observed: WorkerStatus | undefined;
    const status$ = TestBed.runInInjectionContext(() => ws.getStatus('w1'));
    const sub = status$.subscribe((s) => {
      observed = s;
    });
    TestBed.tick();
    expect(observed?.running).toBe(true);
    sub.unsubscribe();

    expect(ws.getAllStatuses().size).toBe(2);
    expect(ws.getAllWorkers().size).toBe(2);
    expect(ws.getNativeWorker('w1')).toBe(FakeWorker.instances[0]);
    expect(ws.isWorkerRunning('w1')).toBe(true);

    ws.terminateAllWorkers();
    expect(ws.getAllWorkers().size).toBe(0);
    expect(FakeWorker.instances[0].terminated).toBe(true);
    expect(FakeWorker.instances[1].terminated).toBe(true);
  });
});
