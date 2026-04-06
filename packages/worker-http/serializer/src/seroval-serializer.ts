import type { SerializedPayload, WorkerSerializer } from './worker-serializer.types';

type SerovalModule = {
  serialize: (value: unknown) => string;
  deserialize: <T>(source: string) => T;
};

let cachedSeroval: SerovalModule | null = null;

async function loadSeroval(): Promise<SerovalModule> {
  if (!cachedSeroval) {
    try {
      // Dynamic import via variable — keeps seroval as optional peer dep (no static reference)
      const id = 'seroval';
      cachedSeroval = (await import(/* @vite-ignore */ id)) as SerovalModule;
    } catch {
      throw new Error(
        'seroval is required as a peer dependency. Install it with: npm install seroval',
      );
    }
  }
  return cachedSeroval;
}

/**
 * Creates a `WorkerSerializer` backed by `seroval` for full type fidelity.
 *
 * Supports `Date`, `Map`, `Set`, `BigInt`, `RegExp`, circular references, and more.
 * The factory is async because it dynamically imports the optional `seroval` peer.
 *
 * `seroval` must be installed separately:
 * ```
 * npm install seroval
 * ```
 *
 * @example
 * ```typescript
 * const serializer = await createSerovalSerializer();
 * const payload = serializer.serialize({ date: new Date(), map: new Map() });
 * const original = serializer.deserialize(payload);
 * ```
 *
 * @see https://github.com/lxsmnsyc/seroval
 */
export async function createSerovalSerializer(): Promise<WorkerSerializer> {
  const { serialize, deserialize } = await loadSeroval();

  return {
    serialize(data: unknown): SerializedPayload {
      return {
        data: serialize(data),
        transferables: [],
        format: 'seroval',
      };
    },

    deserialize(payload: SerializedPayload): unknown {
      if (payload.format !== 'seroval') {
        throw new Error(`Expected format 'seroval', got '${payload.format}'`);
      }
      return deserialize(payload.data as string);
    },
  };
}
