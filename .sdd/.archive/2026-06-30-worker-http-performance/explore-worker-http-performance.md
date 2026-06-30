# SDD Exploration: `@angular-helpers/worker-http` Performance Optimization

This document outlines the design and implementation plan for two key performance improvements in the `@angular-helpers/worker-http` package, along with a benchmark suite and a technical blog post plan.

---

## 1. Executive Summary

While offloading HTTP requests to a Web Worker keeps the main thread free and responsive, it introduces two overheads:

1. **Context Switching Latency**: For small requests (e.g., simple GETs or small JSON payloads), the overhead of `postMessage` and worker scheduling can exceed the time to run the request directly on the main thread.
2. **IPC Copying Overhead**: For large payloads, the browser's structured clone algorithm performs a deep copy of the message, which blocks both threads during serialization/deserialization.

We propose two solutions:

1. **Automatic payload-size routing**: Keep requests below a configured threshold on the main thread (using the existing fallback mechanism) to avoid context switching costs for small payloads.
2. **Auto-serialization of large payloads to ArrayBuffer**: Automatically convert large serialized string payloads (like JSON) to `ArrayBuffer`s, allowing them to be transferred via `postMessage` as Transferables (zero-copy), eliminating deep copying overhead.

---

## 2. Technical Analysis & Current State

- **Routing**: [WorkerHttpBackend](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.ts) currently routes any request matching a route in [WORKER_HTTP_ROUTES_TOKEN](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-tokens.ts) to the worker. If no route matches or workers are unavailable (SSR), it falls back to the main-thread `FetchBackend` (if `fallback` is `'main-thread'`).
- **IPC Transport**: [createWorkerTransport](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/transport/src/create-worker-transport.ts) sends requests using `postMessage`. It supports `transferDetection: 'auto'`, which scans the payload one level deep for native Transferables. However, serialized string payloads (like JSON) are not native Transferables and are structured-cloned.
- **Serialization**: Custom serializers (such as Seroval or TOON) serialize data to strings, but these strings are sent via structured clone, incurring copying overhead.

---

## 3. Design: Automatic Payload-Size Routing

We will add a configuration option `minPayloadSizeForWorker` (in bytes). If a request's body size is below this threshold, it bypasses the worker and runs on the main thread.

### 3.1. API Changes

We will add a new token and a configuration feature:

1. **New Injection Token** in [worker-http-tokens.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-tokens.ts):

   ```typescript
   export const WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN = new InjectionToken<number | null>(
     'WorkerHttpMinPayloadSize',
     { factory: () => null },
   );
   ```

2. **New Feature Function** in [worker-http-providers.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-providers.ts):

   ```typescript
   /**
    * Configures the minimum payload size (in bytes) required to route a request to a worker.
    * If the request body size is less than this threshold, it falls back to the main thread.
    */
   export function withMinPayloadSizeForWorker(size: number): WorkerHttpFeature<'MinPayloadSize'> {
     return {
       kind: 'MinPayloadSize',
       providers: [{ provide: WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN, useValue: size }],
     };
   }
   ```

3. **Update Types** in [worker-http-backend.types.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.types.ts):
   Extend `WorkerHttpFeatureKind` to include `'MinPayloadSize'`.

### 3.2. Backend Integration

In [WorkerHttpBackend](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/backend/src/worker-http-backend.ts):

1. Inject the token:

   ```typescript
   private readonly minPayloadSize = inject(WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN, { optional: true });
   ```

2. In the `handle` method, intercept routing if the body size is under the threshold and fallback is enabled:

   ```typescript
   let workerId = req.context.get(WORKER_TARGET) ?? matchWorkerRoute(req.url, this.routes);

   if (workerId && this.minPayloadSize !== null && this.fallback === 'main-thread') {
     const bodySize = this.getRequestBodySize(req.body);
     if (bodySize < this.minPayloadSize) {
       workerId = null; // Forces fallback to FetchBackend on the main thread
     }
   }
   ```

