/**
 * Scans a payload and collects every `Transferable` instance found.
 * Used for zero-copy postMessage calls.
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

function isTransferable(value: unknown): value is Transferable {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'object') return false;

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return true;
  if (typeof MessagePort !== 'undefined' && value instanceof MessagePort) return true;
  if (typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap) return true;
  if (typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas) return true;
  if (typeof ReadableStream !== 'undefined' && value instanceof ReadableStream) return true;
  if (typeof WritableStream !== 'undefined' && value instanceof WritableStream) return true;
  if (typeof TransformStream !== 'undefined' && value instanceof TransformStream) return true;
  return false;
}
