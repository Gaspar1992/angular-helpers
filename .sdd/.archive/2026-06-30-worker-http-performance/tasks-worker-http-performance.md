# Tasks: `@angular-helpers/worker-http` Performance Improvements

This document outlines the step-by-step task breakdown for implementing the performance improvements in the `@angular-helpers/worker-http` package, based on the design defined in [design-worker-http-performance.md](file:///home/gasparrv92/Repositorios/angular-helpers/.sdd/design-worker-http-performance.md).

---

## Review Workload Forecast

- **Estimated changed lines**: 250-350 lines of code.
- **400-line budget risk**: Low.
- **Chained PRs recommended**: No.
- **Delivery strategy**: single-pr.
- **Decision needed before apply**: No.

For downstream parser matching:
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

---

## Phase 1: Configuration & Infrastructure

This phase introduces the necessary configuration tokens, public provider functions, and type definitions to support the payload-size routing feature.

- [x] **1.1. Add Injection Token**
  - Edit [worker-http-tokens.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-tokens.ts).
  - Define and export `WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN` as an `InjectionToken<number | null>` with a default factory returning `null`.
  - Add appropriate JSDoc comments explaining the token's purpose.

- [x] **1.2. Implement Feature Provider**
  - Edit [worker-http-providers.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-providers.ts).
  - Create and export the `withMinPayloadSizeForWorker(size: number)` function.
  - Ensure it returns `WorkerHttpFeature<'MinPayloadSize'>` providing `WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN` with the specified value.

- [x] **1.3. Update Feature Kind Types**
  - Edit [worker-http-backend.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.types.ts).
  - Add `'MinPayloadSize'` to the `WorkerHttpFeatureKind` union type.

_Verification:_

- Verify that compilation of the `backend` package passes without type errors: `npm run build` or equivalent package build command.

---

## Phase 2: Payload-Size Routing

This phase implements the size estimation utility and integrates the routing logic within the Angular HTTP backend to bypass the worker for small payloads.

- [x] **2.1. Implement Request Body Size Calculator**
  - Edit [worker-http-backend.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.ts).
  - Implement the `getRequestBodySize(body: unknown, serializer?: WorkerSerializer | null): number` helper function.
  - Support size estimation for:
    - `null` / `undefined` (0 bytes)
    - `string` (using `TextEncoder` when available, fallback to length)
    - `Blob` / `File` (using `size` property)
    - `ArrayBuffer` (using `byteLength`)
    - `ArrayBufferView` / typed arrays (using `byteLength`)
    - `URLSearchParams` (using stringified length)
    - `FormData` (iterating keys and values, calculating string/Blob sizes)
    - Plain objects and serialized objects (handling custom serializer or `JSON.stringify`)
  - Wrap the entire calculation in a `try/catch` block and return `Infinity` on any error to ensure safe routing.

- [x] **2.2. Integrate Threshold Checking in Backend**
  - Edit [worker-http-backend.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.ts).
  - Inject `WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN` optionally.
  - In the `handle()` method, implement the bypass logic:
    - Only bypass if `minPayloadSize` is set and `fallback` is `'main-thread'`.
    - Do NOT bypass if there is an explicit `WORKER_TARGET` context token.
    - For GET/HEAD requests: bypass if there is no explicit worker route matched (i.e. it only matched a wildcard or default route).
    - For other methods (POST, PUT, etc.): calculate the body size using `getRequestBodySize` and bypass if the size is strictly less than `minPayloadSize`.
    - If bypassing, route the request to `handleFallback` with a descriptive message.

_Verification:_

- Ensure `getRequestBodySize` handles all specified types correctly in ad-hoc tests.
- Ensure that compiling `packages/worker-http` succeeds.

---

## Phase 3: Zero-Copy Transferables

This phase implements transparent zero-copy transfer of large string payloads between the main thread and the worker thread using `TextEncoder` and `TextDecoder`.

- [x] **3.1. Main-to-Worker Request Serialization (Main Thread)**
  - Edit [create-worker-transport.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/transport/src/create-worker-transport.ts).
  - In `execute()`, check if `request.body` is a string and exceeds the 100 KB threshold (102,400 bytes).
  - If it exceeds 100 KB, encode it to an `ArrayBuffer` using `TextEncoder`.
  - Set the body to the encoded `ArrayBuffer`, set a flag `_bodyWasString: true` on the request payload, and add the `ArrayBuffer` to the `transferables` array.
  - Combine request transferables with any auto-detected transferables.

- [x] **3.2. Worker-to-Main Response Deserialization (Main Thread)**
  - Edit [create-worker-transport.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/transport/src/create-worker-transport.ts).
  - In `handleResponse()`, check if the received response has `_bodyWasString: true` and the body is an `ArrayBuffer`.
  - Decode the body back into a string using `TextDecoder`.
  - Delete the `_bodyWasString` flag from the response object.

- [x] **3.3. Worker-Side Request Deserialization (Worker Thread)**
  - Edit [worker-port-loop.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/interceptors/src/worker-port-loop.ts).
  - In `processMessage()` for `'request'` types, check if the payload has `_bodyWasString: true` and the body is an `ArrayBuffer`.
  - Decode the body back into a string using `TextDecoder` before passing the payload to the chain.
  - Delete the `_bodyWasString` flag.

- [x] **3.4. Worker-to-Main Response Serialization (Worker Thread)**
  - Edit [worker-port-loop.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/interceptors/src/worker-port-loop.ts).
  - In `scheduleFlush()`, iterate over responses. For successful responses where `res.result.body` is a string exceeding 100 KB:
    - Encode it to an `ArrayBuffer` using `TextEncoder`.
    - Set the body to the `ArrayBuffer`, set `_bodyWasString: true` on the result, and add the `ArrayBuffer` to the response transferables list.
  - Combine response transferables with other transferables (like stream ports or auto-detected transferables) and pass them to `port.postMessage`.

_Verification:_

- Verify that large payloads are transferred as `ArrayBuffer` objects and successfully decoded back to strings on both ends.

---

## Phase 4: Unit Testing

This phase adds comprehensive unit tests to verify the correctness of the size calculation, routing/bypassing, and serialization logic.

- [x] **4.1. Size Calculation Unit Tests**
  - Edit or create [worker-request-adapter.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-request-adapter.spec.ts) (or a new spec file).
  - Write test cases for `getRequestBodySize` covering:
    - Null/undefined inputs.
    - Small/large strings.
    - `Blob` and `File` objects.
    - `ArrayBuffer` and typed array views.
    - `URLSearchParams`.
    - `FormData` containing text fields and file fields.
    - Objects (with and without custom serializer).
    - Circular references (verifying that they do not crash and return `Infinity`).

- [x] **4.2. Routing & Bypassing Integration Tests**
  - Edit [worker-http-backend.integration.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.integration.spec.ts).
  - Write tests verifying that:
    - Without `minPayloadSize`, all requests route to the worker.
    - With `minPayloadSize` and `fallback: 'main-thread'`, requests below the threshold bypass the worker.
    - Requests with an explicit `WORKER_TARGET` context token never bypass the worker.
    - GET/HEAD requests bypass the worker if they don't match a specific worker route.
    - Requests above the threshold are routed to the worker.

- [x] **4.3. Serialization & Transferable Unit Tests**
  - Edit [create-worker-transport.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/transport/src/create-worker-transport.spec.ts) and [worker-port-loop.spec.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/interceptors/src/worker-port-loop.spec.ts).
  - Test that string payloads > 100 KB are encoded to `ArrayBuffer` and included in the transferables array.
  - Test that string payloads < 100 KB remain strings and are not transferred.
  - Test that decoding works correctly on both main and worker threads.

_Verification:_

- Run the test suite and ensure all tests pass: `npm run test` (or the project's Vitest command).

---

## Phase 5: Benchmarks

This phase adds new benchmark scenarios to measure the performance benefits of payload-size routing and zero-copy transferables.

- [x] **5.1. Add Benchmark Scenarios**
  - Edit [benchmark-scenarios.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/demo/worker-http-benchmark/services/benchmark-scenarios.ts).
  - Add `threshold-bypass` scenario (100 small POST requests of 500 bytes with a 1KB threshold).
  - Add `large-transferable` scenario (5 large requests & responses of 5MB each).

- [x] **5.2. Update Benchmark Runner**
  - Edit [benchmark-runner.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/demo/worker-http-benchmark/services/benchmark-runner.service.ts).
  - Ensure that for the `threshold-bypass` scenario, the `WorkerHttpBackend` is configured with `withMinPayloadSizeForWorker(1024)` so that bypass routing is active.

_Verification:_

- Run the benchmark suite locally or in the browser, verifying that the new scenarios execute and show the expected performance improvements (reduced latency for small requests, reduced main-thread blocking for large requests).

---

## Phase 6: Documentation & Blog Post

This phase documents the new features and writes a blog post explaining the performance improvements.

- [x] **6.1. Write Blog Post**
  - Create [worker-http-performance-boost.md](file:///home/gasparrv92/Repositorios/angular-helpers/public/content/blog/worker-http-performance-boost.md).
  - Write the post following the structure defined in the design (Title, Introduction, The Overhead Problem, Size Routing, Zero-Copy Transferables, Benchmark Results, Conclusion).

- [x] **6.2. Update README Documentation**
  - Edit `packages/worker-http/README.md` or the main project README.
  - Add documentation on how to configure and use `withMinPayloadSizeForWorker(size)` and explain that zero-copy transferables work transparently out-of-the-box.
