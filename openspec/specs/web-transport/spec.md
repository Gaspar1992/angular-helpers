# Capability Specification: WebTransport Service

## Purpose

Provides an Angular-native service wrapper in `@angular-helpers/browser-web-apis` for managing WebTransport connections, stream creation, and unreliable datagram transport with reactive Signals and RxJS integration.

## Requirements

### Requirement: WebTransport Connection Management

`WebTransportService` MUST establish a connection to a specified WebTransport URL with optional `WebTransportOptions`, reflect connection states via a Signal, and close connections deterministically on explicit call or context destruction (`DestroyRef`).

#### Scenario: Connect to WebTransport server successfully

- **Given** an Angular context with WebTransport support
- **When** `connect('https://example.com/webtransport')` is invoked
- **Then** state signal SHALL transition from `connecting` to `connected` upon ready resolution.

#### Scenario: Close connection on DestroyRef or close()

- **Given** an active WebTransport connection
- **When** the enclosing component/injector is destroyed or `close()` is called
- **Then** the transport session MUST be closed and state signal SHALL transition to `closed`.

### Requirement: Datagram Transport

`WebTransportService` MUST provide methods to send unreliable datagrams as `Uint8Array` / `ArrayBuffer` and expose incoming datagrams as an RxJS `Observable<Uint8Array>`.

#### Scenario: Send and receive datagram payloads

- **Given** a connected WebTransport service
- **When** `sendDatagram(payload)` is called
- **Then** payload MUST be written to `datagrams.writable`.

#### Scenario: Consume incoming datagram stream

- **Given** a connected WebTransport service
- **When** datagrams arrive from the server
- **Then** subscriber to `datagrams$` SHALL receive each datagram as a `Uint8Array`.

### Requirement: Stream Management

`WebTransportService` MUST support creating unidirectional and bidirectional streams (`WritableStream`, `ReadableStream`, `WebTransportBidirectionalStream`), and accepting incoming streams as RxJS Observables.

#### Scenario: Create outgoing unidirectional and bidirectional streams

- **Given** a connected WebTransport service
- **When** `createUnidirectionalStream()` or `createBidirectionalStream()` is called
- **Then** the service MUST return the respective underlying stream instance.

#### Scenario: Listen to incoming stream observables

- **Given** a connected WebTransport service
- **When** remote endpoint initiates incoming streams
- **Then** `incomingUnidirectionalStreams$` and `incomingBidirectionalStreams$` SHALL emit the respective incoming streams.

### Requirement: Browser Support & DI Guard

The module MUST provide `WEB_TRANSPORT_SUPPORTED` injection token and capability check to safely report when WebTransport is unsupported in the current execution context (SSR or unsupported browsers).

#### Scenario: Inject WEB_TRANSPORT_SUPPORTED in unsupported context

- **Given** an environment without global `WebTransport` constructor (e.g., SSR)
- **When** `WEB_TRANSPORT_SUPPORTED` is injected
- **Then** token value MUST evaluate to `false` without throwing an unhandled exception.
