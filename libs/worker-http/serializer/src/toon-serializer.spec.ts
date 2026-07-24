import { describe, expect, it } from 'vitest';
import {
  MIN_UNIFORM_ARRAY_LENGTH,
  createToonSerializer,
  isUniformObjectArray,
} from './toon-serializer';

describe('isUniformObjectArray', () => {
  it('returns true for an array of >= 5 objects with identical primitive keys', () => {
    const data = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 3, name: 'C' },
      { id: 4, name: 'D' },
      { id: 5, name: 'E' },
    ];
    expect(isUniformObjectArray(data)).toBe(true);
  });

  it('exposes a conservative threshold of 5', () => {
    expect(MIN_UNIFORM_ARRAY_LENGTH).toBe(5);
  });

  it('returns false when the array length is below the threshold', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(isUniformObjectArray(data)).toBe(false);
  });

  it('returns false for heterogeneous keys', () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { name: 'no-id' }];
    expect(isUniformObjectArray(data)).toBe(false);
  });

  it('returns true when columns mix primitive types (string/number)', () => {
    const data = [{ a: 1 }, { a: 'x' }, { a: true }, { a: null }, { a: 0 }];
    expect(isUniformObjectArray(data)).toBe(true);
  });

  it('returns false when a value is a nested array', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: i, tags: ['a', 'b'] }));
    expect(isUniformObjectArray(data)).toBe(false);
  });

  it('returns false when a value is a nested plain object', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: i, meta: { k: 'v' } }));
    expect(isUniformObjectArray(data)).toBe(false);
  });

  it('returns false for empty arrays', () => {
    expect(isUniformObjectArray([])).toBe(false);
  });

  it('returns false when the items are primitives, not objects', () => {
    expect(isUniformObjectArray([1, 2, 3, 4, 5])).toBe(false);
  });

  it('returns false for non-array inputs', () => {
    expect(isUniformObjectArray(null)).toBe(false);
    expect(isUniformObjectArray(undefined)).toBe(false);
    expect(isUniformObjectArray(42)).toBe(false);
    expect(isUniformObjectArray('hello')).toBe(false);
    expect(isUniformObjectArray({ id: 1 })).toBe(false);
  });

  it('returns false when items contain Date instances (not primitives)', () => {
    const data = Array.from({ length: 5 }, (_, i) => ({ id: i, when: new Date() }));
    expect(isUniformObjectArray(data)).toBe(false);
  });

  it('returns false when objects have empty key sets', () => {
    const data = [{}, {}, {}, {}, {}];
    expect(isUniformObjectArray(data)).toBe(false);
  });

  it('treats key order as irrelevant', () => {
    const data = [
      { a: 1, b: 'x' },
      { b: 'y', a: 2 },
      { a: 3, b: 'z' },
      { b: 'w', a: 4 },
      { a: 5, b: 'v' },
    ];
    expect(isUniformObjectArray(data)).toBe(true);
  });
});

describe('createToonSerializer', () => {
  it('round-trips a uniform array of objects', async () => {
    const serializer = await createToonSerializer();
    const data = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Carol', active: true },
      { id: 4, name: 'Dave', active: false },
      { id: 5, name: 'Eve', active: true },
    ];

    const payload = serializer.serialize(data);
    expect(payload.format).toBe('toon');
    expect(typeof payload.data).toBe('string');
    expect(payload.transferables).toEqual([]);

    const restored = serializer.deserialize(payload);
    expect(restored).toEqual(data);
  });

  it('produces a smaller payload than JSON for uniform arrays', async () => {
    const serializer = await createToonSerializer();
    const data = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      name: `user-${i}`,
      role: 'member',
      active: true,
    }));

    const payload = serializer.serialize(data);
    const toonSize = (payload.data as string).length;
    const jsonSize = JSON.stringify(data).length;

    expect(toonSize).toBeLessThan(jsonSize);
  });

  it('preserves null values in rows', async () => {
    const serializer = await createToonSerializer();
    const data = [
      { id: 1, note: null },
      { id: 2, note: 'hi' },
      { id: 3, note: null },
      { id: 4, note: 'there' },
      { id: 5, note: null },
    ];

    const restored = serializer.deserialize(serializer.serialize(data));
    expect(restored).toEqual(data);
  });

  it('rejects deserialization when payload format does not match', async () => {
    const serializer = await createToonSerializer();
    expect(() =>
      serializer.deserialize({
        data: 'irrelevant',
        transferables: [],
        format: 'structured-clone',
      }),
    ).toThrow(/Expected format 'toon'/);
  });
});
