import { describe, it, expect } from 'vitest';
import { serializeData, deserializeData } from './serialization.utils';

describe('serialization.utils', () => {
  it('should serialize and deserialize JSON objects by default', async () => {
    const data = { id: 1, name: 'Test', active: true, list: [1, 'two', null] };
    const serialized = await serializeData(data);

    expect(typeof serialized).toBe('string');
    expect(serialized).toBe(JSON.stringify(data));

    const deserialized = await deserializeData<typeof data>(serialized);
    expect(deserialized).toEqual(data);
  });

  it('should serialize and deserialize primitive values', async () => {
    expect(await serializeData('hello')).toBe('"hello"');
    expect(await deserializeData<string>('"hello"')).toBe('hello');

    expect(await serializeData(12345)).toBe('12345');
    expect(await deserializeData<number>('12345')).toBe(12345);

    expect(await serializeData(true)).toBe('true');
    expect(await deserializeData<boolean>('true')).toBe(true);

    expect(await serializeData(null)).toBe('null');
    expect(await deserializeData<null>('null')).toBeNull();
  });

  it('should fallback to JSON serialization when toon module is not found', async () => {
    const data = { complex: 'structure', numbers: [1, 2, 3] };

    // With useToon: true, if @toon-format/toon is not installed/resolvable, it safely falls back to JSON
    const serialized = await serializeData(data, true);
    expect(typeof serialized).toBe('string');

    const deserialized = await deserializeData<typeof data>(serialized, true);
    expect(deserialized).toEqual(data);
  });
});
