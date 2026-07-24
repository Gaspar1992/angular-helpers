import { isTransferable } from '@angular-helpers/core';

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
  if (payload === null || payload === undefined) return [];
  if (typeof payload !== 'object') return [];

  const found: Transferable[] = [];
  const seen = new Set<Transferable>();

  const collect = (value: unknown): void => {
    if (value === null || value === undefined) return;
    if (isTransferable(value)) {
      if (!seen.has(value)) {
        seen.add(value);
        found.push(value);
      }
    }
  };

  if (isTransferable(payload)) {
    collect(payload);
    return found;
  }

  if (Array.isArray(payload)) {
    for (const item of payload as unknown[]) collect(item);
    return found;
  }

  for (const key of Object.keys(payload as Record<string, unknown>)) {
    collect((payload as Record<string, unknown>)[key]);
  }

  return found;
}
