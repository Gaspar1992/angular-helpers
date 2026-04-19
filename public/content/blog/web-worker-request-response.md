---
title: 'browser-web-apis v21.8: WebWorker request/response with timeout, signals for status'
publishedAt: '2026-04-18'
tags: ['browser-web-apis', 'web-worker', 'signals', 'angular']
excerpt: 'WebWorkerService now ships request/response with id correlation and timeout, exposes status as a signal, and fixes a lifecycle leak where every worker creation registered an additional onDestroy callback.'
---

# Workers stop being a postMessage soup

`postMessage` is the lowest-common-denominator API. Every project ends up reinventing the same primitive: send a message, wait for a reply, time out if it never comes. `v21.8` ships that primitive built-in.

## Request/response

```ts
const ws = inject(WebWorkerService);
const status = ws.createWorkerSignal('compute', '/assets/workers/compute.js');

const result = await ws.request<ComputeResult>('compute', 'fft', { samples }, { timeout: 5_000 });
```

Under the hood: a `crypto.randomUUID()` is generated, attached as `correlationId`, posted to the worker. The worker sends back any message containing the same `correlationId` and the promise resolves with `data`. If the timer fires first, the pending entry is cleared and the promise rejects.

## Signal-first status

```ts
const status = ws.createWorkerSignal('compute', '/assets/workers/compute.js');

effect(() => {
  const s = status();
  console.log(s.running, s.messageCount, s.error);
});
```

`getStatusSignal(name)` returns the same readonly signal at any point. The previous `Subject`-based stream is preserved as `getStatus()` (deprecated wrapper that returns `toObservable(signal)`).

## Lifecycle fix

The previous implementation registered a per-worker `destroyRef.onDestroy` callback inside `setupWorker`. Each call accumulated. The new code registers exactly one cleanup in the constructor that terminates every worker on host destroy.

## API summary

```ts
createWorker(name, scriptUrl): Observable<WorkerStatus>;        // legacy, returns Observable
createWorkerSignal(name, scriptUrl): Signal<WorkerStatus>;      // preferred
postMessage(name, task): void;                                  // fire-and-forget
request<TRes>(name, type, data, opts?): Promise<TRes>;          // round-trip with timeout
getMessages<T>(name): Observable<WorkerMessage<T>>;             // hot stream
getMessagesByType<T>(name, type): Observable<WorkerMessage<T>>; // filtered hot stream
getStatus(name): Observable<WorkerStatus>;                      // @deprecated
getStatusSignal(name): Signal<WorkerStatus>;                    // preferred
terminateWorker(name): void;                                    // also rejects pending requests
```

## Tests

`web-worker.service.spec.ts` covers:

- signal status emission on create
- idempotent createWorker
- request/response correlation
- timeout cleanup
- multiple concurrent requests
- terminate rejects pending
- messageCount accumulation

## Roadmap

PR4 of 8. Up next: PR5 ships `inject*` primitives for clipboard, geolocation, battery, network, wake-lock.