3. Add a robust helper to calculate request body size in bytes:
   ```typescript
   private getRequestBodySize(body: unknown): number {
     if (body === null || body === undefined) {
       return 0;
     }
     if (typeof body === 'string') {
       return new TextEncoder().encode(body).length;
     }
     if (body instanceof Blob) {
       return body.size;
     }
     if (body instanceof ArrayBuffer) {
       return body.byteLength;
     }
     if (ArrayBuffer.isView(body)) {
       return body.byteLength;
     }
     if (body instanceof URLSearchParams) {
       return new TextEncoder().encode(body.toString()).length;
     }
     if (body instanceof FormData) {
       let size = 0;
       try {
         for (const [key, value] of (body as any).entries()) {
           size += new TextEncoder().encode(key).length;
           if (value instanceof Blob) {
             size += value.size;
           } else {
             size += new TextEncoder().encode(String(value)).length;
           }
         }
       } catch {
         return Infinity;
       }
       return size;
     }
     if (typeof body === 'object') {
       try {
         if (this.serializer) {
           const serialized = this.serializer.serialize(body);
           if (typeof serialized.data === 'string') {
             return new TextEncoder().encode(serialized.data).length;
           }
           if (serialized.data instanceof ArrayBuffer) {
             return serialized.data.byteLength;
           }
           return new TextEncoder().encode(JSON.stringify(serialized.data)).length;
         }
         return new TextEncoder().encode(JSON.stringify(body)).length;
       } catch {
         return Infinity;
       }
     }
     return 0;
   }
   ```

---

## 4. Design: Auto-Serialization of Large Payloads to ArrayBuffer

To achieve zero-copy transfers, we will automatically convert large serialized strings (such as JSON or custom serialized payloads) into `ArrayBuffer`s and pass them in the `postMessage` transfer list.

### 4.1. Main-to-Worker Request Flow

1. In [createWorkerTransport](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/transport/src/create-worker-transport.ts), before sending a request:
   - Check if `request` has a `body` property that is a string.
   - If `typeof request.body === 'string'` and its byte length exceeds `102,400` (100 KB):
     - Encode the string to an `ArrayBuffer` using `TextEncoder`.
     - Replace `request.body` with this `ArrayBuffer`.
     - Set a metadata flag `request._bodyWasString = true`.
     - Add the `ArrayBuffer` to the `transferables` array for `postMessage`.

   ```typescript
   const transferables = transferDetection === 'auto' ? detectTransferables(request) : [];
   if (request && typeof request === 'object' && 'body' in request) {
     const reqAny = request as any;
     if (typeof reqAny.body === 'string') {
       const encoder = new TextEncoder();
       const encoded = encoder.encode(reqAny.body);
       if (encoded.byteLength > 102_400) {
         // 100 KB
         const buffer = encoded.buffer as ArrayBuffer;
         reqAny.body = buffer;
         reqAny._bodyWasString = true;
         if (!transferables.includes(buffer)) {
           transferables.push(buffer);
         }
       }
     }
   }
   ```

2. In the worker's message loop [worker-port-loop.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/interceptors/src/worker-port-loop.ts), when receiving the message:
   - Check if `payload` is an object and has `_bodyWasString === true`.
   - Decode `payload.body` back to a string using `TextDecoder`.
   - Clean up the `_bodyWasString` metadata flag.

   ```typescript
   if (type === 'request') {
     if (payload && typeof payload === 'object' && payload._bodyWasString) {
       const decoder = new TextDecoder();
       payload.body = decoder.decode(payload.body);
       delete payload._bodyWasString;
     }
     // Proceed to execute...
   }
   ```

### 4.2. Worker-to-Main Response Flow

1. In the worker's message loop [worker-port-loop.ts](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/interceptors/src/worker-port-loop.ts), before sending a response:
   - Check if `response.body` is a string and its byte length > 100 KB.
   - Encode the string to an `ArrayBuffer` using `TextEncoder`.
   - Replace `response.body` with the `ArrayBuffer`.
   - Set `response._bodyWasString = true`.
   - Collect the `ArrayBuffer` into the `transferables` array.

   ```typescript
   for (const res of responses) {
     if (
       res.type === 'response' &&
       res.result &&
       typeof res.result === 'object' &&
       'body' in res.result
     ) {
       const resAny = res.result as any;
       if (typeof resAny.body === 'string') {
         const encoder = new TextEncoder();
         const encoded = encoder.encode(resAny.body);
         if (encoded.byteLength > 102_400) {
           const buffer = encoded.buffer as ArrayBuffer;
           resAny.body = buffer;
           resAny._bodyWasString = true;
         }
       }
     }
   }
   ```

