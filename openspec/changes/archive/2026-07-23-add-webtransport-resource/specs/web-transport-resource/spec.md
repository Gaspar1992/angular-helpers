# Capability Specification: WebTransport Resource Primitives (web-transport-resource)

## Purpose

Define the requirements for `injectWebTransportResource()` and `injectWebTransport()` functional primitives in `@angular-helpers/browser-web-apis`, integrating Angular's `rxResource` with WebTransport connection lifecycles, datagram signals, multiplexed streams, and automatic cleanup.

## Requirements

### Requirement: WebTransport Resource Creation & Signal Integration

`injectWebTransportResource()` and `injectWebTransport()` MUST function within an Angular injection context, utilizing `rxResource()` to return a `ResourceRef` extension exposing status signals (`connecting`, `connected`, `closed`, `error`) and a signal for incoming datagrams (`datagram`).

#### Scenario: Inject WebTransport resource with reactive URL

- **Given** an Angular injection context with WebTransport API support
- **When** `injectWebTransport(urlSignal)` or `injectWebTransportResource(url)` is invoked
- **Then** it MUST return a `ResourceRef` containing reactive signals for connection status and datagram payloads
- **And** status signal SHALL transition from `connecting` to `connected` upon WebTransport session readiness.

#### Scenario: Handle connection errors gracefully

- **Given** a WebTransport connection attempt to an invalid URL or unreachable endpoint
- **When** the WebTransport session initialization fails or errors
- **Then** status signal MUST transition to `error` and `ResourceRef.error()` SHALL reflect the error cause.

### Requirement: Datagram and Stream Management

The WebTransport resource handle MUST support sending unreliable datagrams (`Uint8Array` / `ArrayBuffer`), exposing incoming datagrams via signal, and managing unidirectional and bidirectional streams (`createUnidirectionalStream()`, `createBidirectionalStream()`, `incomingUnidirectionalStreams`, `incomingBidirectionalStreams`).

#### Scenario: Datagram transmission and signal emission

- **Given** an active WebTransport resource session
- **When** incoming datagrams arrive from the WebTransport server
- **Then** the `datagram` signal MUST emit the latest received `Uint8Array` payload
- **And** calling `sendDatagram(payload)` MUST transmit the payload over `datagrams.writable`.

#### Scenario: Unidirectional and bidirectional stream creation

- **Given** an active WebTransport resource handle
- **When** `createUnidirectionalStream()` or `createBidirectionalStream()` is invoked
- **Then** the helper MUST return the corresponding stream instance (`WritableStream` or `WebTransportBidirectionalStream`)
- **And** incoming streams SHALL be accessible via `incomingUnidirectionalStreams` and `incomingBidirectionalStreams`.

### Requirement: AbortSignal and DestroyRef Cleanup

The WebTransport resource MUST bind connection teardown and background stream processing to the `rxResource` `AbortSignal` and Angular `DestroyRef.onDestroy()`.

#### Scenario: Automatic teardown on injection context destruction

- **Given** an active WebTransport resource created inside an injection context
- **When** the enclosing context is destroyed or `rxResource` re-evaluates due to signal changes
- **Then** the `AbortSignal` MUST abort active stream readers and close the WebTransport session
- **And** status signal SHALL transition to `closed`.

### Requirement: Vitest Scenarios and Environment Guards

The WebTransport resource implementation MUST include Vitest test scenarios and handle unsupported execution contexts (such as SSR or legacy browsers) safely.

#### Scenario: Vitest unit testing of connection lifecycle and cleanup

- **Given** mock WebTransport primitives in a Vitest test suite
- **When** `injectWebTransport()` is executed within `TestBed.runInInjectionContext`
- **Then** Vitest specs MUST verify state transitions (`connecting` -> `connected` -> `closed`), datagram signal updates, and session cleanup on `TestBed` reset.

#### Scenario: Safe execution in unsupported execution context

- **Given** an environment without global `WebTransport` constructor (e.g., SSR)
- **When** `injectWebTransportResource()` is invoked
- **Then** it MUST NOT throw an unhandled synchronous exception during injection
- **And** status signal MUST reflect `error` state indicating lack of WebTransport support.
