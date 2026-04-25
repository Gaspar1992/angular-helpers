/**
 * Safari Transferable Streams Ponyfill
 *
 * Provides `ReadableStream` and `TransformStream` implementations that support
 * `structuredClone` transfer to/from Web Workers on Safari 16-17.
 *
 * This is a **ponyfill** (not a polyfill) — it does not modify global scope.
 * Native implementations are re-exported when available.
 *
 * Usage:
 * ```typescript
 * import '@angular-helpers/worker-http/streams-polyfill';
 * ```
 * Or let the transport auto-inject when `safariPolyfill: true` is configured.
 *
 * @see {@link detect} for feature detection
 */

export { needsPolyfill } from './detect';
export { ponyfillStreams } from './ponyfill';
export type { StreamPonyfillExports } from './ponyfill';
