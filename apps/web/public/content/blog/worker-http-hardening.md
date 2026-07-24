---
title: 'worker-http v0.7.0: hardening — cancellation that actually cancels, real timeouts, and a latent AES bug'
publishedAt: '2026-04-21'
tags:
  - worker-http
  - bugfix
  - web-workers
  - webcrypto
  - angular
excerpt: >-
  A full audit of @angular-helpers/worker-http turned up three bugs hiding in
  plain sight — cancellation that didn't cancel, a requestTimeout option that
  did nothing, and an AES-CBC/CTR path that threw on every call. Here is what
  we found, why it happened, and the plumbing fix that makes the package honest.
---

We shipped `@angular-helpers/worker-http` in five phases across 2025 and
polished it through four "close-out" PRs (benchmark suite, `withWorkerInterceptors`,
SSR + TransferState, telemetry). By `0.6.0` the README read like a finished
library — so we decided to _verify_ that reality matched the docs before cutting
a v1.0 blog post.

It didn't.

This post is the audit trail: three real bugs, one fix each, and the test
coverage that pins every guarantee the README now makes.

## Bug 1 — cancellation that didn't cancel `fetch()`

### Symptom

The transport layer set up an `AbortController` per request inside the worker,
and the main-thread `execute()` Observable posted `{ type: 'cancel' }` on
unsubscribe. Reading the source, everything looked correct. Running against a
slow endpoint told a different story: **the HTTP request completed**, even
after the main thread had long unsubscribed.

### Root cause

`worker-message-loop.ts` created the controller, stored it in a map, and called
`controller.abort()` on the cancel message. But the controller's `.signal`
_never reached `fetch()`_. The `RequestHandler` type was
`(req) => Promise<response>` with no signal parameter, so when the loop called
`chain(req)` to run the interceptor pipeline, the final handler built by
`createWorkerPipeline` was `(req) => executeFetch(req)` — signal dropped on the
floor. `executeFetch` already accepted an optional `signal`, but nobody ever
passed it.

### The fix

We threaded the signal through a closure around the final handler, without
touching the public `WorkerInterceptorFn` contract:

```typescript
// Before
(req) => executeFetch(req);

// After
(req, signal) => executeFetch(req, signal);
```

And updated `buildChain` so the auto-wrapping `next` preserves the signal
across interceptor boundaries:

```typescript
(next, interceptor) => (req, signal) => interceptor(req, (r) => next(r, signal));
```

Because the interceptor sees the same `(req, next) => Promise<response>`
signature it always saw, no user code breaks. The signal just _flows_
through them.

Unit test (abridged):

```typescript
it('posts a cancel message to the worker on unsubscribe', () => {
  const sub = transport.execute({ foo: 'bar' }).subscribe();
  sub.unsubscribe();
  expect(cancelPostedFor(requestId)).toBe(true);
});
```

The end-to-end effect: a slow `GET /api/very-slow` that is unsubscribed after
100 ms now triggers `AbortError` inside the worker and the HTTP request is
truly torn down. No orphan fetches, no late response races.

## Bug 2 — `requestTimeout` did nothing

### Symptom

`WorkerTransportConfig.requestTimeout` has been in the types since v0.1 with
`default: 30000` in the JSDoc. The benchmark demo was passing
`requestTimeout: 60_000`. **No timer ever fired.** A runaway worker request
hung forever.

### Root cause

The option was exposed in the config interface but never read in
`create-worker-transport.ts`. A zombie field.

### The fix

Real implementation with a dedicated error class so consumers can
`instanceof`-check:

```typescript
export class WorkerHttpTimeoutError extends Error {
  override readonly name = 'WorkerHttpTimeoutError';
  readonly timeoutMs: number;
  constructor(timeoutMs: number) {
    super(`Worker request timed out after ${timeoutMs} ms`);
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

The `execute()` function now starts a `setTimeout(requestTimeout)`; on fire,
it:

1. Guards against double-settle via a `settled` flag.
2. Removes message + error listeners.
3. Posts `{ type: 'cancel', requestId }` to the worker — which, thanks to
   Bug 1's fix, actually aborts the in-flight `fetch()`.
4. Errors the Observable with `WorkerHttpTimeoutError`.

A response arriving within the window clears the timer and everything works
exactly as before.

## Bug 3 — AES-CBC and AES-CTR never worked

### Symptom

We started adding unit tests for the `@angular-helpers/worker-http/crypto`
sub-package (which had exactly zero test files). The first AES-CBC
round-trip test crashed with:

```
OperationError: algorithm.iv must contain exactly 16 bytes
```

### Root cause

`createAesEncryptor` generated a 12-byte IV for _every_ algorithm:

```typescript
const iv = crypto.getRandomValues(new Uint8Array(12));
```

12 bytes is the NIST-recommended nonce length for **AES-GCM**. AES-CBC and
AES-CTR are block-cipher modes and require exactly **one block — 16 bytes**
for their IV and counter respectively. The encryptor had been documented as
supporting all three modes, but anyone who ever tried `AES-CBC` got an
`OperationError` at the first `encrypt()` call.

### The fix

Pick the IV length per algorithm:

```typescript
const ivLength = algorithm === 'AES-GCM' ? 12 : 16;
// ...
const iv = crypto.getRandomValues(new Uint8Array(ivLength));
```

Documented with a NIST reference inline. The new crypto test suite covers the
round-trip for all three algorithms plus GCM ciphertext tampering rejection.

## Other cleanups that landed with this PR

- **Removed `WORKER_HTTP_VERSION = '0.0.1'`** — exported from the root entry
  but never imported anywhere, and the value was stale (the package is at
  `0.7.0`). Clean removal: importers get a compile error pointing to the
  canonical source of truth (`package.json`).
- **Opt-in transferable detection** — `transferDetection: 'auto'` now passes
  detected `ArrayBuffer` / `MessagePort` / `ImageBitmap` / `OffscreenCanvas` /
  streams as the transfer list of `postMessage`. The helper
  `detectTransferables()` is exported for advanced use. Default stays
  `'none'` to avoid silently detaching consumer buffers; flipping to `'auto'`
  is a conscious opt-in per the principle of least surprise.
- **Listener leaks on error path** — the transport now holds a per-request
  `settled` flag so timeout / error / response / unsubscribe can never
  double-resolve or leak listeners.

## Test coverage gains

| Sub-package  | Before | After |
| ------------ | ------ | ----- |
| `transport`  | 0      | 24    |
| `crypto`     | 0      | 22    |
| `serializer` | 11     | 22    |
| **Total**    | 120    | 160   |

## Why this matters

A library that _advertises_ cancellation, timeouts, and zero-copy transfers is
a different thing from a library that _delivers_ them. The README of `0.6.0`
was wrong in three places. The audit you just read exists because every claim
in the `0.7.0` README is now backed by an assertion in a spec file.

That is the shape of hardening: fewer features, more truth. `v1.0` is next.

## Migration notes

- **`0.6.0 → 0.7.0` is non-breaking at runtime.**
- `WORKER_HTTP_VERSION` removal is the only export change. Replace any
  lingering `import { WORKER_HTTP_VERSION }` with `package.json` reads or
  drop the dependency — it was always wrong.
- To get the zero-copy behavior, opt in explicitly:
  `createWorkerTransport({ transferDetection: 'auto' })`.
- `requestTimeout` now works as advertised; if you were relying on its
  previous no-op behavior, pass `0` to disable.
- If you extend AES with CBC or CTR for the first time, you no longer need
  to work around the IV-length bug. Remove any local overrides.