2. Collect the transferables:

   ```typescript
   const transferables = [
     ...new Set(
       responses.flatMap((res) => {
         if (res.type === 'response' && res.result) {
           const resAny = res.result as any;
           const body = resAny.body;
           const extra: Transferable[] = [];
           if (resAny._bodyWasString && body instanceof ArrayBuffer) {
             extra.push(body);
           }
           if (body && typeof body === 'object' && '__isStreamPolyfillPort' in body) {
             return [body.port, ...extra];
           }
           return [...detectTransferables(body), ...extra];
         }
         return [];
       }),
     ),
   ];
   ```

3. In [createWorkerTransport](file:///home/gasparrv92/Repositorios/angular-helpers/packages/worker-http/transport/src/create-worker-transport.ts) (main thread), when receiving the response:
   - Decode `response.body` back to a string using `TextDecoder` if `response._bodyWasString === true`.

   ```typescript
   if (data.result && typeof data.result === 'object') {
     const resObj = data.result as any;
     if (resObj._bodyWasString && resObj.body instanceof ArrayBuffer) {
       const decoder = new TextDecoder();
       resObj.body = decoder.decode(resObj.body);
       delete resObj._bodyWasString;
     }
     // ...
   }
   ```

---

## 5. Benchmark Plan

We will expand the existing browser-based benchmark suite located at `src/app/demo/worker-http-benchmark`.

### 5.1. File Placements

- **Scenario Configurations**: Add new scenarios to [benchmark-scenarios.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/demo/worker-http-benchmark/services/benchmark-scenarios.ts).
- **Execution Logic**: Implement runners in [benchmark-runner.service.ts](file:///home/gasparrv92/Repositorios/angular-helpers/src/app/demo/worker-http-benchmark/services/benchmark-runner.service.ts).

### 5.2. Test Scenarios

We will add two new test groups to the benchmark page:

1. **Auto-Routing Latency Test**:
   - **Workload**: Send 100 consecutive small requests (500 bytes each) with 0ms delay.
   - **Conditions**:
     - Main thread directly.
     - Worker without `minPayloadSizeForWorker`.
     - Worker with `minPayloadSizeForWorker: 10240` (10 KB).
   - **Expected Outcome**: The worker with `minPayloadSizeForWorker` should match main-thread performance, whereas the worker without it should show higher latency due to context switching.

2. **Zero-Copy Transferable Test**:
   - **Workload**: Send a request and receive a large JSON response (1 MB and 5 MB).
   - **Conditions**:
     - Structured Clone (copying).
     - ArrayBuffer Transferable (zero-copy).
   - **Expected Outcome**: Zero-copy should significantly reduce the time spent on the main thread, keeping the UI completely interactive during transfer.

---

## 6. Blog Post Plan

We will write a technical blog post explaining these improvements.

### 6.1. File Placement

- Save the post at `public/content/blog/worker-http-performance-boost.md`.

### 6.2. Post Outline

1. **Introduction**:
   - The promise of Web Workers for HTTP (keeping the main thread clean).
   - The reality: "The IPC Tax" (latency for small requests, serialization overhead for large payloads).
2. **Mitigating Latency: Automatic Payload-Size Routing**:
   - Explain the concept: routing small requests locally and only offloading heavy ones.
   - Show how to configure `minPayloadSizeForWorker`.
3. **Eliminating Copying: Zero-Copy Transferables**:
   - Explain the structured clone bottleneck for large JSON strings.
   - Describe our automatic `ArrayBuffer` conversion mechanism using `TextEncoder` and `TextDecoder`.
4. **Benchmark Results**:
   - Show graphs/data from the new benchmark suite demonstrating the latency savings and main-thread responsiveness.
5. **Conclusion & How to Get Started**:
   - Reiterate that with these optimizations, `@angular-helpers/worker-http` becomes a truly zero-overhead drop-in replacement for Angular's HTTP client.
