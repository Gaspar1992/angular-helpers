/**
 * Scans a payload and collects every `Transferable` instance found.
 * Used for zero-copy postMessage calls.
 * Performs a deep scan for nested Transferables.
 */
export function detectTransferables(payload: unknown): Transferable[] {
  if (payload === null || payload === undefined) return [];

  const found: Transferable[] = [];
  const seen = new Set<any>();

  const scan = (value: unknown): void => {
    if (value === null || value === undefined || typeof value !== 'object') return;
    if (seen.has(value)) return;
    seen.add(value);

    if (isTransferable(value)) {
      found.push(value);
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value as unknown[]) scan(item);
    } else {
      for (const key of Object.keys(value as Record<string, unknown>)) {
        scan((value as Record<string, unknown>)[key]);
      }
    }
  };

  scan(payload);
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
