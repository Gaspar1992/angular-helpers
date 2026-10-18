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

/**
 * Scans a payload up to `maxDepth` levels deep and collects every unique
 * `Transferable` instance (including the underlying `ArrayBuffer` of typed-array views)
 * for zero-copy `postMessage` transfer.
 *
 * Uses a `WeakSet` to guard against circular references and ignores getter errors.
 */
export function detectTransferables(payload: unknown, maxDepth = Infinity): Transferable[] {
  if (payload === null || payload === undefined || typeof payload !== 'object') {
    return [];
  }

  const transfer = new Set<Transferable>();
  const visited = new WeakSet<object>();

  const scan = (val: unknown, depth: number): void => {
    if (val === null || val === undefined || typeof val !== 'object') {
      return;
    }

    if (isTransferable(val)) {
      transfer.add(val);
      return;
    }

    if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(val)) {
      const view = val as ArrayBufferView;
      if (view.buffer && isTransferable(view.buffer)) {
        transfer.add(view.buffer);
      }
      return;
    }

    const obj = val as object;
    if (depth >= maxDepth || visited.has(obj)) {
      return;
    }
    visited.add(obj);

    if (Array.isArray(val)) {
      for (const item of val as unknown[]) {
        scan(item, depth + 1);
      }
    } else {
      const record = val as Record<string, unknown>;
      for (const key of Object.keys(record)) {
        try {
          scan(record[key], depth + 1);
        } catch {
          // Guard against getter property crashes
        }
      }
    }
  };

  scan(payload, 0);
  return Array.from(transfer);
}
