---
title: 'worker-http v21.1: per-request cancellation with AbortSignal and typed timeouts'
publishedAt: '2026-04-26'
tags: ['worker-http', 'cancellation', 'abort-signal', 'angular', 'web-workers']
excerpt: 'v0.7.0 made cancellation work end-to-end internally. v21.1 exposes it: bring your own AbortSignal, override the timeout per request, and branch on a typed WorkerHttpAbortError vs WorkerHttpTimeoutError. No more relying on RxJS unsubscribe to cancel a worker fetch.'
---

# worker-http v21.1: per-request cancellation with AbortSignal and typed timeouts

## The problem

Since v0.7.0, `worker-http` cancels properly on the wire. Unsubscribing the
Observable, or hitting the transport-level `requestTimeout`, posts a `cancel`
message to the worker, which aborts the in-flight `fetch()` via an
`AbortController` keyed on the `requestId`. Plumbing solid.

But from a caller's perspective, the only public way to trigger a cancel was
to **unsubscribe the Observable**. Three things bit us:

1. **No bring-your-own signal.** You couldn't tie a request to an
   `AbortController` you already owned (e.g. one shared across a debounced
   search box, or scoped to a route).
2. **No per-request timeout.** The `requestTimeout` was a global on
   `createWorkerTransport()`. A "search-as-you-type" call needing a 300 ms
   budget had to share the same timeout as a 30 s file upload.
3. **Indistinguishable errors at the boundary.** When the timeout fired you got
   `WorkerHttpTimeoutError`. When you unsubscribed you got... silence (RxJS
   tore the stream down). When _anything else_ errored you got a generic
   `Error`. There was no way to surface "the user navigated away" as a
   first-class signal.

## The shape

Two new fields on `WorkerRequestOptions`, plus a new error class.

```typescript
import { inject } from '@angular/core';
import { WorkerHttpClient } from '@angular-helpers/worker-http/backend';
import {
  WorkerHttpAbortError,
  WorkerHttpTimeoutError,
} from '@angular-helpers/worker-http/transport';

class SearchService {
  private readonly http = inject(WorkerHttpClient);

  search(query: string, signal: AbortSignal) {
    return this.http.get<Result[]>('/api/search', {
      params: { q: query },
      signal, // bring-your-own AbortSignal
      timeout: 300, // per-request override (ms)
    });
  }
}
```

Behaviour:

- **`signal` fires** → backend posts `cancel` to the worker; subscriber errors
  with `WorkerHttpAbortError` (wrapped in Angular's `HttpErrorResponse`,
  available on `err.error`).
- **`timeout` elapses** → subscriber errors with `WorkerHttpTimeoutError`.
- **Caller unsubscribes** → `cancel` is posted but no error is surfaced
  (RxJS already tore down the stream).
- **`signal.aborted === true` at call time** → fail-fast: no worker round-trip,
  immediate error.

```typescript
this.search(q, ac.signal).subscribe({
  error: (httpErr) => {
    if (httpErr.error instanceof WorkerHttpAbortError) {
      // user-driven cancellation — usually a no-op in the UI
      return;
    }
    if (httpErr.error instanceof WorkerHttpTimeoutError) {
      this.toast(`Search timed out after ${httpErr.error.timeoutMs} ms`);
      return;
    }
    this.toast('Search failed');
  },
});
```

## The plumbing

The transport's `execute()` now takes a second argument:

```typescript
interface WorkerExecuteOptions {
  signal?: AbortSignal;
  timeout?: number;
}

execute(request, { signal, timeout }): Observable<TResponse>;
```

Internally:

- The external signal gets a single `addEventListener('abort', ..., { once: true })`,
  removed on cleanup so we never leak.
- The per-request `timeout` shadows the transport-level `requestTimeout` with
  no extra setTimeout when omitted.
- `signal.aborted` is checked at the top of `execute()` for fail-fast.
- All three exit paths (signal, timeout, response) share a single `settled`
  flag so a late abort after a successful response is a guaranteed no-op.

The `WorkerHttpClient` wrapper threads `signal` and `timeout` through the
`HttpContext` via two new tokens (`WORKER_HTTP_SIGNAL`, `WORKER_HTTP_TIMEOUT`),
keeping the public API field-shaped while the backend reads them on the way
into the transport.

## What this changes for you

| Before                                                               | After                                                                  |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Cancel by unsubscribing — coupled to the Observable lifetime         | Cancel via any `AbortSignal` you own                                   |
| One global `requestTimeout` for every request through that transport | Per-request `timeout` overrides the global, `0` disables for that call |
| Generic `Error` from the consumer's perspective on cancellation      | `instanceof WorkerHttpAbortError` vs `WorkerHttpTimeoutError`          |
| Pre-aborted signal still hit the worker                              | Fail-fast, zero postMessage                                            |

## What's NOT in scope

- **No batch cancellation by tag/group.** Multiple requests sharing one
  `AbortController` already give you that ergonomically — calling
  `ac.abort()` cancels every in-flight subscriber listening on that signal.
  A dedicated tag API would be ceremony for the same outcome.
- **No retry-on-abort.** Aborts are user intent, never automatically retried.
  The `retryInterceptor` continues to operate on transport/network errors only.
- **No interceptor-side abort handling beyond what the chain already does.**
  Interceptors still receive the signal as the second `next` argument and may
  observe `signal.aborted`, but cancellation is enforced at the `fetch()`
  boundary — interceptors don't get a cancel hook.

## Demo

The Worker HTTP demo page now has a **🛑 Cancellation** card with four
buttons: start a 5 s request, abort it via `AbortController`, run with a
500 ms timeout that always wins, and a fail-fast path for a pre-aborted
signal. Each path renders the typed error so you can see the branching at
work.
