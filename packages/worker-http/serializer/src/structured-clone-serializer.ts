import type { WorkerSerializer, SerializedPayload } from './worker-serializer.types';

/**
 * Default serializer that relies on the browser's native structured clone algorithm.
 * Zero overhead — data is passed directly to postMessage without transformation.
 *
 * Best for: small payloads (< 100 KiB), simple types.
 * Limitations: cannot handle functions, DOM nodes, or class instances with prototype chains.
 */
export const structuredCloneSerializer: WorkerSerializer = {
  serialize(data: unknown): SerializedPayload {
    return {
      data,
      transferables: [],
      format: 'structured-clone',
    };
  },

  deserialize(payload: SerializedPayload): unknown {
    return payload.data;
  },
};
