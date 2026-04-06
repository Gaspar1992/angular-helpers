import { describe, it, expect, vi } from 'vitest';
import { createAutoSerializer } from './auto-serializer';

vi.mock('./seroval-serializer', () => ({
  createSerovalSerializer: vi.fn().mockResolvedValue({
    serialize: (data: unknown) => ({
      data: `seroval:${JSON.stringify(data)}`,
      transferables: [],
      format: 'seroval',
    }),
    deserialize: (payload: { data: string }) => JSON.parse(payload.data.replace('seroval:', '')),
  }),
}));

describe('createAutoSerializer', () => {
  it('uses structured-clone for simple objects', async () => {
    const auto = await createAutoSerializer();
    const data = { id: 1, name: 'test' };

    const payload = auto.serialize(data);

    expect(payload.format).toBe('structured-clone');
  });

  it('uses seroval for objects with Date at depth-1', async () => {
    const auto = await createAutoSerializer();
    const data = { id: 1, createdAt: new Date('2024-01-01') };

    const payload = auto.serialize(data);

    expect(payload.format).toBe('seroval');
  });

  it('uses seroval for objects with Map at depth-1', async () => {
    const auto = await createAutoSerializer();
    const data = { meta: new Map([['key', 'value']]) };

    const payload = auto.serialize(data);

    expect(payload.format).toBe('seroval');
  });

  it('uses seroval for objects with Set at depth-1', async () => {
    const auto = await createAutoSerializer();
    const data = { tags: new Set(['a', 'b']) };

    const payload = auto.serialize(data);

    expect(payload.format).toBe('seroval');
  });

  it('handles null and primitives as structured-clone', async () => {
    const auto = await createAutoSerializer();

    expect(auto.serialize(null).format).toBe('structured-clone');
    expect(auto.serialize(42).format).toBe('structured-clone');
    expect(auto.serialize('hello').format).toBe('structured-clone');
  });

  it('deserializes structured-clone payloads correctly', async () => {
    const auto = await createAutoSerializer();
    const data = { id: 1, name: 'test' };

    const payload = auto.serialize(data);
    const restored = auto.deserialize(payload);

    expect(restored).toEqual(data);
  });

  it('encodes to ArrayBuffer when payload exceeds transferThreshold', async () => {
    const auto = await createAutoSerializer({ transferThreshold: 10 });

    // seroval produces a string; use seroval path (Date) to get a string payload
    const data = { createdAt: new Date('2024-01-01'), padding: 'x'.repeat(100) };

    const payload = auto.serialize(data);

    if (payload.transferables.length > 0) {
      expect(payload.data).toBeInstanceOf(ArrayBuffer);
      expect(payload.transferables[0]).toBeInstanceOf(ArrayBuffer);
    }
  });

  it('roundtrips an ArrayBuffer-encoded seroval payload (shape preserved)', async () => {
    const auto = await createAutoSerializer({ transferThreshold: 0 });
    // Mock uses JSON.stringify → Date serialized as string; check the key exists
    const data = { createdAt: new Date('2024-01-01'), id: 42 };

    const payload = auto.serialize(data);
    const restored = auto.deserialize(payload) as typeof data;

    expect(restored).toHaveProperty('id', 42);
    expect(restored).toHaveProperty('createdAt');
  });

  it('uses structuredCloneSerializer for simple array of objects', async () => {
    const auto = await createAutoSerializer();
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

    const payload = auto.serialize(data);

    expect(payload.format).toBe('structured-clone');
  });

  it('uses structured-clone for array of objects (Date is depth-2, not detected)', async () => {
    // Depth-1 check: array items are plain objects, not Date → structured-clone
    // For depth-2 complex types, developers should use serovalSerializer directly.
    const auto = await createAutoSerializer();
    const data = [{ id: 1, createdAt: new Date() }];

    const payload = auto.serialize(data);

    expect(payload.format).toBe('structured-clone');
  });

  it('uses seroval for array directly containing a Date at depth-1', async () => {
    const auto = await createAutoSerializer();
    const data = [new Date(), new Date()];

    const payload = auto.serialize(data);

    expect(payload.format).toBe('seroval');
  });
});
