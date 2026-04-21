// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { detectTransferables } from './detect-transferables';

describe('detectTransferables', () => {
  it('returns an empty list for primitives and null/undefined', () => {
    expect(detectTransferables(null)).toEqual([]);
    expect(detectTransferables(undefined)).toEqual([]);
    expect(detectTransferables('hello')).toEqual([]);
    expect(detectTransferables(42)).toEqual([]);
    expect(detectTransferables(true)).toEqual([]);
  });

  it('detects a top-level ArrayBuffer', () => {
    const buf = new ArrayBuffer(16);
    expect(detectTransferables(buf)).toEqual([buf]);
  });

  it('detects ArrayBuffers nested one level in an object', () => {
    const buf = new ArrayBuffer(16);
    expect(detectTransferables({ data: buf, name: 'payload' })).toEqual([buf]);
  });

  it('detects ArrayBuffers in an array (one level deep)', () => {
    const a = new ArrayBuffer(16);
    const b = new ArrayBuffer(32);
    expect(detectTransferables([a, b, 'other'])).toEqual([a, b]);
  });

  it('deduplicates when the same transferable is referenced twice', () => {
    const buf = new ArrayBuffer(16);
    const result = detectTransferables({ primary: buf, secondary: buf });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(buf);
  });

  it('does NOT descend past one level (deep buffers are ignored)', () => {
    const buf = new ArrayBuffer(16);
    const payload = { nested: { data: buf } };
    expect(detectTransferables(payload)).toEqual([]);
  });

  it('does NOT treat typed-array views as transferable (caller must pass .buffer)', () => {
    const view = new Uint8Array(16);
    expect(detectTransferables({ view })).toEqual([]);
    expect(detectTransferables({ view: view.buffer })).toEqual([view.buffer]);
  });

  it('returns an empty list for plain objects with no transferables', () => {
    expect(detectTransferables({ a: 1, b: 'hello', c: true })).toEqual([]);
  });
});
