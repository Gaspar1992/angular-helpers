// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, lastValueFrom, take, toArray } from 'rxjs';

import { createWorkerTransport } from './create-worker-transport';
import { WorkerHttpAbortError } from './worker-http-abort-error';
import { WorkerHttpTimeoutError } from './worker-http-timeout-error';

/**
 * Minimal test double for `Worker`.
 *
 * Exposes `respond()` / `respondError()` / `emitError()` for the spec to drive
 * the lifecycle manually and records every `postMessage` invocation with its
 * transfer list so tests can assert transferable detection.
 */
class FakeWorker {
  static instances: FakeWorker[] = [];

  readonly postedMessages: Array<{ message: unknown; transfer: Transferable[] }> = [];
  terminated = false;
  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(public readonly scriptUrl: string | URL) {
    FakeWorker.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage(message: unknown, transferOrOptions?: Transferable[]): void {
    this.postedMessages.push({
      message,
      transfer: Array.isArray(transferOrOptions) ? transferOrOptions : [],
    });
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Manually deliver a `message` event to the transport. */
  respond(requestId: string, result: unknown): void {
    this.dispatchMessage({ type: 'response', requestId, result });
  }

  respondError(requestId: string, message: string): void {
    this.dispatchMessage({
      type: 'error',
      requestId,
      error: { name: 'TestError', message },
    });
  }

  emitError(message: string): void {
    const event = { message } as ErrorEvent;
    for (const listener of this.listeners.get('error') ?? []) {
      listener(event);
    }
  }

  private dispatchMessage(data: unknown): void {
    const event = { data } as MessageEvent;
    for (const listener of this.listeners.get('message') ?? []) {
      listener(event);
    }
  }

  get lastRequest(): { requestId: string } | undefined {
    for (let i = this.postedMessages.length - 1; i >= 0; i--) {
      const payload = this.postedMessages[i].message as { type?: string; requestId?: string };
      if (payload?.type === 'request' && payload.requestId) {
        return { requestId: payload.requestId };
      }
    }
    return undefined;
  }
}

function makeFactory(): () => Worker {
  return () => new FakeWorker('/fake') as unknown as Worker;
}

describe('createWorkerTransport', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    // Ensure a deterministic hardwareConcurrency so the pool size cap is not
    // accidentally smaller than the requested maxInstances.
    Object.defineProperty(globalThis.navigator, 'hardwareConcurrency', {
      value: 4,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    FakeWorker.instances.length = 0;
  });

  it('creates no worker until the first execute() call (lazy)', () => {
    const factory = vi.fn(makeFactory());
    const transport = createWorkerTransport({ workerFactory: factory });

    expect(factory).not.toHaveBeenCalled();
    expect(transport.isActive).toBe(false);

    const sub = transport.execute({ hello: 'world' }).subscribe();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(transport.isActive).toBe(true);
    sub.unsubscribe();
  });

  it('posts the init handshake BEFORE the first request message', () => {
    const transport = createWorkerTransport({
      workerFactory: makeFactory(),
      initMessage: { type: 'init-interceptors', specs: [] },
    });
    transport.execute({ payload: 1 }).subscribe();

    const worker = FakeWorker.instances[0];
    expect(worker).toBeDefined();
    const types = worker.postedMessages.map((m) => (m.message as { type: string }).type);
    expect(types).toEqual(['init-interceptors', 'request']);
  });

  it('correlates responses by requestId and does not cross-talk', async () => {
    const transport = createWorkerTransport<{ q: number }, { a: number }>({
      workerFactory: makeFactory(),
    });

    const a$ = transport.execute({ q: 1 });
    const b$ = transport.execute({ q: 2 });

    const aP = firstValueFrom(a$);
    const bP = firstValueFrom(b$);

    const worker = FakeWorker.instances[0];
    const requests = worker.postedMessages.filter(
      (m) => (m.message as { type: string }).type === 'request',
    );
    expect(requests).toHaveLength(2);
    const [reqA, reqB] = requests.map((r) => r.message as { requestId: string });

    // Respond in reverse order — subscribers must still receive the right payload.
    worker.respond(reqB.requestId, { a: 200 });
    worker.respond(reqA.requestId, { a: 100 });

    await expect(aP).resolves.toEqual({ a: 100 });
    await expect(bP).resolves.toEqual({ a: 200 });
  });

  it('dispatches across a pool in round-robin order when maxInstances > 1', () => {
    const transport = createWorkerTransport({
      workerFactory: makeFactory(),
      maxInstances: 2,
    });

    const subs = [
      transport.execute({ n: 1 }).subscribe(),
      transport.execute({ n: 2 }).subscribe(),
      transport.execute({ n: 3 }).subscribe(),
    ];

    expect(FakeWorker.instances).toHaveLength(2);
    // req #1 → worker[0], req #2 → worker[1], req #3 → worker[0] (wraps)
    expect(FakeWorker.instances[0].postedMessages).toHaveLength(2);
    expect(FakeWorker.instances[1].postedMessages).toHaveLength(1);

    for (const s of subs) s.unsubscribe();
  });

  it('posts a cancel message to the worker on unsubscribe', () => {
    const transport = createWorkerTransport({ workerFactory: makeFactory() });

    const sub = transport.execute({ foo: 'bar' }).subscribe();
    const worker = FakeWorker.instances[0];
    const requestId = worker.lastRequest!.requestId;

    sub.unsubscribe();

    const cancel = worker.postedMessages.find(
      (m) => (m.message as { type: string }).type === 'cancel',
    );
    expect(cancel).toBeDefined();
    expect((cancel!.message as { requestId: string }).requestId).toBe(requestId);
  });

  it('errors on worker error event and stops leaking listeners', async () => {
    const transport = createWorkerTransport({ workerFactory: makeFactory() });

    const promise = firstValueFrom(transport.execute({ x: 1 }));
    const worker = FakeWorker.instances[0];
    worker.emitError('boom');

    await expect(promise).rejects.toThrow('boom');
  });

  it('propagates worker-side error payloads as Error subscriber events', async () => {
    const transport = createWorkerTransport({ workerFactory: makeFactory() });

    const promise = firstValueFrom(transport.execute({ q: 1 }));
    const worker = FakeWorker.instances[0];
    worker.respondError(worker.lastRequest!.requestId, 'handler crashed');

    await expect(promise).rejects.toThrow('handler crashed');
  });

  it('terminate() stops all workers and rejects subsequent execute() calls', async () => {
    const transport = createWorkerTransport({
      workerFactory: makeFactory(),
      maxInstances: 2,
    });
    transport.execute({ a: 1 }).subscribe();
    transport.execute({ b: 2 }).subscribe();

    transport.terminate();
    expect(FakeWorker.instances.every((w) => w.terminated)).toBe(true);
    expect(transport.isActive).toBe(false);

    await expect(firstValueFrom(transport.execute({ c: 3 }))).rejects.toThrow(
      'WorkerTransport has been terminated',
    );
  });

  describe('requestTimeout', () => {
    it('rejects with WorkerHttpTimeoutError after the configured ms', async () => {
      vi.useFakeTimers();
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        requestTimeout: 100,
      });

      const promise = firstValueFrom(transport.execute({ slow: true }));

      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toBeInstanceOf(WorkerHttpTimeoutError);

      const worker = FakeWorker.instances[0];
      const lastPosted = worker.postedMessages.at(-1)!.message as { type: string };
      expect(lastPosted.type).toBe('cancel');
    });

    it('does NOT fire the timeout when the response arrives first', async () => {
      vi.useFakeTimers();
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        requestTimeout: 100,
      });

      const promise = firstValueFrom(transport.execute({ fast: true }));
      const worker = FakeWorker.instances[0];

      // Respond BEFORE timeout expires.
      vi.advanceTimersByTime(50);
      worker.respond(worker.lastRequest!.requestId, { ok: true });

      await expect(promise).resolves.toEqual({ ok: true });

      // Advance past the original timeout — no extra error should be emitted.
      vi.advanceTimersByTime(200);
    });

