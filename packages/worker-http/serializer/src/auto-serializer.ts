import { structuredCloneSerializer } from './structured-clone-serializer';
import { createSerovalSerializer } from './seroval-serializer';
import { createToonSerializer, isUniformObjectArray } from './toon-serializer';
import type {
  AutoSerializerConfig,
  SerializedPayload,
  WorkerSerializer,
} from './worker-serializer.types';

/**
 * Shallow check for complex types at depth-1 that structured-clone cannot preserve.
 * Depth-1 is intentional: fast and predictable. For deeply nested complex types,
 * use `withWorkerSerialization(await createSerovalSerializer())` explicitly.
 */
function hasComplexType(value: unknown): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  if (
    value instanceof Date ||
    value instanceof Map ||
    value instanceof Set ||
    value instanceof RegExp
  ) {
    return true;
  }

  const items = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  for (const item of items) {
    if (
      item instanceof Date ||
      item instanceof Map ||
      item instanceof Set ||
      item instanceof RegExp
    ) {
      return true;
    }
  }

  return false;
}

function encodeToTransferable(str: string): { data: ArrayBuffer; transferables: Transferable[] } {
  const buffer = new TextEncoder().encode(str).buffer as ArrayBuffer;
  return { data: buffer, transferables: [buffer] };
}

/**
 * Creates an auto-detecting `WorkerSerializer` that picks the best strategy per payload.
 *
 * The factory is async because it pre-loads `seroval` during initialization
 * so the returned serializer methods are fully synchronous (no await in hot path).
 *
 * Strategy selection per `serialize()` call (top-down, first match wins):
 * 1. Contains `Date`, `Map`, `Set`, or `RegExp` at depth-1 → `seroval` (full fidelity)
 * 2. Uniform array of plain objects (length ≥ 5, primitive values, identical key set)
 *    → `toon` (30–60% size reduction)
 * 3. Otherwise → structured clone (native, zero overhead)
 *
 * Large payloads (> `transferThreshold`, default 100 KiB) are encoded to
 * `ArrayBuffer` and added to `transferables` for zero-copy `postMessage` transfer.
 *
 * @example
 * ```typescript
 * const auto = await createAutoSerializer();
 * const payload = auto.serialize({ users, fetchedAt: new Date() });
 * worker.postMessage({ payload }, payload.transferables);
 * ```
 */
export async function createAutoSerializer(
  config?: AutoSerializerConfig,
): Promise<WorkerSerializer> {
  const transferThreshold = config?.transferThreshold ?? 102_400;

  let sv: WorkerSerializer | null = null;
  try {
    sv = await createSerovalSerializer();
  } catch {
    // seroval not installed — complex types will throw at serialize time with a clear message
  }

  let toon: WorkerSerializer | null = null;
  try {
    toon = await createToonSerializer();
  } catch {
    // @toon-format/toon not installed — uniform arrays will fall back to structured-clone
  }

  return {
    serialize(data: unknown): SerializedPayload {
      let payload: SerializedPayload;

      if (hasComplexType(data)) {
        if (!sv) {
          throw new Error(
            'seroval is required to serialize complex types (Date, Map, Set, RegExp). ' +
              'Install it with: npm install seroval',
          );
        }
        payload = sv.serialize(data);
      } else if (toon && isUniformObjectArray(data)) {
        payload = toon.serialize(data);
      } else {
        payload = structuredCloneSerializer.serialize(data);
      }

      if (payload.transferables.length === 0 && typeof payload.data === 'string') {
        const approxBytes = payload.data.length * 2;
        if (approxBytes > transferThreshold) {
          const { data: buffer, transferables } = encodeToTransferable(payload.data);
          return { data: buffer, transferables, format: payload.format };
        }
      }

      return payload;
    },

    deserialize(payload: SerializedPayload): unknown {
      let resolved = payload;

      if (payload.data instanceof ArrayBuffer) {
        const str = new TextDecoder().decode(payload.data);
        resolved = { ...payload, data: str };
      }

      if (resolved.format === 'structured-clone') {
        return structuredCloneSerializer.deserialize(resolved);
      }

      if (resolved.format === 'seroval') {
        if (!sv) {
          throw new Error(
            'seroval is required to deserialize this payload. ' +
              'Install it with: npm install seroval',
          );
        }
        return sv.deserialize(resolved);
      }

      if (resolved.format === 'toon') {
        if (!toon) {
          throw new Error(
            '@toon-format/toon is required to deserialize this payload. ' +
              'Install it with: npm install @toon-format/toon',
          );
        }
        return toon.deserialize(resolved);
      }

      throw new Error(`Unknown serialization format: '${resolved.format}'`);
    },
  };
}
