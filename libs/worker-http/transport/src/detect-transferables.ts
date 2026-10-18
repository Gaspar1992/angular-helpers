import { detectTransferables as coreDetectTransferables } from '@angular-helpers/core/utils';

/**
 * Scans a payload one level deep and collects every `Transferable` instance
 * (ArrayBuffer, MessagePort, ImageBitmap, OffscreenCanvas, ReadableStream,
 * WritableStream, TransformStream) found in its own enumerable properties.
 *
 * Used by `createWorkerTransport` when `transferDetection === 'auto'` to build
 * the second argument of `worker.postMessage(data, transfer)` so large buffers
 * move zero-copy instead of being structured-cloned.
 *
 * Design notes:
 * - Only one level deep by design: deep traversal has quadratic cost on heavy
 *   graphs and makes the transfer list surprising. Real payloads that care
 *   about zero-copy put the buffer at the top level.
 * - Duplicates are filtered — the same buffer referenced twice is transferred
 *   only once (required by the structured-clone algorithm).
 * - Returns an empty array for primitives, plain serializable values, or when
 *   no transferable is found; `postMessage` accepts `[]` safely.
 */
export function detectTransferables(payload: unknown): Transferable[] {
  return coreDetectTransferables(payload, 1);
}