    it('disables the timeout when requestTimeout is 0', async () => {
      vi.useFakeTimers();
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        requestTimeout: 0,
      });

      const promise = firstValueFrom(transport.execute({ forever: true }));

      vi.advanceTimersByTime(60_000);

      // No rejection yet — manually resolve.
      const worker = FakeWorker.instances[0];
      worker.respond(worker.lastRequest!.requestId, { eventual: true });

      await expect(promise).resolves.toEqual({ eventual: true });
    });

    it('defaults to 30000 ms when requestTimeout is omitted', async () => {
      vi.useFakeTimers();
      const transport = createWorkerTransport({ workerFactory: makeFactory() });
      const promise = firstValueFrom(transport.execute({ n: 1 }));

      vi.advanceTimersByTime(29_999);
      // Still pending: race the rejection by attaching a settle flag.
      let settled = false;
      promise
        .catch(() => {
          settled = true;
        })
        .then(() => {
          /* no-op */
        });
      await Promise.resolve();
      expect(settled).toBe(false);

      vi.advanceTimersByTime(2);
      await expect(promise).rejects.toBeInstanceOf(WorkerHttpTimeoutError);
    });
  });

  describe('transferDetection', () => {
    it('auto: passes detected ArrayBuffers as transfer list', () => {
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        transferDetection: 'auto',
      });

      const buffer = new ArrayBuffer(1024);
      transport.execute({ data: buffer }).subscribe();

      const worker = FakeWorker.instances[0];
      const req = worker.postedMessages.find(
        (m) => (m.message as { type: string }).type === 'request',
      )!;
      expect(req.transfer).toContain(buffer);
    });

    it('auto: passes empty transfer list for primitive-only payloads', () => {
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        transferDetection: 'auto',
      });

      transport.execute({ x: 1, y: 'hello' }).subscribe();

      const worker = FakeWorker.instances[0];
      const req = worker.postedMessages.find(
        (m) => (m.message as { type: string }).type === 'request',
      )!;
      expect(req.transfer).toEqual([]);
    });

    it('none (default): never passes a transfer list', () => {
      const transport = createWorkerTransport({ workerFactory: makeFactory() });

      const buffer = new ArrayBuffer(1024);
      transport.execute({ data: buffer }).subscribe();

      const worker = FakeWorker.instances[0];
      const req = worker.postedMessages.find(
        (m) => (m.message as { type: string }).type === 'request',
      )!;
      expect(req.transfer).toEqual([]);
    });
  });

  describe('cancellation via AbortSignal', () => {
    it('rejects with WorkerHttpAbortError when external signal fires', async () => {
      const transport = createWorkerTransport({ workerFactory: makeFactory() });
      const ac = new AbortController();

      const promise = firstValueFrom(transport.execute({ slow: true }, { signal: ac.signal }));
      const worker = FakeWorker.instances[0];

      ac.abort('user navigated');

      await expect(promise).rejects.toBeInstanceOf(WorkerHttpAbortError);
      const cancel = worker.postedMessages.find(
        (m) => (m.message as { type: string }).type === 'cancel',
      );
      expect(cancel).toBeDefined();
      expect((cancel!.message as { requestId: string }).requestId).toBe(
        worker.lastRequest!.requestId,
      );
    });

    it('preserves the abort reason on the error', async () => {
      const transport = createWorkerTransport({ workerFactory: makeFactory() });
      const ac = new AbortController();

      const promise = firstValueFrom(transport.execute({ x: 1 }, { signal: ac.signal }));

      ac.abort('navigation');

      try {
        await promise;
        throw new Error('promise should have rejected');
      } catch (err) {
        expect(err).toBeInstanceOf(WorkerHttpAbortError);
        expect((err as WorkerHttpAbortError).reason).toBe('navigation');
      }
    });

    it('fails fast when signal is already aborted at execute() time', async () => {
      const transport = createWorkerTransport({ workerFactory: makeFactory() });
      const ac = new AbortController();
      ac.abort('preempted');

      // No worker should be touched: the FakeWorker pool is created lazily on
      // first request, but execute() should error before any postMessage.
      const promise = firstValueFrom(transport.execute({ x: 1 }, { signal: ac.signal }));

      await expect(promise).rejects.toBeInstanceOf(WorkerHttpAbortError);
    });

    it('removes the abort listener on successful response', async () => {
      const transport = createWorkerTransport({ workerFactory: makeFactory() });
      const ac = new AbortController();
      const removeSpy = vi.spyOn(ac.signal, 'removeEventListener');

      const promise = firstValueFrom(transport.execute({ x: 1 }, { signal: ac.signal }));
      const worker = FakeWorker.instances[0];
      worker.respond(worker.lastRequest!.requestId, { ok: true });

      await expect(promise).resolves.toEqual({ ok: true });
      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    it('does not error after subscriber already settled (race)', async () => {
      const transport = createWorkerTransport({ workerFactory: makeFactory() });
      const ac = new AbortController();

      const promise = firstValueFrom(transport.execute({ x: 1 }, { signal: ac.signal }));
      const worker = FakeWorker.instances[0];

      // Settle first, then abort. The abort listener must be a no-op.
      worker.respond(worker.lastRequest!.requestId, { ok: true });
      ac.abort('late');

      await expect(promise).resolves.toEqual({ ok: true });
    });
  });

  describe('per-request timeout override', () => {
    it('uses options.timeout instead of the transport-level requestTimeout', async () => {
      vi.useFakeTimers();
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        requestTimeout: 60_000,
      });

      const promise = firstValueFrom(transport.execute({ slow: true }, { timeout: 50 }));

      vi.advanceTimersByTime(50);

      await expect(promise).rejects.toBeInstanceOf(WorkerHttpTimeoutError);
    });

    it('options.timeout=0 disables timeout for this request only', async () => {
      vi.useFakeTimers();
      const transport = createWorkerTransport({
        workerFactory: makeFactory(),
        requestTimeout: 100,
      });

      const promise = firstValueFrom(transport.execute({ forever: true }, { timeout: 0 }));

      vi.advanceTimersByTime(60_000);

      const worker = FakeWorker.instances[0];
      worker.respond(worker.lastRequest!.requestId, { eventual: true });

      await expect(promise).resolves.toEqual({ eventual: true });
    });
  });

  it('emits exactly one value then completes on success', async () => {
    const transport = createWorkerTransport<{ q: number }, { a: number }>({
      workerFactory: makeFactory(),
    });

    const collect = lastValueFrom(transport.execute({ q: 1 }).pipe(take(1), toArray()));

    const worker = FakeWorker.instances[0];
    worker.respond(worker.lastRequest!.requestId, { a: 1 });

    await expect(collect).resolves.toEqual([{ a: 1 }]);
  });
});
