/**
 * Serialized payload ready for postMessage transfer.
 */
export interface SerializedPayload {
  /** Serialized data (may be string, ArrayBuffer, or structured-clone-safe object) */
  data: unknown;
  /** Transferable objects to pass to postMessage (zero-copy) */
  transferables: Transferable[];
  /** Format identifier for deserialization */
  format: 'structured-clone' | 'toon' | 'seroval' | 'custom';
}

/**
 * Pluggable serializer interface for crossing the worker boundary.
 */
export interface WorkerSerializer {
  /** Serialize data for transfer to/from worker */
  serialize(data: unknown): SerializedPayload;
  /** Deserialize data received from worker/main thread */
  deserialize(payload: SerializedPayload): unknown;
}

/**
 * Strategy for automatic serializer selection based on payload shape.
 */
export type SerializerStrategy = 'auto' | 'structured-clone' | 'toon' | 'seroval' | 'custom';

/**
 * Configuration for the auto-detect serializer.
 */
export interface AutoSerializerConfig {
  /** Size threshold (bytes) above which to use ArrayBuffer transfer (default: 102400 = 100 KiB) */
  transferThreshold?: number;
  /** Custom serializer to use when strategy is 'custom' */
  custom?: WorkerSerializer;
}
