/**
 * Returns true if `value` is a `Transferable` instance that can be moved
 * zero-copy via `postMessage`. Framework-agnostic, environment-safe: each
 * global is guarded with `typeof` so the check works inside Web Workers,
 * Node, and SSR contexts where some globals are absent.
 */
export function isTransferable(value: unknown): value is Transferable {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;

  // ArrayBuffer is the common case; check first.
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return true;
  // Typed-array views carry an underlying buffer but are NOT Transferable —
  // only the buffer is. Callers must pass `.buffer` explicitly if needed.
  if (typeof MessagePort !== 'undefined' && value instanceof MessagePort) return true;
  if (typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap) return true;
  if (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas) return true;
  if (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) return true;
  if (typeof WritableStream !== 'undefined' && value instanceof WritableStream) return true;
  if (typeof TransformStream !== 'undefined' && value instanceof TransformStream) return true;

  return false;
}
