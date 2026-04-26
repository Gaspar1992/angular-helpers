import type { SerializedPayload, WorkerSerializer } from './worker-serializer.types';

type ToonModule = {
  encode: (value: unknown) => string;
  decode: <T = unknown>(source: string) => T;
};

let cachedToon: ToonModule | null = null;

async function loadToon(): Promise<ToonModule> {
  if (!cachedToon) {
    try {
      // Dynamic import via variable — keeps @toon-format/toon as optional peer dep (no static reference)
      const id = '@toon-format/toon';
      cachedToon = (await import(/* @vite-ignore */ id)) as ToonModule;
    } catch {
      throw new Error(
        '@toon-format/toon is required as a peer dependency. ' +
          'Install it with: npm install @toon-format/toon',
      );
    }
  }
  return cachedToon;
}

/**
 * Creates a `WorkerSerializer` backed by `@toon-format/toon` (Token-Oriented Object Notation).
 *
 * TOON is a compact, schema-aware encoding of the JSON data model that declares object
 * keys once and emits values as CSV-like rows. It typically reduces size by **30–60%**
 * for uniform arrays of objects (e.g. `User[]`, `Product[]`, paginated lists), with
 * negligible parsing overhead.
 *
 * **When to use it**:
 * - Worker↔main `postMessage` payloads dominated by uniform arrays of objects
 * - Cases where `structuredClone` cost is dominated by repeated key strings
 *
 * **When NOT to use it**:
 * - Payloads containing `Date`, `Map`, `Set`, `RegExp` (use `seroval` instead)
 * - Small / single-object payloads (overhead not justified)
 *
 * The factory is async because it dynamically imports the optional `@toon-format/toon` peer.
 *
 * `@toon-format/toon` must be installed separately:
 * ```
 * npm install @toon-format/toon
 * ```
 *
 * @example
 * ```typescript
 * const serializer = await createToonSerializer();
 * const payload = serializer.serialize([
 *   { id: 1, name: 'Alice' },
 *   { id: 2, name: 'Bob' },
 *   { id: 3, name: 'Carol' },
 *   { id: 4, name: 'Dave' },
 *   { id: 5, name: 'Eve' },
 * ]);
 * worker.postMessage({ payload }, payload.transferables);
 * ```
 *
 * @see https://toonformat.dev
 */
export async function createToonSerializer(): Promise<WorkerSerializer> {
  const { encode, decode } = await loadToon();

  return {
    serialize(data: unknown): SerializedPayload {
      return {
        data: encode(data),
        transferables: [],
        format: 'toon',
      };
    },

    deserialize(payload: SerializedPayload): unknown {
      if (payload.format !== 'toon') {
        throw new Error(`Expected format 'toon', got '${payload.format}'`);
      }
      return decode(payload.data as string);
    },
  };
}

/**
 * Conservative threshold below which TOON's overhead outweighs its size benefit.
 * Auto-serializer keeps shorter arrays on `structured-clone`.
 *
 * Exported for testing and for consumers building custom routing logic.
 */
export const MIN_UNIFORM_ARRAY_LENGTH = 5;

/**
 * Detects whether a value is a depth-1 uniform array of plain objects with primitive values.
 *
 * Pure function — no side effects. Used by `createAutoSerializer()` to decide
 * whether to route a payload through TOON.
 *
 * Conditions checked (all must pass):
 * 1. Value is an array with `length >= MIN_UNIFORM_ARRAY_LENGTH`
 * 2. Every item is a non-null, non-array plain object
 * 3. Every item has the same set of keys as the first item
 * 4. Every value across all items is a primitive (string, number, boolean, null)
 *
 * @example
 * ```typescript
 * isUniformObjectArray([{a:1},{a:2},{a:3},{a:4},{a:5}]); // true
 * isUniformObjectArray([{a:1},{b:2}]);                    // false (heterogeneous keys)
 * isUniformObjectArray([{a:[1,2]},{a:[3,4]}]);            // false (nested array value)
 * isUniformObjectArray([{a:1}]);                          // false (length < 5)
 * ```
 */
export function isUniformObjectArray(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < MIN_UNIFORM_ARRAY_LENGTH) {
    return false;
  }

  const first = value[0];
  if (first === null || typeof first !== 'object' || Array.isArray(first)) {
    return false;
  }

  const expectedKeys = Object.keys(first as Record<string, unknown>)
    .sort()
    .join('\u0000');
  if (expectedKeys === '') {
    return false;
  }

  for (const item of value) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      return false;
    }
    const record = item as Record<string, unknown>;
    if (Object.keys(record).sort().join('\u0000') !== expectedKeys) {
      return false;
    }
    for (const v of Object.values(record)) {
      if (v === null) continue;
      const t = typeof v;
      if (t !== 'string' && t !== 'number' && t !== 'boolean') {
        return false;
      }
    }
  }

  return true;
}
