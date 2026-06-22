import { describe, it, expect } from 'vitest';
import { detectTransferables } from './detect-transferables';

describe('detectTransferables', () => {
  it('should find a top-level ArrayBuffer', () => {
    const buffer = new ArrayBuffer(10);
    const result = detectTransferables(buffer);
    expect(result).toContain(buffer);
    expect(result.length).toBe(1);
  });

  it('should find ArrayBuffers in an object', () => {
    const buffer1 = new ArrayBuffer(10);
    const buffer2 = new ArrayBuffer(20);
    const payload = {
      a: 1,
      b: buffer1,
      c: { d: buffer2 },
    };

    const result = detectTransferables(payload);
    expect(result).toContain(buffer1);
    expect(result).toContain(buffer2);
    expect(result.length).toBe(2);
  });

  it('should filter duplicates', () => {
    const buffer = new ArrayBuffer(10);
    const payload = [buffer, buffer, { x: buffer }];
    const result = detectTransferables(payload);
    expect(result.length).toBe(1);
    expect(result[0]).toBe(buffer);
  });

  it('should return empty array for plain objects', () => {
    expect(detectTransferables({ a: 1, b: 'string' })).toEqual([]);
  });
});
