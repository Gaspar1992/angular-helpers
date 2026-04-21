// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSerovalSerializer } from './seroval-serializer';

// Mock the dynamic `import('seroval')` lookup so the test stays hermetic —
// the package is declared as an optional peer and is NOT installed in CI. The
// mock lives on `Module._resolveFilename` via vi's module registry.
const mockSerialize = vi.fn((value: unknown) => `MOCK(${JSON.stringify(value)})`);
const mockDeserialize = vi.fn((source: string) => JSON.parse(source.slice(5, -1)));

vi.mock('seroval', () => ({
  serialize: mockSerialize,
  deserialize: mockDeserialize,
}));

describe('createSerovalSerializer', () => {
  beforeEach(() => {
    mockSerialize.mockClear();
    mockDeserialize.mockClear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns a serializer that reports format "seroval"', async () => {
    const serializer = await createSerovalSerializer();
    const payload = serializer.serialize({ a: 1 });
    expect(payload.format).toBe('seroval');
    expect(payload.transferables).toEqual([]);
  });

  it('serializes through the underlying seroval implementation', async () => {
    const serializer = await createSerovalSerializer();
    const payload = serializer.serialize({ a: 1, b: 'hello' });
    expect(mockSerialize).toHaveBeenCalledTimes(1);
    expect(typeof payload.data).toBe('string');
  });

  it('round-trips through the mock seroval pipeline', async () => {
    const serializer = await createSerovalSerializer();
    const input = { id: 42, name: 'alice' };
    const payload = serializer.serialize(input);
    const restored = serializer.deserialize(payload);
    expect(restored).toEqual(input);
  });

  it('rejects deserialize with a wrong format', async () => {
    const serializer = await createSerovalSerializer();
    expect(() =>
      serializer.deserialize({
        data: 'whatever',
        transferables: [],
        format: 'structured-clone',
      }),
    ).toThrow(/Expected format 'seroval'/);
  });

  it('invokes deserialize exactly once for each round trip', async () => {
    const serializer = await createSerovalSerializer();
    const payload = serializer.serialize({ x: 1 });
    serializer.deserialize(payload);
    expect(mockDeserialize).toHaveBeenCalledTimes(1);
  });
});
