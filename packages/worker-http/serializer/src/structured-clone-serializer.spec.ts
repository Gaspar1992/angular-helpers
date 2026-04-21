// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { structuredCloneSerializer } from './structured-clone-serializer';

describe('structuredCloneSerializer', () => {
  it('round-trips a plain object unchanged', () => {
    const input = { id: 1, name: 'alice', enabled: true };
    const payload = structuredCloneSerializer.serialize(input);
    expect(payload.format).toBe('structured-clone');
    expect(payload.transferables).toEqual([]);
    expect(structuredCloneSerializer.deserialize(payload)).toEqual(input);
  });

  it('preserves primitives (number, string, boolean, null)', () => {
    for (const value of [42, 'hello', true, null]) {
      const payload = structuredCloneSerializer.serialize(value);
      expect(structuredCloneSerializer.deserialize(payload)).toBe(value);
    }
  });

  it('preserves Date references (structured clone supports Date)', () => {
    const now = new Date(2024, 0, 15, 12, 30);
    const payload = structuredCloneSerializer.serialize({ when: now });
    const restored = structuredCloneSerializer.deserialize(payload) as { when: Date };
    // Passthrough: same instance since we do NOT actually clone.
    expect(restored.when).toBe(now);
  });

  it('passes ArrayBuffer through as-is (structured clone natively supports it)', () => {
    const buf = new ArrayBuffer(16);
    const payload = structuredCloneSerializer.serialize({ data: buf });
    expect(payload.transferables).toEqual([]);
    const restored = structuredCloneSerializer.deserialize(payload) as { data: ArrayBuffer };
    expect(restored.data).toBe(buf);
  });

  it('does not try to encode functions or symbols (passthrough data field)', () => {
    const fn = () => 1;
    const payload = structuredCloneSerializer.serialize({ fn });
    // Passthrough: the function is still on the object (the actual failure will
    // happen at postMessage time, not at serialize time).
    expect(structuredCloneSerializer.deserialize(payload)).toEqual({ fn });
  });

  it('serialization is a no-op wrapper (reference-equal data on round-trip)', () => {
    const input = { a: 1 };
    const payload = structuredCloneSerializer.serialize(input);
    expect(payload.data).toBe(input);
  });
});
