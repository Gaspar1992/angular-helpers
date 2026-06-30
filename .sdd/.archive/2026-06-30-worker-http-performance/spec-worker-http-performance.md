# Spec: `@angular-helpers/worker-http` Performance Improvements

**Linked Exploration**: [.sdd/explore-worker-http-performance.md](file:///home/gasparrv92/Repositorios/angular-helpers/.sdd/explore-worker-http-performance.md)  
**Target Package**: `@angular-helpers/worker-http`  
**Status**: Proposal Accepted / Specification Phase

---

## 1. Functional Requirements

### FR-1 — Opt-in Payload-Size Routing

The routing mechanism of `WorkerHttpBackend` MUST support bypassing the Web Worker for requests with small payloads to avoid IPC context-switching overhead.

- **FR-1.1**: The feature MUST be **disabled by default**. All requests matching worker routes or having explicit worker targets must go to the worker unless fallback is forced by worker unavailability.
- **FR-1.2**: The developer CAN opt-in by configuring `minPayloadSizeForWorker` (in bytes) using a new feature function `withMinPayloadSizeForWorker(size: number)` and the injection token `WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN`.
- **FR-1.3**: When opted-in, if a request's calculated body size (in bytes) is strictly less than the configured threshold, and main-thread fallback is enabled (i.e. `fallback === 'main-thread'`), the request MUST bypass the Web Worker and execute on the main thread.
- **FR-1.4**: If the `WORKER_TARGET` context token is explicitly set on the request, the threshold MUST be ignored, and the request MUST be routed to the worker.
- **FR-1.5**: All GET and HEAD requests (which have a 0-byte body) MUST bypass the worker under this threshold, **UNLESS** they match a specific route configured in `WORKER_HTTP_ROUTES_TOKEN` or have `WORKER_TARGET` set.
- **FR-1.6**: The request body size MUST be calculated robustly for all common body types:
  - `null` / `undefined` / No body: `0` bytes.
  - `string`: Byte length after UTF-8 encoding (using `TextEncoder`).
  - `Blob`: The `size` property.
  - `ArrayBuffer` / `ArrayBufferView` (e.g., `Uint8Array`): The `byteLength` property.
  - `URLSearchParams`: Byte length of its stringified form after UTF-8 encoding.
  - `FormData`: Sum of the byte lengths of all keys and values (extracting file sizes from Blobs/Files).
  - `object` (to be serialized): Byte length of the serialized output string or the JSON-stringified representation.

### FR-2 — Transparent Zero-Copy Transferables for Large Payloads

To eliminate the deep-copy overhead of the structured clone algorithm during Inter-Process Communication (IPC), large stringified payloads MUST be transferred as `ArrayBuffer`s using `postMessage` transfer lists.

- **FR-2.1**: When a serialized request body (on the main thread) or response body (on the worker thread) is a `string` and its size exceeds **100 KB** (102,400 bytes):
  - The sending thread MUST encode the string to an `ArrayBuffer` using `TextEncoder`.
  - The `ArrayBuffer` MUST be passed in the `postMessage` transfer list (achieving zero-copy transfer and instantly detaching it from the sender).
  - A metadata flag `_bodyWasString: true` MUST be attached to the message payload.
- **FR-2.2**: The receiving thread MUST detect the `_bodyWasString` flag, decode the `ArrayBuffer` back to a `string` using `TextDecoder`, and clean up the metadata flag.
- **FR-2.3**: This process MUST be **completely transparent** to the user. The consumer of the API on the main thread and any interceptors/handlers in the worker MUST receive and see the exact same types (e.g. `string` or JSON object/string) as they would without this optimization.

---

## 2. Scenarios

### S-1 — Default Routing (No threshold configured)

- **Given** the package is configured with default settings (no `minPayloadSizeForWorker` provided)
- **And** the request URL matches a worker route
- **When** a POST request is sent with a 100-byte JSON body
- **Then** the request MUST be routed to the Web Worker.

### S-2 — Small Payload Bypasses Worker (Opt-in)

- **Given** `minPayloadSizeForWorker` is configured to `1024` bytes (1 KB)
- **And** main-thread fallback is enabled (`fallback: 'main-thread'`)
- **And** the request URL matches a worker route
- **When** a POST request is sent with a 500-byte JSON body
- **Then** the request body size is calculated as 500 bytes (which is < 1024)
- **And** the request MUST bypass the worker and execute on the main thread.

### S-3 — Large Payload Routes to Worker (Opt-in)

- **Given** `minPayloadSizeForWorker` is configured to `1024` bytes (1 KB)
- **And** the request URL matches a worker route
- **When** a POST request is sent with a 1500-byte JSON body
- **Then** the request body size is calculated as 1500 bytes (which is >= 1024)
- **And** the request MUST be routed to the Web Worker.

### S-4 — Explicit WORKER_TARGET Overrides Threshold

- **Given** `minPayloadSizeForWorker` is configured to `1024` bytes (1 KB)
- **And** the request has `WORKER_TARGET` set in its context
- **When** a POST request is sent with a 500-byte JSON body
- **Then** the threshold check is bypassed
- **And** the request MUST be routed to the Web Worker.

### S-5 — GET/HEAD Request Without Specific Route Bypasses Worker

- **Given** `minPayloadSizeForWorker` is configured to `1024` bytes (1 KB)
- **And** main-thread fallback is enabled (`fallback: 'main-thread'`)
- **And** the request is a GET request
- **And** the request does NOT match any specific route in `WORKER_HTTP_ROUTES_TOKEN`
- **And** the request does NOT have `WORKER_TARGET` set in its context
- **When** the request is executed
- **Then** the body size is calculated as 0 bytes (which is < 1024)
- **And** the request MUST bypass the worker and execute on the main thread.

### S-6 — GET/HEAD Request With Specific Route Goes to Worker

- **Given** `minPayloadSizeForWorker` is configured to `1024` bytes (1 KB)
- **And** the request is a GET request
- **And** the request matches a specific route in `WORKER_HTTP_ROUTES_TOKEN`
- **When** the request is executed
- **Then** the request MUST NOT bypass the worker
- **And** the request MUST be routed to the Web Worker.

### S-7 — Large Request Body Zero-Copy Transfer (Main to Worker)

- **Given** a POST request with a serialized string body of 150 KB (exceeding the 100 KB threshold)
- **When** the request is sent from the main thread to the worker via `postMessage`
- **Then** the main thread MUST encode the string body to an `ArrayBuffer` using `TextEncoder`
- **And** the main thread MUST include the `ArrayBuffer` in the `postMessage` transfer list
- **And** the main thread MUST attach the `_bodyWasString: true` flag to the message
- **And** the worker thread MUST receive the message, see `_bodyWasString: true`
- **And** the worker thread MUST decode the `ArrayBuffer` back to a string using `TextDecoder`
- **And** the worker thread MUST delete the `_bodyWasString` flag
- **And** the request processed by the worker interceptors MUST contain the original string body.

### S-8 — Large Response Body Zero-Copy Transfer (Worker to Main)

- **Given** a response with a serialized string body of 200 KB (exceeding the 100 KB threshold)
- **When** the response is sent from the worker thread to the main thread via `postMessage`
- **Then** the worker thread MUST encode the string body to an `ArrayBuffer` using `TextEncoder`
- **And** the worker thread MUST include the `ArrayBuffer` in the `postMessage` transfer list
- **And** the worker thread MUST attach the `_bodyWasString: true` flag to the response message
- **And** the main thread MUST receive the message, see `_bodyWasString: true`
- **And** the main thread MUST decode the `ArrayBuffer` back to a string using `TextDecoder`
- **And** the main thread MUST delete the `_bodyWasString` flag
- **And** the response returned to the Angular HTTP client consumer MUST contain the original string body.

### S-9 — Small Payload Zero-Copy Bypassed

- **Given** a request or response with a serialized string body of 50 KB (under the 100 KB threshold)
- **When** the message is sent via `postMessage`
- **Then** the body MUST remain a string
- **And** the body MUST NOT be encoded to an `ArrayBuffer`
- **And** the body MUST NOT be included in the `postMessage` transfer list.

---

## 3. Edge Cases

1. **Calculated Body Size Error**:
   - If calculating the body size throws an exception (e.g. circular references in object serialization), the helper MUST catch the error and return `Infinity`. This ensures the request is safely routed to the worker (erring on the side of offloading).
2. **TextEncoder/TextDecoder Availability**:
   - Although modern browsers and Node.js support `TextEncoder`/`TextDecoder` globally, we must ensure they are available or fallback gracefully to standard structured cloning of strings if they are absent in the environment.
3. **Empty String over 100 KB**:
   - A string containing only spaces or repeated characters could exceed 100 KB. The byte length check (via `TextEncoder.encode().length` or approximation) must be correct to avoid transferring empty or small encoded buffers.
4. **Transferring Already Transferred Buffer**:
   - If the user provides a body that is already an `ArrayBuffer`, and it is already in the transfer list, we must avoid duplicating it in the transfer list to prevent browser errors.
5. **Worker Unavailability with Low Payload Threshold**:
   - If the worker is unavailable (e.g. SSR environment or worker creation failed), all requests must fall back to the main thread regardless of whether their size is above or below the threshold.

---

## 4. Non-Functional Requirements

- **NFR-1 — Transparency**: No public API changes to the existing `WorkerHttpBackend` request/response types. The optimization must be completely transparent to consumers.
- **NFR-2 — Performance**:
  - Small request latency (under 10 KB) on the main thread should be equivalent to standard `HttpClient` latency.
  - Large request/response transfer (exceeding 100 KB) should show a measurable reduction in main-thread blocking time compared to structured cloning.
- **NFR-3 — Memory Efficiency**: Transferable buffers must be transferred, meaning they are detached from the sending context immediately, preventing double memory footprint during the IPC call.

---

## 5. Acceptance Criteria Summary

| ID       | Description                               | Verification                                                                                                                      |
| -------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **AC-1** | `minPayloadSizeForWorker` Token & Feature | Verify `WORKER_HTTP_MIN_PAYLOAD_SIZE_TOKEN` and `withMinPayloadSizeForWorker` are exported and configurable.                      |
| **AC-2** | Small Payload Routing                     | Unit tests confirming requests under the threshold bypass the worker and run on the main thread.                                  |
| **AC-3** | Large Payload Routing                     | Unit tests confirming requests equal to or larger than the threshold route to the worker.                                         |
| **AC-4** | Explicit Worker Target Override           | Unit tests confirming `WORKER_TARGET` overrides the threshold and routes to the worker.                                           |
| **AC-5** | GET/HEAD Routing Exception                | Unit tests confirming GET/HEAD requests bypass the worker unless they match a specific route or have `WORKER_TARGET`.             |
| **AC-6** | Request Zero-Copy Transfer                | Unit tests verifying that string bodies > 100 KB are sent as `ArrayBuffer` in the transfer list and decoded on the worker.        |
| **AC-7** | Response Zero-Copy Transfer               | Unit tests verifying that response bodies > 100 KB are sent as `ArrayBuffer` in the transfer list and decoded on the main thread. |
| **AC-8** | Robust Body Size Calculation              | Unit tests covering all supported body types (`Blob`, `ArrayBuffer`, `FormData`, `URLSearchParams`, `object`, `string`).          |
