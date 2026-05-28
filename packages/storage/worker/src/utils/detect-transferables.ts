import { isTransferable } from '@angular-helpers/core/utils';

/**
 * Scans a payload recursively and collects every `Transferable` instance found.
 * Used for zero-copy postMessage calls in storage workers.
 */
export function detectTransferables(payload: unknown): Transferable[] {
  if (payload === null || payload === undefined) return [];

  const found: Transferable[] = [];
  const seen = new Set<object>();

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
